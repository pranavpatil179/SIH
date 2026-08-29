import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { WorkflowOrchestrator } from '../engines/workflow/WorkflowOrchestrator';
import { RiskEngine } from '../engines/risk/RiskEngine';
import { AuditService } from '../services/audit/AuditService';

const router = Router();
const orchestrator = new WorkflowOrchestrator();
const riskEngine = new RiskEngine();
const audit = new AuditService();

// GET /officer/queue — applications assigned to officer's department (real DB query)
router.get('/queue', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    // Get officer's department
    let departmentId: string | null = null;
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('department_id, role')
        .eq('id', userId)
        .single();
      departmentId = profile?.department_id ?? null;
    }

    // Build query
    let query = supabaseAdmin
      .from('application_approvals')
      .select(`
        id,
        status,
        scrutiny_level,
        requires_inspection,
        risk_score,
        risk_level,
        sla_due_at,
        submitted_at,
        decided_at,
        query_note,
        approval_type_id,
        department_id,
        applications!inner (
          id,
          status,
          created_at,
          projects!inner (
            id,
            name,
            location_state,
            project_size,
            sector,
            investment_crore,
            businesses!inner (
              name,
              owner_id
            )
          )
        ),
        approval_types!inner (
          name,
          sla_days
        )
      `)
      .not('status', 'eq', 'approved')
      .not('status', 'eq', 'rejected')
      .order('submitted_at', { ascending: true });

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Annotate with SLA status
    const now = new Date();
    const annotated = (data || []).map((item: any) => {
      const due = item.sla_due_at ? new Date(item.sla_due_at) : null;
      const sub = item.submitted_at ? new Date(item.submitted_at) : null;
      let slaStatus = 'on_track';
      let slaPercent = 0;

      if (due && sub) {
        const totalMs = due.getTime() - sub.getTime();
        const elapsedMs = now.getTime() - sub.getTime();
        slaPercent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
        if (now > due) slaStatus = 'breached';
        else if (slaPercent >= 80) slaStatus = 'at_risk';
      }

      return { ...item, sla_status: slaStatus, sla_percent: slaPercent };
    });

    res.json(annotated);
  } catch (err) {
    next(err);
  }
});

