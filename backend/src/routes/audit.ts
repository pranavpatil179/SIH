import { Router, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// GET /api/audit — paginated audit log (admin/super_admin only)
router.get('/', requireRole('admin', 'super_admin'), async (req: AuthRequest, res: Response) => {
  const { limit = '50', offset = '0', action, actor } = req.query;

  let query = supabaseAdmin
    .from('audit_log')
    .select('id, actor, action, detail, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (action) query = query.eq('action', action as string);
  if (actor) query = query.eq('actor', actor as string);

  const { data, error, count } = await query;
  if (error) return res.status(400).json({ error: error.message });

  res.json({
    data,
    meta: {
      total: count,
      limit: Number(limit),
      offset: Number(offset),
    },
  });
});

export default router;
