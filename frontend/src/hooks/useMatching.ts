import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { matchingService } from '../services/matchingService';
import type { Decision } from '../types/matching';

export function useMatchResults(offerId: number | null, limit = 50) {
  return useQuery({
    queryKey: ['matching', 'results', offerId, limit],
    queryFn: () => matchingService.getResults(offerId!, { limit }),
    enabled: !!offerId,
  });
}

export function useRunMatching() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: number) => matchingService.runMatching(offerId),
    onSuccess: (data, offerId) => {
      // Seed the cache with the results returned by POST to avoid an extra GET
      qc.setQueryData(['matching', 'results', offerId, 100], data);
      qc.setQueryData(['matching', 'results', offerId, 50], data);
      message.success(`Matching terminé — ${data.total} candidats analysés.`);
    },
    onError: () => message.error('Erreur lors du lancement du matching.'),
  });
}

export function useUpdateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      offerId,
      resultId,
      decision,
    }: {
      offerId: number;
      resultId: number;
      decision: Decision;
    }) => matchingService.updateDecision(offerId, resultId, { decision }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matching'] });
      message.success('Décision enregistrée.');
    },
    onError: () =>
      message.error("Erreur lors de l'enregistrement de la décision."),
  });
}
