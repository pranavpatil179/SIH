import { api } from './api';
import type { Document } from '../types';

export const documentService = {
  async getVault(businessId: string): Promise<Document[]> {
    const res = await api.get(`/api/documents/vault/${businessId}`);
    return res.data.documents || [];
  },

  async uploadDocument(
    businessId: string,
    file: File,
    docType: string,
    expiryDate?: string
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('business_id', businessId);
    formData.append('doc_type', docType);
    if (expiryDate) formData.append('expiry_date', expiryDate);
    const res = await api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.document;
  },

  async validateDocument(documentId: string) {
    const res = await api.post(`/api/ai/validate-document/${documentId}`);
    return res.data;
  },

  async getValidation(documentId: string) {
    const res = await api.get(`/api/documents/${documentId}/validation`);
    return res.data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/api/documents/${documentId}`);
  },
};
