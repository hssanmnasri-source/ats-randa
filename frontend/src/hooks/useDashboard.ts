import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { adminService } from '../services/adminService';
import type { RHDashboardStats } from '../types/api';

export function useRHDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'rh'],
    queryFn: async () => {
      const res = await api.get<RHDashboardStats>('/api/rh/dashboard');
      return res.data;
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['stats', 'admin'],
    queryFn: () => adminService.getStats(),
  });
}
