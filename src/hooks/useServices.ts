import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../lib/api/services';
import type { Database } from '../types/supabase';

type Service = Database['public']['Tables']['services']['Row'];

export function useServices(category?: string, limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: ['services', category, limit, offset],
    queryFn: () => servicesApi.listServices(category, limit, offset),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesApi.getService(id),
    enabled: !!id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: servicesApi.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Service> }) =>
      servicesApi.updateService(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', id] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: servicesApi.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
} 