import api from './api'
export const getStats = () => api.get('/api/admin/stats')
export const getUsers = () => api.get('/api/admin/users')
export const createUser = (data: object) => api.post('/api/admin/users', data)
export const updateUser = (id: number, data: object) => api.put(`/api/admin/users/${id}`, data)
export const toggleUser = (id: number) => api.patch(`/api/admin/users/${id}/toggle`)
export const getDashboard = () => api.get('/api/rh/dashboard')