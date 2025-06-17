import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '../lib/api/challenges';

export function useChallengeVotes(submissionId: string) {
    return useQuery({
        queryKey: ['challengeVotes', submissionId],
        queryFn: () => challengesApi.getVotes(submissionId),
        enabled: !!submissionId,
    });
}

export function useHasVoted(submissionId: string, userId: number) {
    return useQuery({
        queryKey: ['hasVoted', submissionId, userId],
        queryFn: () => challengesApi.hasVoted(submissionId, userId),
        enabled: !!submissionId && !!userId,
    });
}

export function useVote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ submissionId, userId }: { submissionId: string; userId: number }) =>
            challengesApi.vote(submissionId, userId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['challengeVotes', data.submission_id] });
            queryClient.invalidateQueries({ queryKey: ['hasVoted', data.submission_id, data.voter_id] });
        },
    });
} 