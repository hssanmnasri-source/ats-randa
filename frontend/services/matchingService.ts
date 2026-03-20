import api from './api'
export const runMatching = (offerId: number, topN = 50) => api.post(`/api/rh/offers/${offerId}/matching`, null, { params: { top_n: topN } })
export const getMatchingResults = (offerId: number) => api.get(`/api/rh/offers/${offerId}/matching`)
export const updateDecision = (offerId: number, resultId: number, decision: string) => api.patch(`/api/rh/offers/${offerId}/matching/${resultId}`, { decision })