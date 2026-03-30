import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import type { AgentDashboard, BatchUploadResponse } from '@/types/agent'

export const useAgentDashboard = () =>
  useQuery({
    queryKey: ['agent', 'dashboard'],
    queryFn: async (): Promise<AgentDashboard> => {
      const res = await api.get('/api/agent/dashboard')
      return res.data
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

export const useCandidateResults = (cvId: number) =>
  useQuery({
    queryKey: ['agent', 'candidate-results', cvId],
    queryFn: async () => {
      const res = await api.get(`/api/agent/candidates/${cvId}/results`)
      return res.data
    },
    enabled: !!cvId,
    staleTime: 60_000,
  })

export const useAgentHistory = (page: number = 1) =>
  useQuery({
    queryKey: ['agent', 'history', page],
    queryFn: async () => {
      const res = await api.get(`/api/agent/history?page=${page}&limit=20`)
      return res.data
    },
    staleTime: 30_000,
  })

export const useBatchUpload = () =>
  useMutation({
    mutationFn: async (formData: FormData): Promise<BatchUploadResponse> => {
      const res = await api.post('/api/agent/cvs/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
  })
