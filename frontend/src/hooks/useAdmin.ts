import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { adminService } from '../services/adminService';
import api from '@/services/api';
import type { UserCreateIn } from '../types/api';
import type { AdminStats, SystemHealth } from '@/types/admin';

export function useUsers(params?: { page?: number; limit?: number; role?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getUsers(params),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreateIn) => adminService.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      message.success('Utilisateur créé avec succès.');
    },
    onError: () => message.error("Erreur lors de la création de l'utilisateur."),
  });
}

export function useToggleUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.toggleUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      message.success('Statut utilisateur mis à jour.');
    },
    onError: () => message.error('Erreur lors de la modification.'),
  });
}

export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<AdminStats> => {
      const res = await api.get('/api/admin/stats')
      return res.data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

export const useSystemHealth = () =>
  useQuery({
    queryKey: ['admin', 'health'],
    queryFn: async (): Promise<SystemHealth> => {
      const res = await api.get('/api/admin/system/health')
      return res.data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

export const useAuditLogs = (filters: {
  page?: number
  action?: string
  user_id?: number
}) =>
  useQuery({
    queryKey: ['admin', 'audit', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.action) params.append('action', filters.action)
      if (filters.user_id) params.append('user_id', String(filters.user_id))
      const res = await api.get(`/api/admin/audit/logs?${params}`)
      return res.data
    },
    staleTime: 30_000,
  })

export const useAdminUsers = (filters: {
  role?: string
  is_active?: boolean
  search?: string
  page?: number
}) =>
  useQuery({
    queryKey: ['admin', 'users-filtered', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.role) params.append('role', filters.role)
      if (filters.is_active !== undefined)
        params.append('is_active', String(filters.is_active))
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', String(filters.page))
      const res = await api.get(`/api/admin/users?${params}`)
      return res.data
    },
    staleTime: 60_000,
  })

export const useReindex = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/admin/system/reindex'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      qc.invalidateQueries({ queryKey: ['admin', 'health'] })
    },
  })
}
