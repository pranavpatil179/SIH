import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { DocumentIntelligence } from '../services/gemini/DocumentIntelligence';

const router = Router();
const docIntel = new DocumentIntelligence();

router.post('/', async (req, res) => {
  res.json({ id: 'doc-1' });
});

router.get('/:id/url', async (req, res) => {
  res.json({ url: 'https://example.com/doc.pdf' });
});

router.post('/:id/process', async (req, res) => {
  res.json({ success: true });
});

export default router;
