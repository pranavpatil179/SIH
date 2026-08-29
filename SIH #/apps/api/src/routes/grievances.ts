import { Router } from 'express';
const router = Router();
router.post('/', (req, res) => res.json({ id: 'grievance-1' }));
router.get('/', (req, res) => res.json([]));
export default router;
