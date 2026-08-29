import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// GET /api/notifications — list notifications for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  const { unread_only, limit = '20', offset = '0' } = req.query;

  let query = supabaseAdmin
    .from('notifications')
    .select('id, type, title, message, entity_type, entity_id, is_read, created_at')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (unread_only === 'true') query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  const { count: unreadCount } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user!.id)
    .eq('is_read', false);

  res.json({ data, unread_count: unreadCount ?? 0 });
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Marked as read' });
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', req.user!.id)
    .eq('is_read', false);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'All notifications marked as read' });
});

export default router;
