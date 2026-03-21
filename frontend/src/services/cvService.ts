import api from './api';
import type { CVOut, CVListOut, CVDetailOut, AgentCVListOut, CVFormIn } from '../types/cv';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const cvService = {
  // Candidate
  async getMyCVs(): Promise<CVListOut> {
    const res = await api.get<CVListOut>('/api/candidate/cvs');
    return res.data;
  },

  async uploadCV(file: File): Promise<CVDetailOut> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Format non supporté. Utilisez PDF, DOCX, JPG ou PNG.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('Fichier trop lourd. La taille maximale est 5MB.');
    }
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<CVDetailOut>('/api/candidate/cvs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async createCVFromForm(data: CVFormIn): Promise<CVOut> {
    const res = await api.post<CVOut>('/api/candidate/cvs/form', data);
    return res.data;
  },

  // Agent
  async agentUploadCV(file: File): Promise<CVDetailOut> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Format non supporté. Utilisez PDF, DOCX, JPG ou PNG.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('Fichier trop lourd. La taille maximale est 5MB.');
    }
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<CVDetailOut>('/api/agent/cvs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getAgentCVs(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<AgentCVListOut> {
    const res = await api.get<AgentCVListOut>('/api/agent/cvs', { params });
    return res.data;
  },

  async getAgentCV(id: number): Promise<CVDetailOut> {
    const res = await api.get<CVDetailOut>(`/api/agent/cvs/${id}`);
    return res.data;
  },
};
