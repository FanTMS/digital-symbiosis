import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '../lib/api/challenges';

export function useChallengeComments(submissionId: string) {
    return useQuery({
        queryKey: ['challengeComments', submissionId],
        queryFn: () => challengesApi.listComments(submissionId),
        enabled: !!submissionId,
    });
}

export function useAddComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: challengesApi.addComment,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['challengeComments', data.submission_id] });
        },
    });
} 