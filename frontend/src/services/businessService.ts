import { api } from './api';
import type { Business, Project } from '../types';

export const businessService = {
  async getMyBusiness(): Promise<Business | null> {
    const res = await api.get('/api/businesses/mine');
    return res.data.business || null;
  },

  async createBusiness(data: Partial<Business>): Promise<Business> {
    const res = await api.post('/api/businesses', data);
    return res.data.business;
  },

  async updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
    const res = await api.put(`/api/businesses/${id}`, data);
    return res.data.business;
  },

  async getProjects(businessId: string): Promise<Project[]> {
    const res = await api.get(`/api/businesses/${businessId}/projects`);
    return res.data.projects || [];
  },

  async createProject(businessId: string, data: Partial<Project>): Promise<Project> {
    const res = await api.post(`/api/businesses/${businessId}/projects`, data);
    return res.data.project;
  },

  async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
    const res = await api.put(`/api/projects/${projectId}`, data);
    return res.data.project;
  },

  async resetMyBusiness(): Promise<void> {
    await api.delete('/api/businesses/mine/reset');
  },

  async deleteBusiness(id: string): Promise<void> {
    await api.delete(`/api/businesses/${id}`);
  },
};
