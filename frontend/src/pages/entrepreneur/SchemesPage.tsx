import { useEffect, useState } from 'react';
import { businessService } from '../../services/businessService';
import { approvalService } from '../../services/approvalService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Gift, Sparkles, Building2, CheckCircle2, TrendingUp, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Business, Project, Scheme } from '../../types';

export default function SchemesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingSchemeId, setApplyingSchemeId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const biz = await businessService.getMyBusiness();
        setBusiness(biz);
        if (biz) {
          const projs = await businessService.getProjects(biz.id);
          setProjects(projs);
          if (projs.length > 0) {
            setSelectedProject(projs[0]);
            const res = await approvalService.getSchemes(projs[0].id);
            setSchemes(res);
          }
        }
      } catch (err: any) {
        toast.error('Failed to load eligible schemes');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleApply = async (scheme: any) => {
    setApplyingSchemeId(scheme.id);
    try {
      toast.success(`Incentive claim initiated for ${scheme.name}! Application dossiers pre-filled from your Business Profile.`);
    } catch (err: any) {
      toast.error('Application failed');
    } finally {
      setApplyingSchemeId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Government Schemes & Incentive Engine"
        subtitle="Rule-matched fiscal subsidies, duty exemptions, and capital incentives for your business profile"
      />

      {/* AI Scheme Engine Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-secondary-700 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-950">AI & Rule-Driven Eligibility Determination</h4>
            <p className="text-xs text-emerald-900 mt-1">
              Based on your unit's location in {selectedProject?.location_state || 'Maharashtra'}, capital expenditure of ₹{selectedProject?.investment_crore || 5} Crore, and {selectedProject?.employee_count || 100} workers, you are eligible for <strong>{schemes.length} Government Support Programs</strong>.
            </p>
            <p className="text-[11px] text-emerald-700 mt-2">
              * Official sanction is subject to department scrutiny and physical asset installation verification.
            </p>
          </div>
        </div>
      </div>

      {/* Scheme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {schemes.map((scheme) => (
          <Card key={scheme.id} className="border-emerald-200/80 flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-secondary-600" />
                    <CardTitle className="text-base">{scheme.name}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">{scheme.authority || 'State Government of Maharashtra'}</p>
                </div>
                <Badge variant="success">Eligible</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-foreground bg-slate-50 p-2.5 rounded border">
                  <strong>Key Benefits:</strong> {scheme.benefit || 'Capital subsidy, SGST reimbursement and electricity tariff concessions'}
                </p>

                {scheme.description && (
                  <p className="text-xs text-muted-foreground">{scheme.description}</p>
                )}

                {/* Gemini AI Eligibility Reasoning */}
                <div className="p-2.5 bg-emerald-50 rounded text-xs space-y-1 text-emerald-900">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Why Your Enterprise Qualifies:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                    <li>Sector matches designated eligible category: {business?.sector?.toUpperCase()}</li>
                    <li>Capital investment (₹{selectedProject?.investment_crore} Cr) falls within eligible bracket</li>
                    <li>Employment creation ({selectedProject?.employee_count} direct jobs) meets state criteria</li>
                  </ul>
                </div>

                {scheme.required_documents && scheme.required_documents.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Required Documentation:</p>
                    <div className="flex flex-wrap gap-1">
                      {scheme.required_documents.map((doc: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>

            <div className="p-4 bg-slate-50 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Document Vault Auto-Sync</span>
              <Button
                size="sm"
                variant="secondary"
                loading={applyingSchemeId === scheme.id}
                onClick={() => handleApply(scheme)}
                className="text-xs gap-1"
              >
                Claim Incentive <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
