import { Router } from 'express';
import { WorkflowOrchestrator } from '../engines/workflow/WorkflowOrchestrator';

const router = Router();
const orchestrator = new WorkflowOrchestrator();

router.get('/:id/inspections', async (req, res) => {
  res.json([]);
});

router.post('/', async (req, res) => {
  const insp = await orchestrator.scheduleInspection(req.body.applicationId, req.body, req.body.officerId || 'system');
  res.json(insp);
});

router.patch('/:id', async (req, res) => {
  if (req.body.status === 'completed') {
    const insp = await orchestrator.completeInspection(req.params.id, req.body.findings, req.body.result, req.body.officerId || 'system');
    res.json(insp);
  } else {
    res.json({ success: true });
  }
});

export default router;
