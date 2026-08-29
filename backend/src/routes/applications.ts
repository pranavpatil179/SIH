import { Router, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { createApplicationWithApprovals, transitionStatus } from '../services/workflowService';
import { getSLAStatus } from '../services/slaService';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// POST /api/applications — submit an application (triggers workflow engine)
router.post('/', async (req: AuthRequest, res: Response) => {
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });

  const result = await createApplicationWithApprovals(project_id, req.user!.id);
  res.status(201).json({ data: result, result });
});

// GET /api/applications — list applications
router.get('/', async (req: AuthRequest, res: Response) => {
  const isOfficer = ['officer', 'admin', 'super_admin'].includes(req.user!.role);

  let query = supabaseAdmin
    .from('application_approvals')
    .select(`
      id, application_id, approval_type_id, department_id, status,
      requires_inspection, sla_due_at, submitted_at, decided_at,
      approval_number, officer_notes, rejection_reason,
      approval_types(id, name, sla_days, authority, legal_basis, required_documents, fee_note),
      departments(id, name),
      applications!inner(
        id, project_id,
        projects!inner(
          id, name, location_state, district,
          businesses!inner(id, name, sector, owner_id)
        )
      )
    `)
    .order('submitted_at', { ascending: false });

  if (!isOfficer) {
    query = query.eq('applications.projects.businesses.owner_id', req.user!.id);
  } else if (req.user!.role === 'officer' && req.user!.department_id) {
    query = query.eq('department_id', req.user!.department_id);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  const enriched = (data ?? []).map((aa: any) => ({
    ...aa,
    sla_status: aa.sla_due_at ? getSLAStatus(new Date(aa.sla_due_at)) : null,
  }));

  res.json({ applications: enriched, data: enriched });
});

// GET /api/applications/:id — single application detail with all approvals
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, status, created_at,
      projects(
        id, name, location_state, investment_crore, employee_count,
        project_size, pollution_category, stage, hazardous_materials,
        businesses(id, name, sector, owner_id, gstin)
      ),
      application_approvals(
        id, status, officer_notes, rejection_reason, sla_due_at,
        submitted_at, decided_at, requires_inspection, approval_number,
        approval_types(id, name, sla_days, legal_basis, fee_note, required_documents),
        departments(id, name),
        queries(id, question, status, created_at, query_responses(id, response, created_at))
      ),
      inspections(
        id, scheduled_at, inspector_name, status, inspection_type, location, findings, result, completed_at
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Application not found' });

  const enriched = {
    ...data,
    application_approvals: ((data as any).application_approvals ?? []).map((aa: any) => ({
      ...aa,
      sla_status: aa.sla_due_at ? getSLAStatus(new Date(aa.sla_due_at)) : null,
    })),
  };

  res.json({ application: enriched, data: enriched });
});

// GET /api/applications/approvals/:id — single approval detail
router.get('/approvals/:id', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('application_approvals')
    .select(`
      id, application_id, approval_type_id, department_id, status,
      requires_inspection, sla_due_at, submitted_at, decided_at,
      approval_number, officer_notes, rejection_reason,
      approval_types(id, name, sla_days, authority, legal_basis, fee_note, required_documents),
      departments(id, name),
      applications(
        id, project_id,
        projects(
          id, name, location_state, district, investment_crore, employee_count,
          businesses(id, name, sector, owner_id, address, gstin)
        )
      ),
      queries(
        id, question, status, created_at,
        query_responses(id, response, created_at)
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Application approval not found' });

  res.json({ approval: data, data });
});

// POST /api/applications/approvals/:id/approve
router.post('/approvals/:id/approve', async (req: AuthRequest, res: Response) => {
  const { notes } = req.body;
  const result = await transitionStatus(req.params.id as string, 'approved', req.user!.id, notes);
  res.json({ success: true, data: result });
});

// POST /api/applications/approvals/:id/reject
router.post('/approvals/:id/reject', async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'rejection reason is required' });
  const result = await transitionStatus(req.params.id as string, 'rejected', req.user!.id, undefined, reason);
  res.json({ success: true, data: result });
});

// POST /api/applications/approvals/:id/request-inspection
router.post('/approvals/:id/request-inspection', async (req: AuthRequest, res: Response) => {
  const result = await transitionStatus(req.params.id as string, 'inspection_required', req.user!.id);
  res.json({ success: true, data: result });
});

// POST /api/applications/approvals/:id/queries — raise query
router.post('/approvals/:id/queries', async (req: AuthRequest, res: Response) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  const { data: query, error } = await supabaseAdmin
    .from('queries')
    .insert({
      application_approval_id: req.params.id as string,
      raised_by: req.user!.id,
      question,
      status: 'open',
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await transitionStatus(req.params.id as string, 'query_raised', req.user!.id, `Query raised: ${question}`);
  res.status(201).json({ query, data: query });
});

export default router;
