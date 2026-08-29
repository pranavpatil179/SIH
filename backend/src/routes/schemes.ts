import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// GET /api/schemes — list all available schemes
router.get('/', async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('schemes')
    .select('*')
    .order('name');

  if (error) return res.status(400).json({ error: error.message });
  res.json({ schemes: data || [], data: data || [] });
});

// GET /api/schemes/eligible/:projectId — determine eligible schemes for a project
router.get('/eligible/:projectId', async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*, businesses!inner(*)')
    .eq('id', projectId)
    .single();

  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { data: allSchemes } = await supabaseAdmin
    .from('schemes')
    .select('*')
    .eq('status', 'active');

  const eligibleSchemes: any[] = [];

  for (const scheme of allSchemes ?? []) {
    let eligible = true;
    const reasons: string[] = [];

    const sector = project.businesses?.sector ?? project.sector;
    if (scheme.sector_eligibility && scheme.sector_eligibility.length > 0) {
      if (!scheme.sector_eligibility.includes(sector)) {
        eligible = false;
      } else {
        reasons.push(`Sector '${sector.toUpperCase()}' is covered under this policy`);
      }
    }

    if (scheme.location_eligibility && scheme.location_eligibility.length > 0) {
      if (!scheme.location_eligibility.includes(project.location_state) && !scheme.location_eligibility.includes('All India')) {
        eligible = false;
      } else {
        reasons.push(`Location '${project.location_state}' is an eligible state`);
      }
    }

    if (scheme.min_investment_crore && project.investment_crore < scheme.min_investment_crore) {
      eligible = false;
    }
    if (scheme.max_investment_crore && project.investment_crore > scheme.max_investment_crore) {
      eligible = false;
    }
    if (eligible && scheme.min_investment_crore) {
      reasons.push(`Investment of ₹${project.investment_crore} Cr qualifies for capital subsidies`);
    }

    if (scheme.min_employees && project.employee_count < scheme.min_employees) {
      eligible = false;
    }
    if (eligible && scheme.min_employees) {
      reasons.push(`Workforce of ${project.employee_count} employees fulfills the job creation criteria`);
    }

    if (eligible) {
      eligibleSchemes.push({
        ...scheme,
        eligibility_reasons: reasons.length > 0 ? reasons : ['General MSME & Manufacturing eligibility criteria met'],
      });
    }
  }

  res.json({
    project_id: projectId,
    schemes: eligibleSchemes,
    data: eligibleSchemes,
    total_eligible: eligibleSchemes.length,
  });
});

export default router;
