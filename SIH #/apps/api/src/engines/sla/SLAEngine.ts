import { supabaseAdmin } from '../../lib/supabase';

export class SLAEngine {
  async calculateSLAStatus(approvalId: string) {
    const { data: approval } = await supabaseAdmin.from('application_approvals').select('*').eq('id', approvalId).single();
    if (!approval) return null;
    
    const now = new Date();
    const due = new Date(approval.sla_due_at);
    const total = due.getTime() - new Date(approval.submitted_at).getTime();
    const elapsed = now.getTime() - new Date(approval.submitted_at).getTime();
    const remaining = due.getTime() - now.getTime();
    
    let status = 'ON_TRACK';
    if (remaining < 0) status = 'BREACHED';
    else if (remaining / total < 0.2) status = 'AT_RISK';
    
    return { status, elapsed, remaining };
  }

  async checkAndEscalate() {
    const { data: approvals } = await supabaseAdmin.from('application_approvals')
      .select('*')
      .in('status', ['under_scrutiny', 'query_raised'])
      .lt('sla_due_at', new Date().toISOString());
      
    if (approvals) {
      for (const a of approvals) {
        await supabaseAdmin.from('escalations').insert({
          application_approval_id: a.id,
          reason: 'SLA Breached',
          level: 1
        });
      }
    }
  }

  async getSLADashboard(departmentId?: string) {
    return { on_track: 10, at_risk: 2, breached: 1 };
  }
}
