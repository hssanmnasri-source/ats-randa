import api from './api';
import type {
  CandidateProfileOut,
  FullProfileOut,
  ProfileCompletionOut,
  ExperienceOut,
  SkillOut,
  CoverLetterOut,
  CoverLetterListOut,
  DocumentOut,
  DocumentListOut,
} from '../types/cv';

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
  decision: string;
  date_candidature?: string;
  offre?: OffreSummary | null;
}

export interface ApplicationsListOut {
  total: number;
  candidatures: ApplicationOut[];
}

export const candidateService = {
  // ── Profile ──────────────────────────────────────────────────────────────
  async getProfile(): Promise<CandidateProfileOut> {
    const res = await api.get<CandidateProfileOut>('/api/candidate/profile');
    return res.data;
  },

  async updateProfile(data: Partial<CandidateProfileOut>): Promise<CandidateProfileOut> {
    const res = await api.put<CandidateProfileOut>('/api/candidate/profile', data);
    return res.data;
  },

  async updatePersonal(data: Partial<CandidateProfileOut>): Promise<CandidateProfileOut> {
    const res = await api.put<CandidateProfileOut>('/api/candidate/profile/personal', data);
    return res.data;
  },

  async updateProfessional(data: Partial<CandidateProfileOut>): Promise<CandidateProfileOut> {
    const res = await api.put<CandidateProfileOut>('/api/candidate/profile/professional', data);
    return res.data;
  },

  async updateVisibility(data: {
    visibility_status: string;
    alert_frequency?: string;
  }): Promise<CandidateProfileOut> {
    const res = await api.put<CandidateProfileOut>('/api/candidate/profile/visibility', data);
    return res.data;
  },

  async getFullProfile(): Promise<FullProfileOut> {
    const res = await api.get<FullProfileOut>('/api/candidate/profile/full');
    return res.data;
  },

  async getCompletion(): Promise<ProfileCompletionOut> {
    const res = await api.get<ProfileCompletionOut>('/api/candidate/profile/completion');
    return res.data;
  },

  // ── Experiences ───────────────────────────────────────────────────────────
  async listExperiences(): Promise<ExperienceOut[]> {
    const res = await api.get<ExperienceOut[]>('/api/candidate/profile/experiences');
    return res.data;
  },

  async addExperience(data: {
    poste: string;
    entreprise: string;
    date_debut?: string;
    date_fin?: string;
    description?: string;
  }): Promise<ExperienceOut> {
    const res = await api.post<ExperienceOut>('/api/candidate/profile/experiences', data);
    return res.data;
  },

  async deleteExperience(id: number): Promise<void> {
    await api.delete(`/api/candidate/profile/experiences/${id}`);
  },

  // ── Skills ────────────────────────────────────────────────────────────────
  async listSkills(): Promise<SkillOut[]> {
    const res = await api.get<SkillOut[]>('/api/candidate/profile/skills');
    return res.data;
  },

  async addSkill(data: {
    nom_competence: string;
    niveau: string;
  }): Promise<SkillOut> {
    const res = await api.post<SkillOut>('/api/candidate/profile/skills', data);
    return res.data;
  },

  async deleteSkill(id: number): Promise<void> {
    await api.delete(`/api/candidate/profile/skills/${id}`);
  },

  // ── Cover Letters ─────────────────────────────────────────────────────────
  async listCoverLetters(): Promise<CoverLetterListOut> {
    const res = await api.get<CoverLetterListOut>('/api/candidate/cover-letters');
    return res.data;
  },

  async createCoverLetter(data: { titre: string; contenu: string }): Promise<CoverLetterOut> {
    const res = await api.post<CoverLetterOut>('/api/candidate/cover-letters', data);
    return res.data;
  },

  async updateCoverLetter(
    id: number,
    data: { titre: string; contenu: string }
  ): Promise<CoverLetterOut> {
    const res = await api.put<CoverLetterOut>(`/api/candidate/cover-letters/${id}`, data);
    return res.data;
  },

  async deleteCoverLetter(id: number): Promise<void> {
    await api.delete(`/api/candidate/cover-letters/${id}`);
  },

  // ── Documents ─────────────────────────────────────────────────────────────
  async listDocuments(): Promise<DocumentListOut> {
    const res = await api.get<DocumentListOut>('/api/candidate/documents');
    return res.data;
  },

  async uploadDocument(file: File, type_doc: string = 'Autre'): Promise<DocumentOut> {
    const form = new FormData();
    form.append('file', file);
    form.append('type_doc', type_doc);
    const res = await api.post<DocumentOut>('/api/candidate/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async deleteDocument(id: number): Promise<void> {
    await api.delete(`/api/candidate/documents/${id}`);
  },

  // ── Applications ──────────────────────────────────────────────────────────
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
