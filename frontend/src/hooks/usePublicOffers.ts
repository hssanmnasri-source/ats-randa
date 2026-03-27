import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerService } from '../services/offerService';
import type { OffersFilters } from '../types/offer';

export function usePublicOffers(filters?: OffersFilters) {
  return useQuery({
    queryKey: ['public', 'offers', filters],
    queryFn: () => offerService.listOffers(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublicOfferDetail(offerId: number) {
  return useQuery({
    queryKey: ['public', 'offer', offerId],
    queryFn: () => offerService.getOfferDetail(offerId),
    enabled: !!offerId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useApplyToOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: number) => offerService.applyToOffer(offerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', 'applications'] });
      qc.invalidateQueries({ queryKey: ['public', 'offers'] });
    },
  });
}
