import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { logAudit } from '../services/auditService';

const router = Router();

// GET /api/projects/:id — get project detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*, businesses(*)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Project not found' });
  res.json({ project: data, data });
});

// PUT /api/projects/:id — update project detail
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const {
    name,
    location_state,
    district,
    industrial_area,
    project_size,
    pollution_category,
    stage,
    investment_crore,
    land_area_sqm,
    employee_count,
    production_capacity,
    manufacturing_process,
    hazardous_materials,
    water_requirement_kld,
    electricity_requirement_kw,
    sub_sector,
    description,
  } = req.body;

  // Map legacy stage strings if sent
  let mappedStage = stage;
  if (stage === 'greenfield' || stage === 'setting_up') mappedStage = 'new_setup';
  if (stage === 'modernisation' || stage === 'brownfield') mappedStage = 'operating';

  const updatePayload: Record<string, any> = {};
  if (name !== undefined) updatePayload.name = name;
  if (location_state !== undefined) updatePayload.location_state = location_state;
  if (district !== undefined) updatePayload.district = district;
  if (industrial_area !== undefined) updatePayload.industrial_area = industrial_area;
  if (project_size !== undefined) updatePayload.project_size = project_size;
  if (pollution_category !== undefined) updatePayload.pollution_category = pollution_category;
  if (mappedStage !== undefined) updatePayload.stage = mappedStage;
  if (investment_crore !== undefined) updatePayload.investment_crore = typeof investment_crore === 'string' ? parseFloat(investment_crore) : investment_crore;
  if (land_area_sqm !== undefined) updatePayload.land_area_sqm = land_area_sqm ? (typeof land_area_sqm === 'string' ? parseFloat(land_area_sqm) : land_area_sqm) : null;
  if (employee_count !== undefined) updatePayload.employee_count = typeof employee_count === 'string' ? parseInt(employee_count, 10) : employee_count;
  if (production_capacity !== undefined) updatePayload.production_capacity = production_capacity;
  if (manufacturing_process !== undefined) updatePayload.manufacturing_process = manufacturing_process;
  if (hazardous_materials !== undefined) updatePayload.hazardous_materials = Boolean(hazardous_materials);
  if (water_requirement_kld !== undefined) updatePayload.water_requirement_kld = water_requirement_kld ? (typeof water_requirement_kld === 'string' ? parseFloat(water_requirement_kld) : water_requirement_kld) : null;
  if (electricity_requirement_kw !== undefined) updatePayload.electricity_requirement_kw = electricity_requirement_kw ? (typeof electricity_requirement_kw === 'string' ? parseFloat(electricity_requirement_kw) : electricity_requirement_kw) : null;
  if (sub_sector !== undefined) updatePayload.sub_sector = sub_sector;
  if (description !== undefined) updatePayload.description = description;

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(updatePayload)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await logAudit(req.user!.id, 'PROJECT_UPDATED', { project_id: req.params.id, updates: updatePayload });
  res.json({ project: data, data });
});

export default router;
