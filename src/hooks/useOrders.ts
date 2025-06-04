import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../lib/api/orders';
import type { Database } from '../types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];

export function useOrders(userId: number, role: 'client' | 'provider', limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: ['orders', userId, role, limit, offset],
    queryFn: () => ordersApi.listUserOrders(userId, role, limit, offset),
    enabled: !!userId,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateOrderStatus(id, status),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    },
  });
} 