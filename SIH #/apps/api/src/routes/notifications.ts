import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

router.get('/', async (req, res) => {
  res.json([]);
});

router.patch('/:id/read', async (req, res) => {
  await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', req.params.id);
  res.json({ success: true });
});

router.patch('/read-all', async (req, res) => {
  res.json({ success: true });
});

export default router;
