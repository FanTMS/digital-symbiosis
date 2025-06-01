import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../lib/api/users';
import type { Database } from '../types/supabase';

type User = Database['public']['Tables']['users']['Row'];

export function useUser(id: number) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<User> }) =>
      usersApi.updateUser(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useSearchUsers() {
  return useMutation({
    mutationFn: usersApi.searchUsers,
  });
} 