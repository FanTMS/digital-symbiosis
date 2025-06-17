import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceProposalsApi } from '../lib/api/priceProposals';
import type { PriceProposal } from '../types/models';

export function usePriceProposals(orderId: string, userId: number) {
  return useQuery<PriceProposal[]>({
    queryKey: ['priceProposals', orderId, userId],
    queryFn: () => priceProposalsApi.listByOrder(orderId, userId),
    enabled: !!orderId && !!userId,
  });
}

export function useCreatePriceProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: priceProposalsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['priceProposals', data.order_id] });
    },
  });
}

export function useUpdatePriceProposalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) =>
      priceProposalsApi.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['priceProposals', data.order_id] });
    },
  });
} 