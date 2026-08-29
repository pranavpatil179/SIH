import { Router } from 'express';
import { WorkflowOrchestrator } from '../engines/workflow/WorkflowOrchestrator';

const router = Router();
const orchestrator = new WorkflowOrchestrator();

router.post('/:approvalId/query', async (req, res) => {
  const q = await orchestrator.handleQuery(req.params.approvalId, req.body.question, req.body.officerId || 'system');
  res.json(q);
});

router.get('/:approvalId/queries', async (req, res) => {
  res.json([]);
});

router.post('/:id/respond', async (req, res) => {
  const r = await orchestrator.handleQueryResponse(req.params.id, req.body.response, req.body.responderId || 'user');
  res.json(r);
});

export default router;
