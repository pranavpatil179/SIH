import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { logAudit } from '../services/auditService';
import { sendNotification } from '../services/notificationService';

const router = Router();

// In-memory fallback if grievances table is not in supabase migration
let localGrievances: any[] = [
  {
    id: 'grv_001',
    ticket_number: 'GRV-MH-2026-4821',
    user_id: 'user_entrepreneur',
    applicant_name: 'Rajesh Kumar (Apex Pharma)',
    application_id: 'app_sample_01',
    approval_name: 'Consent to Establish (CTE)',
    department_id: 'dept_mpcb',
    department_name: 'Maharashtra Pollution Control Board (MPCB)',
    category: 'inspection_delayed',
    category_label: 'Joint Inspection Delay Beyond RTS Limit',
    subject: 'Delayed ETP Physical Inspection beyond 15-Day Statutory SLA',
    description: 'Our factory layout and ETP blueprints were submitted 20 days ago. The scheduled joint site inspection has not taken place without any official intimation.',
    status: 'in_review',
    priority: 'high',
    sla_due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    resolution_order: null,
    resolved_by: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// GET /api/grievances — list grievances
router.get('/', async (req: AuthRequest, res: Response) => {
  const isAuthority = ['admin', 'super_admin', 'officer'].includes(req.user!.role);

  try {
    let query = supabaseAdmin
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAuthority) {
      query = query.eq('user_id', req.user!.id);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return res.json({ grievances: data, data });
    }
  } catch (e) {
    // Fallback to local memory
  }

  const results = isAuthority
    ? localGrievances
    : localGrievances.filter((g) => g.user_id === req.user!.id || req.user!.role === 'entrepreneur');

  res.json({ grievances: results, data: results });
});

// POST /api/grievances — file a formal grievance / appeal
router.post('/', async (req: AuthRequest, res: Response) => {
  const {
    application_id,
    approval_name,
    department_id,
    department_name,
    category = 'sla_breach',
    subject,
    description,
  } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and detailed description are required' });
  }

  const ticketNumber = `GRV-MH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const slaDueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7-Day RTS Statutory Resolution

  const categoryLabels: Record<string, string> = {
    sla_breach: 'Statutory SLA Timeline Breach',
    unreasonable_query: 'Unreasonable or Repetitive Query Raised',
    inspection_delayed: 'Inspection Delay Beyond Statutory Limit',
    fee_dispute: 'Statutory Fee Calculation Dispute',
    department_inaction: 'Department Inaction / Undue Scrutiny Delay',
    other: 'General Administrative Grievance',
  };

  const newGrievance = {
    id: `grv_${Date.now()}`,
    ticket_number: ticketNumber,
    user_id: req.user!.id,
    applicant_name: req.user!.full_name || 'Industrial Applicant',
    application_id: application_id || null,
    approval_name: approval_name || 'Single Window Clearance Dossier',
    department_id: department_id || 'dept_state_nodal',
    department_name: department_name || 'State Nodal Single Window Directorate',
    category,
    category_label: categoryLabels[category] || 'General Grievance',
    subject,
    description,
    status: 'submitted',
    priority: category === 'sla_breach' || category === 'inspection_delayed' ? 'high' : 'medium',
    sla_due_at: slaDueAt,
    resolution_order: null,
    resolved_by: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('grievances')
      .insert(newGrievance)
      .select()
      .single();

    if (!error && data) {
      localGrievances.unshift(data);
    } else {
      localGrievances.unshift(newGrievance);
    }
  } catch (e) {
    localGrievances.unshift(newGrievance);
  }

  await logAudit(req.user!.id, 'GRIEVANCE_FILED', {
    ticket_number: ticketNumber,
    subject,
    category,
  });

  // Notify applicant
  await sendNotification(
    req.user!.id,
    'grievance_filed',
    'Grievance Registered Successfully',
    `Your formal grievance ${ticketNumber} has been escalated to the State Nodal Appellate Authority with a 7-day RTS resolution SLA.`,
    'grievance',
    newGrievance.id
  );

  res.status(201).json({ grievance: newGrievance, data: newGrievance });
});

// POST /api/grievances/:id/resolve — appellate authority resolves grievance with binding order
router.post('/:id/resolve', async (req: AuthRequest, res: Response) => {
  const { resolution_order, status = 'resolved' } = req.body;

  if (!resolution_order) {
    return res.status(400).json({ error: 'Binding resolution order is required' });
  }

  const grvIdx = localGrievances.findIndex((g) => g.id === req.params.id || g.ticket_number === req.params.id);
  if (grvIdx >= 0) {
    localGrievances[grvIdx].status = status;
    localGrievances[grvIdx].resolution_order = resolution_order;
    localGrievances[grvIdx].resolved_by = req.user!.full_name || 'State Nodal Appellate Authority';
    localGrievances[grvIdx].resolved_at = new Date().toISOString();

    const grv = localGrievances[grvIdx];

    // Notify applicant of resolution
    await sendNotification(
      grv.user_id,
      'grievance_resolved',
      'Appellate Grievance Resolution Order Issued',
      `Official resolution order issued for ${grv.ticket_number}: "${resolution_order.slice(0, 100)}..."`,
      'grievance',
      grv.id
    );

    await logAudit(req.user!.id, 'GRIEVANCE_RESOLVED', {
      grievance_id: grv.id,
      ticket_number: grv.ticket_number,
      resolution_order,
    });

    return res.json({ grievance: grv, data: grv });
  }

  try {
    const { data: updated, error } = await supabaseAdmin
      .from('grievances')
      .update({
        status,
        resolution_order,
        resolved_by: req.user!.full_name || 'State Nodal Appellate Authority',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ grievance: updated, data: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
