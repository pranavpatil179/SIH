import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
const router = Router();
router.get('/dashboard', async (req, res) => {
  res.json({ avg_processing_time_days: 5, sla_compliance_rate: 95, pending_by_department: {} });
});
export default router;
