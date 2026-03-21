import api from './api';
import type { MatchingResultsOut, UpdateDecisionRequest, ResultatOut } from '../types/matching';

export const matchingService = {
  async runMatching(offerId: number): Promise<{ message: string }> {
    const res = await api.post(`/api/rh/offers/${offerId}/matching`);
    return res.data;
  },

  async getResults(
    offerId: number,
    params?: { skip?: number; limit?: number }
  ): Promise<MatchingResultsOut> {
    const res = await api.get<MatchingResultsOut>(
      `/api/rh/offers/${offerId}/matching`,
      { params }
    );
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
