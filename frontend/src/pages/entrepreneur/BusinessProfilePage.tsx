import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessService } from '../../services/businessService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormField';
import { AlertTriangle, Sparkles, Building2, Zap, ShieldCheck, Award, Info, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Business, Project } from '../../types';

const SECTORS = [
  { value: 'food_processing', label: '1. Food Processing & Agro-Based Industries' },
  { value: 'textile', label: '2. Textile & Garment Manufacturing' },
];

const FOOD_SUB_CATEGORIES = [
  { value: 'dairy_milk', label: 'Dairy, Milk & Value-Added Milk Products' },
  { value: 'bakery_confectionery', label: 'Bakery, Confectionery, Snack Foods & Extruded Products' },
  { value: 'beverages_water', label: 'Packaged Drinking Water, Soft Drinks & Fruit Juices' },
  { value: 'grain_milling_oil', label: 'Grain Milling, Spice Processing & Edible Oil Extraction' },
  { value: 'ready_to_eat_frozen', label: 'Ready-to-Eat (RTE), Frozen Meals & Dehydrated Produce' },
  { value: 'meat_poultry_fish', label: 'Meat, Poultry & Seafood Processing' },
];

const TEXTILE_SUB_CATEGORIES = [
  { value: 'spinning_ginning', label: 'Cotton Ginning, Pressing & Yarn Spinning Mills' },
  { value: 'weaving_knitting', label: 'Powerloom Weaving & Grey Fabric Knitting' },
  { value: 'wet_processing_dyeing', label: 'Textile Wet Processing, Bleaching, Dyeing & Printing (RED / ZLD)' },
  { value: 'garment_apparel', label: 'Readymade Garments, Apparel & Industrial Uniforms' },
  { value: 'technical_textiles', label: 'Technical Textiles, Geotextiles & Medical Non-Woven Fabrics' },
];

const LAND_OWNERSHIP_TYPES = [
  { value: 'seeking_midc_plot', label: 'Seeking Plot Allotment in MIDC Industrial / Food / Textile Park' },
  { value: 'privately_owned', label: 'Privately Owned Non-Agricultural (NA) Industrial Land' },
  { value: 'private_leased', label: 'Registered Private Industrial Lease / Non-MIDC Zone' },
];

const COMPANY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' },
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'public_ltd', label: 'Public Limited' },
  { value: 'opc', label: 'One Person Company' },
];

const STATES = [
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
];

const POLLUTION_CATEGORIES = [
  { value: 'white', label: 'White — Non-polluting' },
  { value: 'green', label: 'Green — Low pollution' },
  { value: 'orange', label: 'Orange — Moderate pollution (Food / Ginning)' },
  { value: 'red', label: 'Red — High pollution (Dyeing / Chemical Wet Processing)' },
];

const STAGES = [
  { value: 'greenfield', label: 'Greenfield — New Facility' },
  { value: 'expansion', label: 'Brownfield Expansion' },
  { value: 'operational', label: 'Existing Operational Plant' },
];

type Tab = 'business' | 'project';

