import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '../services/candidateService';
import { message } from 'antd';

// ── Full profile (single round-trip) ─────────────────────────────────────────

export function useFullProfile() {
  return useQuery({
    queryKey: ['candidate', 'full-profile'],
    queryFn: () => candidateService.getFullProfile(),
  });
}

// ── Profile completion ────────────────────────────────────────────────────────

export function useProfileCompletion() {
  return useQuery({
    queryKey: ['candidate', 'completion'],
    queryFn: () => candidateService.getCompletion(),
  });
}

// ── Profile update ────────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof candidateService.updateProfile>[0]) =>
      candidateService.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate'] });
      message.success('Profil mis à jour.');
    },
    onError: () => message.error('Erreur lors de la mise à jour.'),
  });
}

export function useUpdateVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof candidateService.updateVisibility>[0]) =>
      candidateService.updateVisibility(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate'] });
      message.success('Paramètres sauvegardés.');
    },
    onError: () => message.error('Erreur lors de la sauvegarde.'),
  });
}

// ── Experiences ───────────────────────────────────────────────────────────────

export function useExperiences() {
  return useQuery({
    queryKey: ['candidate', 'experiences'],
    queryFn: () => candidateService.listExperiences(),
  });
}

export function useAddExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof candidateService.addExperience>[0]) =>
      candidateService.addExperience(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate'] });
      message.success('Expérience ajoutée.');
    },
    onError: () => message.error("Erreur lors de l'ajout."),
  });
}

export function useDeleteExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => candidateService.deleteExperience(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate'] });
      message.success('Expérience supprimée.');
    },
    onError: () => message.error('Erreur lors de la suppression.'),
  });
}

// ── Skills ────────────────────────────────────────────────────────────────────

export function useSkills() {
  return useQuery({
    queryKey: ['candidate', 'skills'],
    queryFn: () => candidateService.listSkills(),
  });
}

export function useAddSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof candidateService.addSkill>[0]) =>
      candidateService.addSkill(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate'] });
      message.success('Compétence ajoutée.');
    },
    onError: () => message.error("Erreur lors de l'ajout."),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => candidateService.deleteSkill(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate'] });
      message.success('Compétence supprimée.');
    },
    onError: () => message.error('Erreur lors de la suppression.'),
  });
}

// ── Cover Letters ─────────────────────────────────────────────────────────────

export function useCoverLetters() {
  return useQuery({
    queryKey: ['candidate', 'cover-letters'],
    queryFn: () => candidateService.listCoverLetters(),
  });
}

export function useCreateCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { titre: string; contenu: string }) =>
      candidateService.createCoverLetter(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', 'cover-letters'] });
      message.success('Lettre créée.');
    },
    onError: () => message.error('Erreur lors de la création.'),
  });
}

export function useUpdateCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { titre: string; contenu: string } }) =>
      candidateService.updateCoverLetter(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', 'cover-letters'] });
      message.success('Lettre mise à jour.');
    },
    onError: () => message.error('Erreur lors de la mise à jour.'),
  });
}

export function useDeleteCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => candidateService.deleteCoverLetter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', 'cover-letters'] });
      message.success('Lettre supprimée.');
    },
    onError: () => message.error('Erreur lors de la suppression.'),
  });
}

// ── Documents ─────────────────────────────────────────────────────────────────

export function useCandidateDocuments() {
  return useQuery({
    queryKey: ['candidate', 'documents'],
    queryFn: () => candidateService.listDocuments(),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, type_doc }: { file: File; type_doc?: string }) =>
      candidateService.uploadDocument(file, type_doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', 'documents'] });
      message.success('Document uploadé.');
    },
    onError: () => message.error("Erreur lors de l'upload."),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => candidateService.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', 'documents'] });
      message.success('Document supprimé.');
    },
    onError: () => message.error('Erreur lors de la suppression.'),
  });
}
