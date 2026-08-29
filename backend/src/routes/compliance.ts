import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { logAudit } from '../services/auditService';

const router = Router();

// GET /api/compliance — list compliance obligations
router.get('/', async (req: AuthRequest, res: Response) => {
  const isOfficer = ['officer', 'admin', 'super_admin'].includes(req.user!.role);

  let query = supabaseAdmin
    .from('compliance_obligations')
    .select(`
      id, name, description, frequency, due_date, status, created_at,
      application_approvals!inner(
        id, approval_type_id, department_id,
        approval_types(name),
        departments(name),
        applications!inner(
          projects!inner(
            businesses!inner(id, name, owner_id)
          )
        )
      )
    `)
    .order('due_date', { ascending: true });

  if (!isOfficer) {
    query = query.eq('application_approvals.applications.projects.businesses.owner_id', req.user!.id);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  res.json({ compliance: data || [], obligations: data || [], data: data || [] });
});

export default router;
