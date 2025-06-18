import { useQuery } from '@tanstack/react-query';
import { challengesApi } from '../lib/api/challenges';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';

export function useChallenges() {
    const { user } = useUser();

    return useQuery({
        queryKey: ['challenges', user?.id],
        queryFn: async () => {
            // Получаем все челленджи
            const challenges = await challengesApi.list();

            if (!user) return challenges;

            // Получаем информацию об участии пользователя
            const { data: submissions } = await supabase
                .from('challenge_submissions')
                .select('challenge_id')
                .eq('user_id', user.id);

            const userChallengeIds = new Set(submissions?.map(s => s.challenge_id) || []);

            // Добавляем информацию об участии
            return challenges.map(challenge => ({
                ...challenge,
                my_participation: userChallengeIds.has(challenge.id),
            }));
        },
    });
} 