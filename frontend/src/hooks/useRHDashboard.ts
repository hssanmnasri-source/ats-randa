import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { RHStats, CVSearchResponse } from '../types/rh';

export function useRHStats() {
  return useQuery({
    queryKey: ['rh', 'stats'],
    queryFn: async (): Promise<RHStats> => {
      const res = await api.get<RHStats>('/api/rh/dashboard/stats');
      return res.data;
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useCVSearch(query: string) {
  return useQuery({
    queryKey: ['rh', 'cv-search', query],
    queryFn: async (): Promise<CVSearchResponse> => {
      const res = await api.get<CVSearchResponse>(
        `/api/rh/cvs/search?q=${encodeURIComponent(query)}&limit=20`,
      );
      return res.data;
    },
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}
