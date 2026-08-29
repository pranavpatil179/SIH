import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateApprovalChecklist } from '../services/approvalIntelligenceService';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// GET /api/approvals/types — list all approval types with rules
router.get('/types', async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('approval_types')
    .select('*, departments(id, name)')
    .order('name');

  if (error) return res.status(400).json({ error: error.message });
  res.json({ types: data || [], data: data || [] });
});

// GET /api/approvals/checklist/:projectId — run intelligence engine for a project
router.get('/checklist/:projectId', async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;

  // Get project + business using admin to avoid RLS block
  const { data: project, error: projError } = await supabaseAdmin
    .from('projects')
    .select('*, businesses!inner(sector, owner_id)')
    .eq('id', projectId)
    .single();

  if (projError || !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Authorization check
  const isOwner = project.businesses.owner_id === req.user!.id;
  const isStaff = ['officer', 'admin', 'super_admin'].includes(req.user!.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const analysis = await generateApprovalChecklist({
    sector: project.businesses.sector,
    location_state: project.location_state,
    district: project.district,
    investment_crore: project.investment_crore,
    employee_count: project.employee_count,
    project_size: project.project_size,
    pollution_category: project.pollution_category,
    stage: project.stage,
    hazardous_materials: project.hazardous_materials,
    pharma_sub_category: project.pharma_sub_category,
    land_ownership_type: project.land_ownership_type,
    connected_load_kw: project.connected_load_kw,
  });

  res.json({
    project_id: projectId,
    summary: analysis.summary,
    warnings: analysis.warnings,
    tracks: analysis.tracks,
    dag_edges: analysis.dag_edges,
    total_approvals: analysis.summary.total_identified,
    parallel_approvals: analysis.approvals.filter(c => c.can_parallel && c.status !== 'not_applicable').length,
    sequential_approvals: analysis.approvals.filter(c => !c.can_parallel && c.status !== 'not_applicable').length,
    estimated_total_days: analysis.summary.estimated_statutory_turnaround_days,
    checklist: analysis.approvals,
    analysis,
    data: analysis.approvals,
  });
});

export default router;
