import api from './api';
import type { CandidateProfileOut } from '../types/cv';

export interface ApplicationOut {
  id: number;
  id_offre: number;
  id_cv?: number;
  statut?: string;
  created_at?: string;
  titre_offre?: string;
}

export const candidateService = {
  async getProfile(): Promise<CandidateProfileOut> {
    const res = await api.get<CandidateProfileOut>('/api/candidate/profile');
    return res.data;
  },

  async updateProfile(data: {
    nom?: string | null;
    prenom?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    date_naissance?: string | null;
  }): Promise<CandidateProfileOut> {
    const res = await api.put<CandidateProfileOut>('/api/candidate/profile', data);
    return res.data;
  },

  async applyToOffer(offerId: number): Promise<ApplicationOut> {
    const res = await api.post<ApplicationOut>(`/api/candidate/offers/${offerId}/apply`);
    return res.data;
  },

  async getMyApplications(): Promise<ApplicationOut[]> {
    const res = await api.get<ApplicationOut[]>('/api/candidate/applications');
    return res.data;
  },

  async withdrawApplication(id: number): Promise<void> {
    await api.delete(`/api/candidate/applications/${id}`);
  },
};
