import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cvService } from '../services/cvService';
import { msg } from '../services/messageService';
import type { CVFormIn, CVValidateIn } from '../types/cv';

export function useMyCVs() {
  return useQuery({
    queryKey: ['cv', 'mine'],
    queryFn: () => cvService.getMyCVs(),
    retry: false,
  });
}

export function useUploadCV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => cvService.uploadCV(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cv'] });
      msg.success('CV uploadé avec succès. Analyse en cours...');
    },
    onError: (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : "Erreur lors de l'upload.";
      msg.error(errMsg);
    },
  });
}

export function useCVForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CVFormIn) => cvService.createCVFromForm(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cv'] });
      msg.success('CV créé avec succès.');
    },
    onError: () => msg.error('Erreur lors de la création du CV.'),
  });
}

export function useMyCV(cvId: number | undefined) {
  return useQuery({
    queryKey: ['cv', 'single', cvId],
    queryFn: () => cvService.getMyCV(cvId!),
    enabled: !!cvId,
    refetchInterval: (query) => {
      const statut = query.state.data?.statut;
      // Poll every 3 s while the Celery task is still running
      return statut === 'UPLOADED' || statut === 'PARSING' ? 3000 : false;
    },
  });
}

export function useValidateCV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cvId, data }: { cvId: number; data: CVValidateIn }) =>
      cvService.validateCV(cvId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cv'] });
      qc.invalidateQueries({ queryKey: ['candidate'] });
      msg.success('CV validé ! Le matching sera recalculé sous peu.');
    },
    onError: () => msg.error('Erreur lors de la validation du CV.'),
  });
}

export function useAgentCVs(params?: { page?: number; limit?: number; search?: string; statut?: string; source?: string }) {
  return useQuery({
    queryKey: ['cvs', 'agent', params],
    queryFn: () => cvService.getAgentCVs(params),
  });
}

export function useAgentUploadCV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { file: File; nom: string; prenom: string; email?: string; telephone?: string }) => cvService.agentUploadCV(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cvs'] });
      msg.success('CV enregistré avec succès.');
    },
    onError: (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : "Erreur lors de l'upload.";
      msg.error(errMsg);
    },
  });
}
