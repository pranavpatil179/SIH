import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { logAudit } from '../services/auditService';

const router = Router();

// GET /api/businesses/mine — list or get first business owned by current user
router.get('/mine', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('owner_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  
  const first = data && data.length > 0 ? data[0] : null;
  res.json({ business: first, data: first, businesses: data });
});

// GET /api/businesses/:id — single business
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Business not found' });
  res.json({ business: data, data });
});

// POST /api/businesses — create a new business
router.post('/', async (req: AuthRequest, res: Response) => {
  const {
    name,
    sector = 'manufacturing',
    address,
    state = 'Maharashtra',
    gstin,
    pan,
    udyam_number,
    company_type = 'Private Limited',
    contact_email,
    contact_phone,
    establishment_year,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Business name is required' });
  }

  // Check if business already exists for this owner
  const { data: existing } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('owner_id', req.user!.id)
    .single();

  let data;
  let error;

  if (existing) {
    const resUpdate = await supabaseAdmin
      .from('businesses')
      .update({
        name,
        sector,
        address,
        state,
        gstin,
        pan,
        udyam_number,
        company_type,
        contact_email,
        contact_phone,
        establishment_year: establishment_year ? parseInt(establishment_year, 10) : undefined,
      })
      .eq('id', existing.id)
      .select()
      .single();
    data = resUpdate.data;
    error = resUpdate.error;
  } else {
    const resInsert = await supabaseAdmin
      .from('businesses')
      .insert({
        owner_id: req.user!.id,
        name,
        sector,
        address,
        state,
        gstin,
        pan,
        udyam_number,
        company_type,
        contact_email,
        contact_phone,
        establishment_year: establishment_year ? parseInt(establishment_year, 10) : undefined,
      })
      .select()
      .single();
    data = resInsert.data;
    error = resInsert.error;
  }

  if (error) return res.status(400).json({ error: error.message });

  await logAudit(req.user!.id, 'BUSINESS_SAVED', { business_id: data.id, name });
  res.status(201).json({ business: data, data });
});

// PUT /api/businesses/:id — update business
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const updates: Record<string, any> = { ...req.body };
  delete updates.id;
  delete updates.owner_id;
  delete updates.created_at;

  const { data, error } = await supabaseAdmin
    .from('businesses')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await logAudit(req.user!.id, 'BUSINESS_UPDATED', { business_id: req.params.id });
  res.json({ business: data, data });
});

// GET /api/businesses/:id/projects — list projects for a business
router.get('/:id/projects', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('business_id', req.params.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ projects: data || [], data: data || [] });
});

// POST /api/businesses/:id/projects — create or update project
router.post('/:id/projects', async (req: AuthRequest, res: Response) => {
  const {
    name,
    location_state = 'Maharashtra',
    district = 'Pune',
    industrial_area = 'MIDC Chakan',
    project_size = 'medium',
    pollution_category = 'orange',
    stage = 'new_setup',
    investment_crore = 5.0,
    land_area_sqm = 5000,
    employee_count = 100,
    production_capacity = '500 units/day',
    manufacturing_process = 'CNC Machining, Fabrication, Assembly',
    hazardous_materials = false,
    water_requirement_kld = 50,
    electricity_requirement_kw = 500,
    sub_sector = 'precision_engineering',
    description,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Project name is required' });

  // Check if project exists for this business
  const { data: existingProject } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('business_id', req.params.id)
    .single();

  let data;
  let error;

  const projectPayload = {
    business_id: req.params.id,
    name,
    location_state,
    district,
    industrial_area,
    project_size,
    pollution_category,
    stage,
    investment_crore: typeof investment_crore === 'string' ? parseFloat(investment_crore) : investment_crore,
    land_area_sqm: land_area_sqm ? (typeof land_area_sqm === 'string' ? parseFloat(land_area_sqm) : land_area_sqm) : null,
    employee_count: typeof employee_count === 'string' ? parseInt(employee_count, 10) : employee_count,
    production_capacity,
    manufacturing_process,
    hazardous_materials: Boolean(hazardous_materials),
    water_requirement_kld: water_requirement_kld ? (typeof water_requirement_kld === 'string' ? parseFloat(water_requirement_kld) : water_requirement_kld) : null,
    electricity_requirement_kw: electricity_requirement_kw ? (typeof electricity_requirement_kw === 'string' ? parseFloat(electricity_requirement_kw) : electricity_requirement_kw) : null,
    sub_sector,
    description,
    data_source: 'live_entry',
  };

  if (existingProject) {
    const resUpdate = await supabaseAdmin
      .from('projects')
      .update(projectPayload)
      .eq('id', existingProject.id)
      .select()
      .single();
    data = resUpdate.data;
    error = resUpdate.error;
  } else {
    const resInsert = await supabaseAdmin
      .from('projects')
      .insert(projectPayload)
      .select()
      .single();
    data = resInsert.data;
    error = resInsert.error;
  }

  if (error) return res.status(400).json({ error: error.message });

  await logAudit(req.user!.id, 'PROJECT_SAVED', { project_id: data.id, name });
  res.status(201).json({ project: data, data });
});

// DELETE /api/businesses/mine/reset — reset and delete current user's business profile and all linked records
router.delete('/mine/reset', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const { data: businesses } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_id', userId);

  const bizIds = (businesses || []).map((b: any) => b.id);

  for (const bid of bizIds) {
    // Delete projects
    const { data: projs } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('business_id', bid);
    
    for (const p of projs || []) {
      // Delete application approvals & applications
      const { data: apps } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('project_id', p.id);
      
      for (const a of apps || []) {
        await supabaseAdmin.from('application_approvals').delete().eq('application_id', a.id);
        await supabaseAdmin.from('inspections').delete().eq('application_id', a.id);
        await supabaseAdmin.from('queries').delete().eq('application_id', a.id);
        await supabaseAdmin.from('applications').delete().eq('id', a.id);
      }
      await supabaseAdmin.from('projects').delete().eq('id', p.id);
    }

    // Delete documents
    await supabaseAdmin.from('documents').delete().eq('business_id', bid);
    await supabaseAdmin.from('businesses').delete().eq('id', bid);
  }

  await logAudit(userId, 'BUSINESS_RESET_DELETED', { deleted_businesses: bizIds });
  res.json({ success: true, message: 'Business profile and all associated clearance applications deleted successfully.' });
});

// DELETE /api/businesses/:id — delete specific business by id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Delete linked projects and records
  const { data: projs } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('business_id', id);

  for (const p of projs || []) {
    const { data: apps } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('project_id', p.id);

    for (const a of apps || []) {
      await supabaseAdmin.from('application_approvals').delete().eq('application_id', a.id);
      await supabaseAdmin.from('inspections').delete().eq('application_id', a.id);
      await supabaseAdmin.from('queries').delete().eq('application_id', a.id);
      await supabaseAdmin.from('applications').delete().eq('id', a.id);
    }
    await supabaseAdmin.from('projects').delete().eq('id', p.id);
  }

  await supabaseAdmin.from('documents').delete().eq('business_id', id);
  const { error } = await supabaseAdmin.from('businesses').delete().eq('id', id);

  if (error) return res.status(400).json({ error: error.message });

  await logAudit(req.user!.id, 'BUSINESS_DELETED', { business_id: id });
  res.json({ success: true, message: 'Business deleted successfully.' });
});

export default router;
