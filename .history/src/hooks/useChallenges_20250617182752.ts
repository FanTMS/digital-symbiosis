import { useQuery } from '@tanstack/react-query';
import { challengesApi } from '../lib/api/challenges';

export function useChallenges() {
    return useQuery({
        queryKey: ['challenges'],
        queryFn: challengesApi.list,
    });
} 