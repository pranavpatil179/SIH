import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { sendNotification } from '../services/notificationService';
import { logAudit } from '../services/auditService';

const router = Router();

// POST /api/queries — officer raises a query on an application approval
router.post('/', async (req: AuthRequest, res: Response) => {
  const { application_approval_id, question } = req.body;
  if (!application_approval_id || !question) {
    return res.status(400).json({ error: 'application_approval_id and question are required' });
  }

  const { data: aa } = await supabaseAdmin
    .from('application_approvals')
    .select('id, department_id, status, applications(projects(businesses(owner_id)))')
    .eq('id', application_approval_id)
    .single();

  if (!aa) return res.status(404).json({ error: 'Application approval not found' });

  const { data: query, error } = await supabaseAdmin
    .from('queries')
    .insert({
      application_approval_id,
      raised_by: req.user!.id,
      question,
      status: 'open',
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Update approval status to query_raised
  await supabaseAdmin
    .from('application_approvals')
    .update({ status: 'query_raised' })
    .eq('id', application_approval_id);

  // Notify entrepreneur
  const ownerId = (aa as any).applications?.projects?.businesses?.owner_id;
  if (ownerId) {
    await sendNotification(
      ownerId,
      'query_raised',
      'Query Raised on Your Application',
      `An officer has raised a query on your application: "${question}"`,
      'query',
      query.id
    );
  }

  await logAudit(req.user!.id, 'QUERY_RAISED', { query_id: query.id, application_approval_id });
  res.status(201).json({ query, data: query });
});

// GET /api/queries — list queries for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
  const isOfficer = ['officer', 'admin', 'super_admin'].includes(req.user!.role);

  let queryBuilder = supabaseAdmin
    .from('queries')
    .select(`
      id, question, status, created_at, resolved_at,
      application_approvals(
        id, approval_type_id, department_id,
        approval_types(name),
        departments(name),
        applications(
          id,
          projects(
            id, name,
            businesses(id, name, owner_id)
          )
        )
      ),
      query_responses(id, response, created_at, responded_by)
    `)
    .order('created_at', { ascending: false });

  if (!isOfficer) {
    queryBuilder = queryBuilder.eq('application_approvals.applications.projects.businesses.owner_id', req.user!.id);
  }

  const { data, error } = await queryBuilder;
  if (error) return res.status(400).json({ error: error.message });

  res.json({ queries: data || [], data: data || [] });
});

// POST /api/queries/:id/respond — applicant responds to a query
router.post('/:id/respond', async (req: AuthRequest, res: Response) => {
  const { response, documents } = req.body;
  if (!response?.trim()) return res.status(400).json({ error: 'response text is required' });

  const { data: existingQuery } = await supabaseAdmin
    .from('queries')
    .select('id, application_approval_id, status, application_approvals(department_id, applications(projects(businesses(owner_id))))')
    .eq('id', req.params.id)
    .single();

  if (!existingQuery) return res.status(404).json({ error: 'Query not found' });

  const { data: queryResponse, error } = await supabaseAdmin
    .from('query_responses')
    .insert({
      query_id: req.params.id,
      responded_by: req.user!.id,
      response,
      documents: documents || [],
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Update query status to resolved/responded and approval back to under_scrutiny
  await supabaseAdmin
    .from('queries')
    .update({ status: 'responded', resolved_at: new Date().toISOString() })
    .eq('id', req.params.id);

  await supabaseAdmin
    .from('application_approvals')
    .update({ status: 'under_scrutiny' })
    .eq('id', existingQuery.application_approval_id);

  await logAudit(req.user!.id, 'QUERY_RESPONDED', { query_id: req.params.id, response });
  res.status(201).json({ query_response: queryResponse, data: queryResponse });
});

export default router;