// GET /officer/dashboard — aggregated stats for officer/department
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    let departmentId: string | null = null;

    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('department_id')
        .eq('id', userId)
        .single();
      departmentId = profile?.department_id ?? null;
    }

    let baseQuery = supabaseAdmin.from('application_approvals').select('id, status, sla_due_at, submitted_at, risk_level');
    if (departmentId) baseQuery = (baseQuery as any).eq('department_id', departmentId);

    const { data: all } = await baseQuery;
    const now = new Date();
    const items = all || [];

    const pending = items.filter((i: any) => !['approved', 'rejected'].includes(i.status)).length;
    const breached = items.filter((i: any) => i.sla_due_at && new Date(i.sla_due_at) < now && !['approved', 'rejected'].includes(i.status)).length;
    const atRisk = items.filter((i: any) => {
      if (!i.sla_due_at || !i.submitted_at) return false;
      const due = new Date(i.sla_due_at);
      const sub = new Date(i.submitted_at);
      const total = due.getTime() - sub.getTime();
      const elapsed = now.getTime() - sub.getTime();
      const pct = elapsed / total;
      return pct >= 0.8 && pct < 1 && !['approved', 'rejected'].includes(i.status);
    }).length;

    // Active queries
    let queriesQuery = supabaseAdmin.from('queries').select('id').eq('status', 'open');
    if (departmentId) {
      const { data: deptApprovals } = await supabaseAdmin
        .from('application_approvals')
        .select('id')
        .eq('department_id', departmentId);
      const ids = (deptApprovals || []).map((a: any) => a.id);
      if (ids.length > 0) {
        queriesQuery = (queriesQuery as any).in('application_approval_id', ids);
      }
    }
    const { count: queriesCount } = await (queriesQuery as any).select('id', { count: 'exact', head: true });

    // Inspections today
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    let inspQuery = supabaseAdmin.from('inspections').select('id', { count: 'exact', head: true })
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString());
    const { count: inspToday } = await inspQuery;

    // Risk distribution
    const highRisk = items.filter((i: any) => i.risk_level === 'HIGH').length;
    const medRisk = items.filter((i: any) => i.risk_level === 'MEDIUM').length;
    const lowRisk = items.filter((i: any) => i.risk_level === 'LOW').length;

    res.json({
      pending,
      at_risk: atRisk,
      sla_breached: breached,
      queries: queriesCount ?? 0,
      inspections_today: inspToday ?? 0,
      risk_distribution: { HIGH: highRisk, MEDIUM: medRisk, LOW: lowRisk },
      data_source: 'LIVE'
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /officer/approvals/:id/status — officer changes approval status
router.patch('/approvals/:id/status', async (req, res, next) => {
  try {
    const { status, reason, conditions, officer_id } = req.body;
    const approvalId = req.params.id;

    const validTransitions: Record<string, string[]> = {
      submitted: ['under_scrutiny'],
      under_scrutiny: ['query_raised', 'inspection_required', 'approved', 'rejected'],
      query_raised: ['under_scrutiny'],
      inspection_required: ['inspection_scheduled'],
      inspection_scheduled: ['inspection_completed'],
      inspection_completed: ['approved', 'rejected'],
    };

    const { data: current } = await supabaseAdmin
      .from('application_approvals')
      .select('status, applications(project_id, projects(businesses(owner_id)))')
      .eq('id', approvalId)
      .single();

    if (!current) { res.status(404).json({ error: 'Approval not found' }); return; }

    const allowed = validTransitions[current.status] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `Invalid transition from ${current.status} to ${status}` });
      return;
    }

    const updateData: any = {
      status,
      ...(status === 'approved' || status === 'rejected' ? {
        decided_at: new Date().toISOString(),
        decided_by: officer_id,
        ...(reason ? { rejection_reason: reason } : {}),
        ...(conditions ? { conditions } : {}),
      } : {})
    };

    const { data: updated } = await supabaseAdmin
      .from('application_approvals')
      .update(updateData)
      .eq('id', approvalId)
      .select()
      .single();

    // Get applicant user_id for notification
    const ownerId = (current as any).applications?.projects?.businesses?.owner_id;

    // Send notification to applicant
    if (ownerId) {
      const notifMessages: Record<string, { title: string; message: string }> = {
        under_scrutiny: { title: 'Application Under Scrutiny', message: 'Your application is now being reviewed by the department officer.' },
        query_raised: { title: 'Action Required: Query Raised', message: 'The department officer has raised a query on your application. Please respond.' },
        inspection_required: { title: 'Inspection Required', message: 'An inspection has been requested for your application.' },
        approved: { title: '✅ Approval Granted', message: 'Congratulations! Your application has been approved.' },
        rejected: { title: '❌ Application Rejected', message: `Your application has been rejected. Reason: ${reason || 'See application details.'}` },
      };

      const notif = notifMessages[status];
      if (notif) {
        await supabaseAdmin.from('notifications').insert({
          user_id: ownerId,
          type: `status_${status}`,
          title: notif.title,
          message: notif.message,
          entity_type: 'application_approval',
          entity_id: approvalId
        });
      }
    }

    await audit.log(officer_id || 'system', 'STATUS_CHANGED', 'application_approvals', approvalId,
      undefined, { old: current.status }, { new: status });

    // If approved, generate compliance obligations
    if (status === 'approved') {
      const { data: approvalType } = await supabaseAdmin
        .from('approval_types')
        .select('*')
        .eq('id', updated.approval_type_id)
        .single();

      if (approvalType) {
        await supabaseAdmin.from('compliance_obligations').insert({
          application_approval_id: approvalId,
          name: `${approvalType.name} — Annual Renewal`,
          description: `Renewal obligation for ${approvalType.name}`,
          department_id: updated.department_id,
          frequency: 'annual',
          due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'upcoming',
          source: approvalType.legal_basis
        });
      }
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /officer/approvals/:id/risk-assess — trigger risk assessment
router.post('/approvals/:id/risk-assess', async (req, res, next) => {
  try {
    const { data: approval } = await supabaseAdmin
      .from('application_approvals')
      .select('*, applications!inner(project_id, projects!inner(*))')
      .eq('id', req.params.id)
      .single();

    if (!approval) { res.status(404).json({ error: 'Not found' }); return; }

    const project = (approval as any).applications?.projects;
    const risk = await riskEngine.assessRisk(project);

    // Store risk in the approval
    await supabaseAdmin.from('application_approvals').update({
      risk_score: risk.score,
      risk_level: risk.risk_level
    }).eq('id', req.params.id);

    // Also store in risk_assessments table
    await supabaseAdmin.from('risk_assessments').insert({
      application_id: (approval as any).applications?.id,
      overall_score: risk.score,
      risk_level: risk.risk_level,
      factors: risk.factors,
      data_source: 'AI_ANALYSIS'
    });

    res.json(risk);
  } catch (err) {
    next(err);
  }
});

export default router;
