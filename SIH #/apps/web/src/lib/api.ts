import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'API error')
  }
  return res.json()
}

export const api = {
  projects: {
    list: () => apiCall<any[]>('/projects'),
    create: (data: any) => apiCall<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => apiCall<any>(`/projects/${id}`),
    update: (id: string, data: any) => apiCall<any>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    evaluateApprovals: (id: string) => apiCall<any>(`/projects/${id}/evaluate-approvals`, { method: 'POST' }),
    getDependencyGraph: (id: string) => apiCall<any>(`/projects/${id}/dependency-graph`),
    getRisk: (id: string) => apiCall<any>(`/projects/${id}/risk`),
    getVerifiedData: (id: string) => apiCall<any>(`/projects/${id}/verified-data`),
    getIncentives: (id: string) => apiCall<any>(`/projects/${id}/incentives`),
    getSchemes: (id: string) => apiCall<any>(`/projects/${id}/schemes`),
  },
  applications: {
    create: (data: any) => apiCall<any>('/applications', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => apiCall<any>(`/applications/${id}`),
    submit: (id: string) => apiCall<any>(`/applications/${id}/submit`, { method: 'POST' }),
    getSLA: (id: string) => apiCall<any>(`/applications/${id}/sla`),
    getCompliance: (id: string) => apiCall<any>(`/applications/${id}/compliance`),
    preValidate: (id: string) => apiCall<any>(`/applications/${id}/pre-validate`, { method: 'POST' }),
  },
  documents: {
    list: (applicationId: string) => apiCall<any[]>(`/applications/${applicationId}/documents`),
    getUrl: (id: string) => apiCall<{url: string}>(`/documents/${id}/url`),
    process: (id: string) => apiCall<any>(`/documents/${id}/process`, { method: 'POST' }),
    upload: async (file: File, metadata: any) => {
      const headers = await getAuthHeaders()
      delete (headers as any)['Content-Type']
      const form = new FormData()
      form.append('file', file)
      form.append('metadata', JSON.stringify(metadata))
      const res = await fetch(`${API_BASE}/documents`, { method: 'POST', headers: { Authorization: (headers as any)['Authorization'] || '' }, body: form })
      if (!res.ok) throw new Error('Upload failed')
      return res.json()
    }
  },
  queries: {
    raise: (approvalId: string, data: any) => apiCall<any>(`/applications/${approvalId}/query`, { method: 'POST', body: JSON.stringify(data) }),
    list: (approvalId: string) => apiCall<any[]>(`/applications/${approvalId}/queries`),
    respond: (queryId: string, data: any) => apiCall<any>(`/queries/${queryId}/respond`, { method: 'POST', body: JSON.stringify(data) }),
  },
  inspections: {
    list: (applicationId: string) => apiCall<any[]>(`/applications/${applicationId}/inspections`),
    schedule: (data: any) => apiCall<any>('/inspections', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall<any>(`/inspections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  notifications: {
    list: () => apiCall<any[]>('/notifications'),
    markRead: (id: string) => apiCall<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => apiCall<any>('/notifications/read-all', { method: 'PATCH' }),
  },
  officer: {
    getQueue: () => apiCall<any>('/officer/queue'),
    getDashboard: () => apiCall<any>('/officer/dashboard'),
    updateApprovalStatus: (id: string, data: any) => apiCall<any>(`/officer/approvals/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    riskAssess: (id: string) => apiCall<any>(`/officer/approvals/${id}/risk-assess`, { method: 'POST' }),
  },
  schemes: {
    list: () => apiCall<any[]>('/schemes'),
    getForProject: (projectId: string) => apiCall<any[]>(`/projects/${projectId}/schemes`),
  },
  grievances: {
    create: (data: any) => apiCall<any>('/grievances', { method: 'POST', body: JSON.stringify(data) }),
    list: () => apiCall<any[]>('/grievances'),
  },
  analytics: {
    getDashboard: () => apiCall<any>('/analytics/dashboard'),
  }
}