export default function BusinessProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('business');
  const [existingBusiness, setExistingBusiness] = useState<Business | null>(null);
  const [existingProject, setExistingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [business, setBusiness] = useState<Partial<Business>>({
    name: '',
    company_type: '',
    sector: 'food_processing',
    state: 'Maharashtra',
    pan: '',
    gstin: '',
    cin: '',
    address: '',
  });

  const [project, setProject] = useState<any>({
    name: '',
    stage: 'greenfield',
    pollution_category: 'orange',
    location_state: 'Maharashtra',
    district: 'Pune',
    industrial_area: 'MIDC Mega Food Park',
    investment_crore: 8.5,
    land_cost_crore: 1.5,
    building_civil_cost_crore: 2.5,
    plant_machinery_cost_crore: 4.0,
    equipment_utilities_cost_crore: 0.5,
    annual_turnover_crore: 18.0,
    employee_count: 65,
    land_area_sqm: 3500,
    builtup_area_sqm: 1800,
    hazardous_materials: false,
    water_requirement_kld: 25,
    power_requirement_kva: 200,
    connected_load_kw: 150,
    land_ownership_type: 'seeking_midc_plot',
    food_sub_category: 'bakery_confectionery',
    textile_sub_category: 'spinning_ginning',
  });

  useEffect(() => {
    async function load() {
      try {
        const biz = await businessService.getMyBusiness();
        if (biz) {
          setExistingBusiness(biz);
          setBusiness({ ...biz });
          const projects = await businessService.getProjects(biz.id);
          if (projects.length > 0) {
            setExistingProject(projects[0]);
            const p = projects[0];
            const total = p.investment_crore || 8.5;
            setProject({
              ...p,
              investment_crore: total,
              land_cost_crore: p.land_cost_crore ?? 1.5,
              building_civil_cost_crore: p.building_civil_cost_crore ?? 2.5,
              plant_machinery_cost_crore: p.plant_machinery_cost_crore ?? 4.0,
              equipment_utilities_cost_crore: p.equipment_utilities_cost_crore ?? 0.5,
              annual_turnover_crore: p.annual_turnover_crore ?? 18.0,
              land_ownership_type: p.land_ownership_type || 'seeking_midc_plot',
              connected_load_kw: p.connected_load_kw || 150,
              food_sub_category: p.food_sub_category || 'bakery_confectionery',
              textile_sub_category: p.textile_sub_category || 'spinning_ginning',
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pm = parseFloat(project.plant_machinery_cost_crore) || 4.0;
  const turnover = parseFloat(project.annual_turnover_crore) || 18.0;

  let msmeTier = 'Small Enterprise (MSME)';
  let msmeDetail = 'Plant & Machinery ≤ ₹10 Cr & Turnover ≤ ₹50 Cr';
  let msmeBadgeColor = 'bg-emerald-50 text-emerald-900 border-emerald-200';

  if (pm <= 1 && turnover <= 5) {
    msmeTier = 'Micro Enterprise (MSME)';
    msmeDetail = 'Plant & Machinery ≤ ₹1 Cr & Turnover ≤ ₹5 Cr';
    msmeBadgeColor = 'bg-blue-50 text-blue-900 border-blue-200';
  } else if (pm <= 10 && turnover <= 50) {
    msmeTier = 'Small Enterprise (MSME)';
    msmeDetail = 'Plant & Machinery ≤ ₹10 Cr & Turnover ≤ ₹50 Cr';
    msmeBadgeColor = 'bg-emerald-50 text-emerald-900 border-emerald-200';
  } else if (pm <= 50 && turnover <= 250) {
    msmeTier = 'Medium Enterprise (MSME)';
    msmeDetail = 'Plant & Machinery ≤ ₹50 Cr & Turnover ≤ ₹250 Cr';
    msmeBadgeColor = 'bg-amber-50 text-amber-900 border-amber-200';
  } else {
    msmeTier = 'Large Enterprise (Non-MSME)';
    msmeDetail = 'Plant & Machinery > ₹50 Cr or Turnover > ₹250 Cr';
    msmeBadgeColor = 'bg-purple-50 text-purple-900 border-purple-200';
  }

  const saveBusiness = async () => {
    if (!business.name || !business.sector) {
      toast.error('Business name and sector are required');
      return;
    }
    setSaving(true);
    try {
      if (existingBusiness) {
        const updated = await businessService.updateBusiness(existingBusiness.id, business);
        setExistingBusiness(updated);
        
        if (existingProject) {
          await businessService.updateProject(existingProject.id, {
            sector: business.sector,
            sub_sector: business.sector === 'food_processing' 
              ? (project.food_sub_category || 'bakery_confectionery') 
              : (project.textile_sub_category || 'spinning_ginning'),
            food_sub_category: project.food_sub_category || 'bakery_confectionery',
            textile_sub_category: project.textile_sub_category || 'spinning_ginning',
          });
        }
        toast.success(`Business sector updated to ${business.sector === 'food_processing' ? 'Food Processing' : 'Textile'}! Clearances and document checklist updated.`);
      } else {
        const created = await businessService.createBusiness(business);
        setExistingBusiness(created);
        toast.success('Business profile created');
        setActiveTab('project');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save business');
    } finally {
      setSaving(false);
    }
  };

  const saveProject = async () => {
    if (!existingBusiness) {
      toast.error('Please save your business profile first');
      setActiveTab('business');
      return;
    }
    if (!project.name || !project.stage) {
      toast.error('Project name and stage are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...project,
        sector: business.sector || 'food_processing',
        investment_crore: parseFloat(project.investment_crore) || 8.5,
        plant_machinery_cost_crore: pm,
        land_cost_crore: parseFloat(project.land_cost_crore) || 0,
        building_civil_cost_crore: parseFloat(project.building_civil_cost_crore) || 0,
        equipment_utilities_cost_crore: parseFloat(project.equipment_utilities_cost_crore) || 0,
        annual_turnover_crore: turnover,
        connected_load_kw: parseFloat(project.connected_load_kw) || 150,
        employee_count: parseInt(project.employee_count) || 65,
        location_state: project.location_state || existingBusiness.state || 'Maharashtra',
      };

      if (existingProject) {
        const updated = await businessService.updateProject(existingProject.id, payload);
        setExistingProject(updated || { ...existingProject, ...payload } as Project);
        toast.success('Project parameters updated! MSME and clearances recalculated.');
      } else {
        const created = await businessService.createProject(existingBusiness.id, payload);
        setExistingProject(created);
        toast.success('Project created! View your statutory roadmap.');
        navigate('/roadmap');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleResetBusiness = async () => {
    if (!confirm('Are you sure you want to delete this applicant business profile and reset all project data? This action cannot be undone.')) {
      return;
    }
    setSaving(true);
    try {
      await businessService.resetMyBusiness();
      setExistingBusiness(null);
      setExistingProject(null);
      setBusiness({
        name: '',
        sector: 'manufacturing',
        company_type: 'pvt_ltd',
        state: 'Maharashtra',
        address: '',
        pan: '',
        gstin: '',
        udyam_number: '',
        contact_email: '',
        contact_phone: '',
      });
      setProject({
        name: '',
        location_state: 'Maharashtra',
        district: 'Pune',
        industrial_area: 'MIDC Chakan',
        stage: 'new_setup',
        project_size: 'small',
        pollution_category: 'orange',
        investment_crore: '5.0',
        plant_machinery_cost_crore: '2.5',
        land_cost_crore: '1.5',
        building_civil_cost_crore: '1.0',
        equipment_utilities_cost_crore: '0',
        annual_turnover_crore: '12.0',
        land_area_sqm: '2500',
        employee_count: '45',
        production_capacity: '',
        manufacturing_process: '',
        hazardous_materials: false,
        water_requirement_kld: '20',
        electricity_requirement_kw: '150',
        connected_load_kw: '150',
        sub_sector: 'precision_engineering',
        pharma_sub_category: 'formulations',
        land_ownership_type: 'seeking_midc_plot',
        description: '',
      });
      setActiveTab('business');
      toast.success('Applicant business profile deleted. You can now setup a fresh profile.');
    } catch (err: any) {
      toast.error('Failed to reset profile: ' + (err.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800" />
      </div>
    );
  }

  const isFood = (business.sector || project.sector) === 'food_processing';
  const isTextile = (business.sector || project.sector) === 'textile';
  const isHtLoad = (project.connected_load_kw || 0) >= 65;
  const isExtremeWorkforce = (project.employee_count || 0) > 25000;

  return (
    <div className="space-y-6">
      <PageHeader
        title={existingBusiness ? 'Industrial Enterprise Profile' : 'Setup Industrial Profile'}
        subtitle="Configure manufacturing facility & capital outlay parameters to drive deterministic statutory clearance mapping"
        actions={
          existingBusiness ? (
            <Button
              variant="outline"
              onClick={handleResetBusiness}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-bold gap-1.5"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              Delete / Reset Profile
            </Button>
          ) : undefined
        }
      />

      {/* Tab switcher */}
      <div className="grid grid-cols-1 sm:flex border border-slate-200 rounded-xl overflow-hidden w-full sm:w-fit bg-slate-100 p-1 gap-1 sm:gap-0">
        {(['business', 'project'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-6 py-2.5 sm:py-2 text-xs font-bold rounded-lg transition-all capitalize text-center ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {tab === 'business' ? '1. Business Entity Info' : '2. Facility, Siting & Capital Breakdown'}
          </button>
        ))}
      </div>

      {activeTab === 'business' ? (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#002046]">Corporate / Entity Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Enterprise / Business Name"
                required
                value={business.name || ''}
                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                placeholder="Apex Precision Engineering Pvt Ltd"
              />
              <Select
                label="Corporate Entity Structure"
                options={COMPANY_TYPES}
                placeholder="Select type"
                value={business.company_type || ''}
                onChange={(e) => setBusiness({ ...business, company_type: e.target.value })}
              />
              <Select
                label="Core Industrial Sector (2 Focused Sectors)"
                required
                options={SECTORS}
                placeholder="Select sector"
                value={business.sector || 'food_processing'}
                onChange={(e) => setBusiness({ ...business, sector: e.target.value })}
              />
              <Select
                label="State of Jurisdiction"
                options={STATES}
                placeholder="Select state"
                value={business.state || 'Maharashtra'}
                onChange={(e) => setBusiness({ ...business, state: e.target.value })}
              />
              <Input
                label="Company PAN (10 Digits)"
                value={business.pan || ''}
                onChange={(e) => setBusiness({ ...business, pan: e.target.value.toUpperCase() })}
                placeholder="AAACA1234F"
                maxLength={10}
              />
              <Input
                label="GSTIN (15 Digits - State Code 27 for Maharashtra)"
                value={business.gstin || ''}
                onChange={(e) => setBusiness({ ...business, gstin: e.target.value.toUpperCase() })}
                placeholder="27AAACA1234F1Z5"
                maxLength={15}
              />
            </div>
            <Textarea
              label="Registered Corporate Office Address"
              value={business.address || ''}
              onChange={(e) => setBusiness({ ...business, address: e.target.value })}
              placeholder="Plot No. A-42, MIDC Phase II, Chakan, Pune - 410501"
            />
            <div className="flex justify-end pt-2">
              <Button onClick={saveBusiness} loading={saving}>
                {existingBusiness ? 'Save Entity Info' : 'Save & Continue to Facility Parameters'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-[#002046]">
                  Manufacturing Facility & Capital Investment Parameters
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Granular capital cost breakdown is used to compute authentic Udyam MSME status and statutory fee tiers
                </p>
              </div>

              {/* Dynamic Udyam MSME Classification Pill */}
              <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${msmeBadgeColor}`}>
                <Award className="w-4 h-4 flex-shrink-0" />
                <div>
                  <span className="block">{msmeTier}</span>
                  <span className="text-[10px] font-normal opacity-90">{msmeDetail}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            {!existingBusiness && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                Please complete the Business Entity tab first.
              </div>
            )}

            {/* Extreme Workforce Guardrail */}
            {isExtremeWorkforce && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Extreme Workforce Threshold Alert:</span>
                  <p className="mt-0.5">
                    Input of {project.employee_count?.toLocaleString('en-IN')} workers exceeds standard single-plant limits. Maximum statutory welfare facilities (creche, canteen, full-time ambulance room under DISH Rules) and high-density egress will be required.
                  </p>
                </div>
              </div>
            )}

            {/* Facility Identification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Manufacturing Unit / Project Title"
                required
                value={project.name || ''}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
                placeholder="High-Precision CNC Machining Facility"
              />

              {isFood && (
                <Select
                  label="Food Processing Sub-Category"
                  required
                  options={FOOD_SUB_CATEGORIES}
                  value={project.food_sub_category || 'bakery_confectionery'}
                  onChange={(e) => setProject({ ...project, food_sub_category: e.target.value })}
                />
              )}

              {isTextile && (
                <Select
                  label="Textile Manufacturing Sub-Category"
                  required
                  options={TEXTILE_SUB_CATEGORIES}
                  value={project.textile_sub_category || 'spinning_ginning'}
                  onChange={(e) => setProject({ ...project, textile_sub_category: e.target.value })}
                />
              )}

              <Select
                label="Land Siting / Ownership Configuration"
                required
                options={LAND_OWNERSHIP_TYPES}
                value={project.land_ownership_type || 'seeking_midc_plot'}
                onChange={(e) => setProject({ ...project, land_ownership_type: e.target.value })}
              />

              <Select
                label="Project Lifecycle Stage"
                required
                options={STAGES}
                value={project.stage || 'greenfield'}
                onChange={(e) => setProject({ ...project, stage: e.target.value })}
              />

              <Select
                label="Pollution Control Classification (MPCB)"
                options={POLLUTION_CATEGORIES}
                value={project.pollution_category || 'orange'}
                onChange={(e) => setProject({ ...project, pollution_category: e.target.value })}
              />

              <Input
                label="Total Workforce / Employees on Site"
                type="number"
                min={1}
                required
                value={project.employee_count || ''}
                onChange={(e) => setProject({ ...project, employee_count: parseInt(e.target.value) })}
                placeholder="85"
              />

              <div>
                <Input
                  label="Connected Electrical Load (kW)"
                  type="number"
                  min={1}
                  required
                  value={project.connected_load_kw || ''}
                  onChange={(e) => setProject({ ...project, connected_load_kw: parseFloat(e.target.value) })}
                  placeholder="200"
                />
                <span className={`text-[10px] font-semibold mt-1 inline-block ${isHtLoad ? 'text-blue-700' : 'text-slate-500'}`}>
                  ⚡ {isHtLoad ? '≥65 kW (MERC Supply Code): High-Tension (HT 11/22 kV) Transformer Sanction Required' : '<65 kW: Low-Tension (LT) Supply'}
                </span>
              </div>

              <Input
                label="District (Maharashtra)"
                value={project.district || 'Pune'}
                onChange={(e) => setProject({ ...project, district: e.target.value })}
                placeholder="Pune / Palghar / Raigad / Aurangabad"
              />
            </div>

            {/* Granular Capital Investment Breakdown Box (For Udyam & Statutory Fees) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-[#002046] uppercase tracking-wide">
                    Capital Cost Breakdown (DPR Budget & Udyam Plant/Machinery Limits)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  MSMED Act Notification S.O. 2119(E)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    Plant & Machinery Investment (₹ Cr) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={project.plant_machinery_cost_crore || ''}
                    onChange={(e) => setProject({ ...project, plant_machinery_cost_crore: parseFloat(e.target.value) || 0 })}
                    placeholder="5.0"
                    className="w-full p-2 text-xs border rounded-lg bg-white font-bold text-blue-950 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-blue-700 font-medium mt-0.5 block">
                    ★ Key criteria for Udyam MSME bracket
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expected Annual Turnover (₹ Cr) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={project.annual_turnover_crore || ''}
                    onChange={(e) => setProject({ ...project, annual_turnover_crore: parseFloat(e.target.value) || 0 })}
                    placeholder="22.0"
                    className="w-full p-2 text-xs border rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    ★ Udyam Turnover limit criteria
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Project Cost / DPR (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={project.investment_crore || ''}
                    onChange={(e) => setProject({ ...project, investment_crore: parseFloat(e.target.value) || 0 })}
                    placeholder="12.5"
                    className="w-full p-2 text-xs border rounded-lg bg-white font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Used for MPCB gross fee slab
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Land & Siting Cost (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={project.land_cost_crore || ''}
                    onChange={(e) => setProject({ ...project, land_cost_crore: parseFloat(e.target.value) || 0 })}
                    placeholder="2.5"
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block italic">
                    Excluded from Udyam capital
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Building & Civil Works (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={project.building_civil_cost_crore || ''}
                    onChange={(e) => setProject({ ...project, building_civil_cost_crore: parseFloat(e.target.value) || 0 })}
                    placeholder="3.5"
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block italic">
                    Excluded from Udyam capital
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Electrical / Utilities (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={project.equipment_utilities_cost_crore || ''}
                    onChange={(e) => setProject({ ...project, equipment_utilities_cost_crore: parseFloat(e.target.value) || 0 })}
                    placeholder="1.5"
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block italic">
                    Auxiliary Infrastructure
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={saveProject} loading={saving} size="lg">
                {existingProject ? 'Update Facility Parameters & Recalculate DAG' : 'Create Facility & View Statutory DAG'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
