import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { CandidatureDetail } from '@/types/candidature'

export const useCandidatureDetail = (resultId: number | null) =>
  useQuery({
    queryKey: ['candidate', 'candidature-detail', resultId],
    queryFn: async (): Promise<CandidatureDetail> => {
      const res = await api.get(`/api/candidate/applications/${resultId}/detail`)
      return res.data
    },
    enabled: !!resultId,
    staleTime: 60_000,
  })
