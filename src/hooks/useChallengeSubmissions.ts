import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '../lib/api/challenges';

export function useChallengeSubmissions(challengeId: string) {
  return useQuery({
    queryKey: ['challengeSubmissions', challengeId],
    queryFn: () => challengesApi.listSubmissions(challengeId),
    enabled: !!challengeId,
  });
}

export function useSubmitWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: challengesApi.submitWork,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['challengeSubmissions', data.challenge_id] });
    },
  });
} 