import { supabaseAdmin } from '../lib/supabase';
import { calculateSLADeadline } from './slaService';
import { sendNotification } from './notificationService';
import { logAudit } from './auditService';
import { generateApprovalChecklist } from './approvalIntelligenceService';

export async function createApplicationWithApprovals(
  projectId: string,
  userId: string
): Promise<{ application_id: string; approvals_count: number; checklist: any[] }> {
  // Get project with business info
  const { data: project, error: projError } = await supabaseAdmin
    .from('projects')
    .select('*, businesses(*)')
    .eq('id', projectId)
    .single();

  if (projError || !project) throw new Error('Project not found');

  // Verify the user owns this business
  if (project.businesses.owner_id !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const analysis = await generateApprovalChecklist({
    sector: project.businesses.sector,
    location_state: project.location_state,
    investment_crore: project.investment_crore,
    employee_count: project.employee_count,
    project_size: project.project_size,
    pollution_category: project.pollution_category,
    stage: project.stage,
    hazardous_materials: project.hazardous_materials,
    pharma_sub_category: project.pharma_sub_category,
    land_ownership_type: project.land_ownership_type,
    connected_load_kw: project.connected_load_kw,
  });

  const checklist = analysis.approvals.filter(a => a.status !== 'not_applicable');

  // Upsert application
  const { data: existing } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  let applicationId: string;

  if (existing) {
    applicationId = existing.id;
    await supabaseAdmin
      .from('applications')
      .update({ status: 'submitted', updated_at: new Date().toISOString() })
      .eq('id', applicationId);
  } else {
    const { data: app, error: appErr } = await supabaseAdmin
      .from('applications')
      .insert({ project_id: projectId, status: 'submitted' })
      .select()
      .single();
    if (appErr || !app) throw new Error('Failed to create application');
    applicationId = app.id;
  }

  // Get department officers for assignment notifications
  const { data: officers } = await supabaseAdmin
    .from('profiles')
    .select('id, department_id')
    .eq('role', 'officer');

  const deptOfficerMap = new Map<string, string>();
  (officers ?? []).forEach((o: any) => {
    if (o.department_id) deptOfficerMap.set(o.department_id, o.id);
  });

  // Create application_approvals for each applicable approval (idempotent)
  for (const item of checklist) {
    const { data: existingAa } = await supabaseAdmin
      .from('application_approvals')
      .select('id')
      .eq('application_id', applicationId)
      .eq('approval_type_id', item.approval_type_id)
      .maybeSingle();

    if (!existingAa) {
      const slaDeadline = calculateSLADeadline(new Date(), item.sla_days);
      await supabaseAdmin.from('application_approvals').insert({
        application_id: applicationId,
        approval_type_id: item.approval_type_id,
        department_id: item.department_id,
        status: 'submitted',
        requires_inspection: item.requires_inspection ?? false,
        sla_due_at: slaDeadline.toISOString(),
        submitted_at: new Date().toISOString(),
      });

      // Notify assigned officer
      const officerId = deptOfficerMap.get(item.department_id);
      if (officerId) {
        await sendNotification(
          officerId,
          'new_application',
          'New Application Assigned',
          `A new application for "${item.approval_name}" has been submitted and assigned to your department.`,
          'application',
          applicationId
        );
      }
    }
  }

  // Notify entrepreneur
  await sendNotification(
    userId,
    'application_submitted',
    'Application Submitted',
    `Your application has been submitted successfully with ${checklist.length} approval workflow(s) initiated.`,
    'application',
    applicationId
  );

  await logAudit(userId, 'APPLICATION_SUBMITTED', {
    application_id: applicationId,
    project_id: projectId,
    approvals_count: checklist.length,
  });

  return { application_id: applicationId, approvals_count: checklist.length, checklist };
}

// Valid state machine transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ['under_scrutiny', 'rejected'],
  under_scrutiny: ['query_raised', 'inspection_required', 'approved', 'rejected'],
  query_raised: ['under_scrutiny'],
  inspection_required: ['inspection_scheduled'],
  inspection_scheduled: ['inspection_completed'],
  inspection_completed: ['approved', 'rejected'],
};

export async function transitionStatus(
  approvalId: string,
  newStatus: string,
  officerId: string,
  notes?: string,
  reason?: string
): Promise<{ success: boolean; from: string; to: string }> {
  const { data: current, error } = await supabaseAdmin
    .from('application_approvals')
    .select('status, application_id')
    .eq('id', approvalId)
    .single();

  if (error || !current) throw new Error('Application approval not found');

  const allowed = VALID_TRANSITIONS[current.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(`Cannot transition from "${current.status}" to "${newStatus}"`),
      { status: 400 }
    );
  }

  const updateData: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (notes) updateData.officer_notes = notes;
  if (reason) updateData.rejection_reason = reason;
  if (newStatus === 'approved' || newStatus === 'rejected') {
    updateData.decided_at = new Date().toISOString();
    updateData.decided_by = officerId;
  }

  await supabaseAdmin.from('application_approvals').update(updateData).eq('id', approvalId);

  // On approval, create compliance obligations
  if (newStatus === 'approved') {
    await createComplianceObligations(approvalId);
  }

  await logAudit(officerId, 'STATUS_TRANSITION', {
    approval_id: approvalId,
    from: current.status,
    to: newStatus,
    notes,
    reason,
  });

  return { success: true, from: current.status, to: newStatus };
}

async function createComplianceObligations(approvalId: string): Promise<void> {
  const { data: approval } = await supabaseAdmin
    .from('application_approvals')
    .select('approval_type_id, department_id')
    .eq('id', approvalId)
    .single();

  if (!approval) return;

  const obligations = [
    { name: 'Annual Compliance Report', frequency: 'annual', days_offset: 365 },
    { name: 'Renewal Application', frequency: 'as_required', days_offset: 300 },
  ];

  for (const ob of obligations) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + ob.days_offset);
    await supabaseAdmin.from('compliance_obligations').insert({
      application_approval_id: approvalId,
      name: ob.name,
      department_id: approval.department_id,
      frequency: ob.frequency,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
    });
  }
}
