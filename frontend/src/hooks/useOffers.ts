import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { offerService } from '../services/offerService';
import type { CreateOfferRequest, UpdateOfferRequest } from '../types/offer';

export function usePublicOffers(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['offers', 'public', params],
    queryFn: () => offerService.getPublicOffers(params),
  });
}

export function usePublicOffer(id: number) {
  return useQuery({
    queryKey: ['offer', 'public', id],
    queryFn: () => offerService.getPublicOffer(id),
    enabled: !!id,
  });
}

export function useRHOffers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['offers', 'rh', params],
    queryFn: () => offerService.getRHOffers(params),
  });
}

export function useRHOffer(id: number) {
  return useQuery({
    queryKey: ['offer', 'rh', id],
    queryFn: () => offerService.getRHOffer(id),
    enabled: !!id,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOfferRequest) => offerService.createOffer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      message.success('Offre créée avec succès.');
    },
    onError: () => message.error("Erreur lors de la création de l'offre."),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOfferRequest }) =>
      offerService.updateOffer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      message.success('Offre mise à jour.');
    },
    onError: () => message.error('Erreur lors de la mise à jour.'),
  });
}

export function useArchiveOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => offerService.archiveOffer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      message.success('Offre archivée.');
    },
    onError: () => message.error("Erreur lors de l'archivage."),
  });
}
