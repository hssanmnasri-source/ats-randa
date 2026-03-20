import api from './api'
export const getPublicOffers = (page = 1, limit = 20) => api.get('/api/visitor/offers', { params: { page, limit } })
export const getRhOffers = () => api.get('/api/rh/offers')
export const createOffer = (data: object) => api.post('/api/rh/offers', data)
export const updateOffer = (id: number, data: object) => api.put(`/api/rh/offers/${id}`, data)
export const deleteOffer = (id: number) => api.delete(`/api/rh/offers/${id}`)
export const applyToOffer = (offerId: number) => api.post(`/api/candidate/offers/${offerId}/apply`)