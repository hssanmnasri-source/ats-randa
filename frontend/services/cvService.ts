import api from './api'
export const getMyCVs = () => api.get('/api/candidate/cvs')
export const uploadCV = (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/api/candidate/cvs/upload', fd) }
export const createCVForm = (data: object) => api.post('/api/candidate/cvs/form', data)
export const getMyApplications = () => api.get('/api/candidate/applications')
export const deleteApplication = (id: number) => api.delete(`/api/candidate/applications/${id}`)
export const getMyProfile = () => api.get('/api/candidate/profile')
export const updateMyProfile = (data: object) => api.put('/api/candidate/profile', data)
export const getAgentCVs = (params?: object) => api.get('/api/agent/cvs', { params })
export const getAgentCandidates = (params?: object) => api.get('/api/agent/candidates', { params })