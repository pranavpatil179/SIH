import { api } from './api';
import type { ApplicationApproval } from '../types';

export const approvalService = {
  async getChecklist(projectId: string) {
    const res = await api.get(`/api/approvals/checklist/${projectId}`);
    return res.data;
  },

  async getSchemes(projectId: string) {
    const res = await api.get(`/api/schemes/eligible/${projectId}`);
    return res.data.schemes || [];
  },

  async submitApplication(projectId: string) {
    const res = await api.post('/api/applications', { project_id: projectId });
    return res.data;
  },

  async getApplications(businessId: string): Promise<ApplicationApproval[]> {
    const res = await api.get(`/api/applications?business_id=${businessId}`);
    return res.data.applications || [];
  },

  async getApplicationDetail(applicationId: string) {
    const res = await api.get(`/api/applications/${applicationId}`);
    return res.data;
  },

  async getApprovalDetail(approvalId: string) {
    const res = await api.get(`/api/applications/approvals/${approvalId}`);
    return res.data;
  },

  // Officer actions
  async getOfficerApplications() {
    const res = await api.get('/api/officer/applications');
    return res.data.applications || [];
  },

  async raiseQuery(approvalId: string, question: string) {
    const res = await api.post(`/api/applications/approvals/${approvalId}/queries`, { question });
    return res.data;
  },

  async respondToQuery(queryId: string, response: string) {
    const res = await api.post(`/api/queries/${queryId}/respond`, { response });
    return res.data;
  },

  async getQueries(approvalId: string) {
    const res = await api.get(`/api/applications/approvals/${approvalId}/queries`);
    return res.data.queries || [];
  },

  async getAllMyQueries() {
    const res = await api.get('/api/queries');
    return res.data.queries || [];
  },

  async approveApplication(approvalId: string, notes?: string) {
    const res = await api.post(`/api/applications/approvals/${approvalId}/approve`, { notes });
    return res.data;
  },

  async rejectApplication(approvalId: string, reason: string) {
    const res = await api.post(`/api/applications/approvals/${approvalId}/reject`, { reason });
    return res.data;
  },

  async requestInspection(approvalId: string) {
    const res = await api.post(`/api/applications/approvals/${approvalId}/request-inspection`);
    return res.data;
  },
};
