import api from './api';
import type {
  JobOffer,
  CreateOfferRequest,
  UpdateOfferRequest,
  PublicOfferListOut,
  OfferListOut,
} from '../types/offer';
import type { MatchingResultsOut, UpdateDecisionRequest, ResultatOut } from '../types/matching';

export const offerService = {
  // Public
  async getPublicOffers(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PublicOfferListOut> {
    const res = await api.get<PublicOfferListOut>('/api/visitor/offers', { params });
    return res.data;
  },

  async getPublicOffer(id: number): Promise<JobOffer> {
    const res = await api.get<JobOffer>(`/api/visitor/offers/${id}`);
    return res.data;
  },

  // RH
  async getRHOffers(params?: { page?: number; limit?: number; search?: string }): Promise<OfferListOut> {
    const res = await api.get<OfferListOut>('/api/rh/offers', { params });
    return res.data;
  },

  async getRHOffer(id: number): Promise<JobOffer> {
    const res = await api.get<JobOffer>(`/api/rh/offers/${id}`);
    return res.data;
  },

  async createOffer(data: CreateOfferRequest): Promise<JobOffer> {
    const res = await api.post<JobOffer>('/api/rh/offers', data);
    return res.data;
  },

  async updateOffer(id: number, data: UpdateOfferRequest): Promise<JobOffer> {
    const res = await api.put<JobOffer>(`/api/rh/offers/${id}`, data);
    return res.data;
  },

  async archiveOffer(id: number): Promise<void> {
    await api.delete(`/api/rh/offers/${id}`);
  },

  async runMatching(offerId: number): Promise<{ message: string }> {
    const res = await api.post(`/api/rh/offers/${offerId}/matching`);
    return res.data;
  },

  async getMatchingResults(offerId: number): Promise<MatchingResultsOut> {
    const res = await api.get<MatchingResultsOut>(`/api/rh/offers/${offerId}/matching`);
    return res.data;
  },

  async updateDecision(
    offerId: number,
    resultId: number,
    data: UpdateDecisionRequest
  ): Promise<ResultatOut> {
    const res = await api.patch<ResultatOut>(
      `/api/rh/offers/${offerId}/matching/${resultId}`,
      data
    );
    return res.data;
  },
};
