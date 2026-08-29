import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { RegulatoryEngine } from '../engines/regulatory/RegulatoryEngine';
import { DependencyGraphBuilder } from '../engines/regulatory/DependencyGraphBuilder';
import { RiskEngine } from '../engines/risk/RiskEngine';

const router = Router();
const regEngine = new RegulatoryEngine();
const depBuilder = new DependencyGraphBuilder();
const riskEngine = new RiskEngine();

router.get('/', async (req, res) => {
  const { data } = await supabaseAdmin.from('projects').select('*');
  res.json(data);
});

router.post('/', async (req, res) => {
  const { data } = await supabaseAdmin.from('projects').insert(req.body).select().single();
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data } = await supabaseAdmin.from('projects').select('*').eq('id', req.params.id).single();
  res.json(data);
});

router.patch('/:id', async (req, res) => {
  const { data } = await supabaseAdmin.from('projects').update(req.body).eq('id', req.params.id).select().single();
  res.json(data);
});

router.post('/:id/evaluate-approvals', async (req, res) => {
  const { data: project } = await supabaseAdmin.from('projects').select('*').eq('id', req.params.id).single();
  if (!project) { res.status(404).json({error:'Not found'}); return; }
  const approvals = await regEngine.evaluate(project);
  res.json(approvals);
});

router.get('/:id/dependency-graph', async (req, res) => {
  const graph = await depBuilder.buildGraph(['factory_license', 'env_clearance']);
  res.json(graph);
});

router.get('/:id/risk', async (req, res) => {
  const { data: project } = await supabaseAdmin.from('projects').select('*').eq('id', req.params.id).single();
  if (!project) { res.status(404).json({error:'Not found'}); return; }
  const risk = await riskEngine.assessRisk(project);
  res.json(risk);
});

router.get('/:id/verified-data', async (req, res) => {
  const { data } = await supabaseAdmin.from('verified_data').select('*');
  res.json(data);
});

router.get('/:id/incentives', async (req, res) => {
  res.json([]);
});

export default router;
