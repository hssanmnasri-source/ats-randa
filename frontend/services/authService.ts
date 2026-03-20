import api from './api'
export const login = (email: string, password: string) => api.post('/api/visitor/login', { email, password })
export const register = (nom: string, prenom: string, email: string, password: string) => api.post('/api/visitor/register', { nom, prenom, email, password })