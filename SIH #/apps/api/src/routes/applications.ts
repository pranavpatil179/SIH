import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { WorkflowOrchestrator } from '../engines/workflow/WorkflowOrchestrator';
import { SLAEngine } from '../engines/sla/SLAEngine';

const router = Router();
const orchestrator = new WorkflowOrchestrator();
const slaEngine = new SLAEngine();

router.post('/', async (req, res) => {
  const { data } = await supabaseAdmin.from('applications').insert(req.body).select().single();
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data } = await supabaseAdmin.from('applications').select('*, application_approvals(*)').eq('id', req.params.id).single();
  res.json(data);
});

router.post('/:id/submit', async (req, res) => {
  try {
    await orchestrator.initiateWorkflow(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/sla', async (req, res) => {
  res.json({ status: 'ON_TRACK' });
});

router.get('/:id/compliance', async (req, res) => {
  const { data } = await supabaseAdmin.from('compliance_obligations').select('*');
  res.json(data);
});

export default router;
