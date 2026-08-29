import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { logAudit } from '../services/auditService';
import { sendNotification } from '../services/notificationService';

const router = Router();

// GET /api/inspections — list inspections
router.get('/', async (req: AuthRequest, res: Response) => {
  const isOfficer = ['officer', 'admin', 'super_admin'].includes(req.user!.role);

  let query = supabaseAdmin
    .from('inspections')
    .select(`
      id, application_id, scheduled_at, inspector_name,
      approvals_covered, departments, status, inspection_type,
      location, findings, result, completed_at, created_at,
      applications!inner(
        id, project_id,
        projects!inner(
          id, name, district,
          businesses!inner(id, name, owner_id)
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (!isOfficer) {
    query = query.eq('applications.projects.businesses.owner_id', req.user!.id);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  res.json({ inspections: data || [], data: data || [] });
});

// POST /api/inspections/schedule — officer schedules an on-site inspection
router.post('/schedule', async (req: AuthRequest, res: Response) => {
  const {
    application_id,
    scheduled_at,
    inspector_name,
    inspection_type = 'Joint Statutory Single-Window Site Inspection',
    location,
    approvals_covered,
    departments,
    notes,
  } = req.body;

  if (!application_id || !scheduled_at) {
    return res.status(400).json({ error: 'application_id and scheduled_at date are required' });
  }

  const { data: application } = await supabaseAdmin
    .from('applications')
    .select('id, project_id, projects(businesses(id, owner_id, name, address))')
    .eq('id', application_id)
    .single();

  const business = (application as any)?.projects?.businesses;
  const targetLocation = location || business?.address || 'MIDC Industrial Area, Pune';
  const assignedInspector = inspector_name || req.user?.full_name || 'Designated Inspection Officer';

  // Check if an inspection already exists for this application
  const { data: existing } = await supabaseAdmin
    .from('inspections')
    .select('id')
    .eq('application_id', application_id)
    .maybeSingle();

  let inspection: any;
  if (existing) {
    const resUpdate = await supabaseAdmin
      .from('inspections')
      .update({
        scheduled_at,
        inspector_name: assignedInspector,
        inspection_type,
        location: targetLocation,
        approvals_covered: approvals_covered || ['Consent to Establish', 'Factory Plan Sanction'],
        departments: departments || ['MPCB', 'MIDC', 'MFES'],
        status: 'scheduled',
        notes: notes || '',
      })
      .eq('id', existing.id)
      .select()
      .single();
    inspection = resUpdate.data;
  } else {
    const resInsert = await supabaseAdmin
      .from('inspections')
      .insert({
        application_id,
        scheduled_at,
        inspector_name: assignedInspector,
        inspection_type,
        location: targetLocation,
        approvals_covered: approvals_covered || ['Consent to Establish', 'Factory Plan Sanction'],
        departments: departments || ['MPCB', 'MIDC', 'MFES'],
        status: 'scheduled',
        notes: notes || '',
      })
      .select()
      .single();
    inspection = resInsert.data;
  }

  // Update application_approvals status to inspection_scheduled
  const { data: approvals } = await supabaseAdmin
    .from('application_approvals')
    .select('id, status')
    .eq('application_id', application_id);

  for (const aa of approvals ?? []) {
    if (aa.status === 'submitted' || aa.status === 'under_scrutiny' || aa.status === 'inspection_required') {
      await supabaseAdmin
        .from('application_approvals')
        .update({ status: 'inspection_scheduled' })
        .eq('id', aa.id);
    }
  }

  // Send notification to applicant with date
  if (business?.owner_id) {
    const formattedDate = new Date(scheduled_at).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    await sendNotification(
      business.owner_id,
      'inspection_scheduled',
      'Site Inspection Scheduled',
      `Your joint on-site inspection is scheduled on ${formattedDate} by Inspector ${assignedInspector} at ${targetLocation}.`,
      'inspection',
      inspection.id
    );
  }

  await logAudit(req.user!.id, 'INSPECTION_SCHEDULED', {
    inspection_id: inspection.id,
    application_id,
    scheduled_at,
    inspector: assignedInspector,
  });

  res.status(201).json({ inspection, data: inspection });
});

// POST /api/inspections/:id/complete — complete inspection & record findings
router.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  const { findings, result = 'approved' } = req.body;

  const { data: insp, error: inspError } = await supabaseAdmin
    .from('inspections')
    .select('*, applications(projects(businesses(owner_id)))')
    .eq('id', req.params.id)
    .single();

  if (inspError || !insp) return res.status(404).json({ error: 'Inspection not found' });

  const { data: updated } = await supabaseAdmin
    .from('inspections')
    .update({
      status: 'completed',
      result,
      findings: findings || 'On-site verification completed successfully. All safety and pollution mitigation equipment verified in order.',
      completed_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  // Update approvals
  const { data: approvals } = await supabaseAdmin
    .from('application_approvals')
    .select('id, status')
    .eq('application_id', insp.application_id);

  for (const aa of approvals ?? []) {
    if (aa.status === 'inspection_scheduled') {
      await supabaseAdmin
        .from('application_approvals')
        .update({ status: result === 'approved' ? 'approved' : 'under_scrutiny', decided_at: new Date().toISOString() })
        .eq('id', aa.id);
    }
  }

  const ownerId = (insp as any)?.applications?.projects?.businesses?.owner_id;
  if (ownerId) {
    await sendNotification(
      ownerId,
      'inspection_completed',
      'Site Inspection Completed',
      `Your site inspection has been marked completed with result: ${result.toUpperCase()}. Official report uploaded.`,
      'inspection',
      insp.id
    );
  }

  await logAudit(req.user!.id, 'INSPECTION_COMPLETED', {
    inspection_id: req.params.id,
    result,
  });

  res.json({ inspection: updated, data: updated });
});

// GET /api/inspections/calendar — returns combined multi-department inspection calendar
router.get('/calendar', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('inspections')
    .select(`
      id, application_id, scheduled_at, inspector_name,
      approvals_covered, departments, status, inspection_type,
      location, findings, result, completed_at,
      applications(projects(name, district, businesses(name, owner_id)))
    `)
    .order('scheduled_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  const events = (data || []).map((insp: any) => ({
    id: insp.id,
    title: `Joint Inspection: ${(insp.departments || []).join(' + ')}`,
    company: insp.applications?.projects?.businesses?.name || 'Industrial Applicant',
    project: insp.applications?.projects?.name || 'Manufacturing Unit',
    scheduled_at: insp.scheduled_at,
    departments: insp.departments || ['MPCB', 'DISH', 'Fire'],
    inspector: insp.inspector_name,
    status: insp.status,
    location: insp.location,
  }));

  res.json({ events, data: events });
});

export default router;
