import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { cvService } from '../services/cvService';
import type { CVFormIn } from '../types/cv';

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
      message.success('CV uploadé avec succès. Analyse en cours...');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'upload.";
      message.error(msg);
    },
  });
}

export function useCVForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CVFormIn) => cvService.createCVFromForm(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cv'] });
      message.success('CV créé avec succès.');
    },
    onError: () => message.error('Erreur lors de la création du CV.'),
  });
}

export function useAgentCVs(params?: { page?: number; limit?: number; search?: string }) {
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
      message.success('CV enregistré avec succès.');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'upload.";
      message.error(msg);
    },
  });
}
