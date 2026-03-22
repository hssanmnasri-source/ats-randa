import api from './api';
import type { CandidateProfileOut } from '../types/cv';

export interface OffreSummary {
  id: number;
  titre: string;
  description?: string;
  date_publication?: string;
  statut?: string;
}

export interface ApplicationOut {
  id: number;
  id_offre: number;
  id_cv?: number;
  score_final?: number;
  decision: string;          // 'PENDING' | 'RETAINED' | 'REFUSED'
  date_candidature?: string;
  offre?: OffreSummary | null;
}

export interface ApplicationsListOut {
  total: number;
  candidatures: ApplicationOut[];
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

  async applyToOffer(offerId: number): Promise<{ success: boolean; application_id: number; titre_offre?: string }> {
    const res = await api.post(`/api/candidate/offers/${offerId}/apply`);
    return res.data;
  },

  async getMyApplications(): Promise<ApplicationsListOut> {
    const res = await api.get<ApplicationsListOut>('/api/candidate/applications');
    return res.data;
  },

  async withdrawApplication(id: number): Promise<void> {
    await api.delete(`/api/candidate/applications/${id}`);
  },
};
