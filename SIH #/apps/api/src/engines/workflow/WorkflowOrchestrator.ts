import { supabaseAdmin } from '../../lib/supabase';
import { AuditService } from '../../services/audit/AuditService';

export class WorkflowOrchestrator {
  private audit = new AuditService();

  async initiateWorkflow(applicationId: string) {
    const { data: application } = await supabaseAdmin
      .from('applications')
      .select('*, projects(*)')
      .eq('id', applicationId)
      .single();

    if (!application) throw new Error('Application not found');

    const { data: approvals } = await supabaseAdmin
      .from('application_approvals')
      .select('*')
      .eq('application_id', applicationId);

    if (approvals) {
      for (const approval of approvals) {
        await supabaseAdmin.from('workflow_tasks').insert({
          application_id: applicationId,
          application_approval_id: approval.id,
          department_id: approval.department_id,
          task_type: 'scrutiny',
          status: 'pending'
        });
      }
    }
    
    await supabaseAdmin.from('applications').update({ status: 'under_review' }).eq('id', applicationId);
    await this.audit.log('system', 'APPLICATION_SUBMITTED', 'applications', applicationId);
  }

  async updateTaskStatus(taskId: string, status: string, userId: string) {
    await supabaseAdmin.from('workflow_tasks').update({ status }).eq('id', taskId);
    await this.audit.log(userId, 'STATUS_CHANGED', 'workflow_tasks', taskId, undefined, { status });
  }

  async handleQuery(approvalId: string, question: string, officerId: string) {
    const { data: query } = await supabaseAdmin.from('queries').insert({
      application_approval_id: approvalId,
      raised_by: officerId,
      question
    }).select().single();
    
    await this.audit.log(officerId, 'QUERY_RAISED', 'queries', query.id);
    return query;
  }

  async handleQueryResponse(queryId: string, response: string, responderId: string) {
    const { data: qr } = await supabaseAdmin.from('query_responses').insert({
      query_id: queryId,
      responded_by: responderId,
      response
    }).select().single();
    
    await supabaseAdmin.from('queries').update({ status: 'answered' }).eq('id', queryId);
    await this.audit.log(responderId, 'QUERY_RESPONDED', 'queries', queryId);
    return qr;
  }

  async scheduleInspection(applicationId: string, data: any, officerId: string) {
    const { data: inspection } = await supabaseAdmin.from('inspections').insert({
      application_id: applicationId,
      ...data
    }).select().single();
    await this.audit.log(officerId, 'INSPECTION_SCHEDULED', 'inspections', inspection.id);
    return inspection;
  }

  async completeInspection(inspectionId: string, findings: string, result: string, officerId: string) {
    const { data: inspection } = await supabaseAdmin.from('inspections').update({
      findings, result, status: 'completed', completed_at: new Date().toISOString()
    }).eq('id', inspectionId).select().single();
    await this.audit.log(officerId, 'INSPECTION_COMPLETED', 'inspections', inspectionId);
    return inspection;
  }

  async recordDecision(approvalId: string, decision: string, officerId: string, data: any = {}) {
    const { data: approval } = await supabaseAdmin.from('application_approvals').update({
      status: decision,
      decided_at: new Date().toISOString(),
      decided_by: officerId,
      ...data
    }).eq('id', approvalId).select().single();
    await this.audit.log(officerId, `APPROVAL_${decision.toUpperCase()}`, 'application_approvals', approvalId);
    return approval;
  }
}
