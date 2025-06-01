import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderWithDetails = Order & {
  service: Database['public']['Tables']['services']['Row'];
  client: Database['public']['Tables']['users']['Row'];
  provider: Database['public']['Tables']['users']['Row'];
  review?: Database['public']['Tables']['reviews']['Row'];
};

export const ordersApi = {
  async listUserOrders(userId: number, role: 'client' | 'provider'): Promise<OrderWithDetails[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        service:services(*),
        client:users!orders_client_id_fkey(*),
        provider:users!orders_provider_id_fkey(*),
        review:reviews(*)
      `)
      .eq(role === 'client' ? 'client_id' : 'provider_id', userId);

    if (error) throw error;
    return data;
  },

  async getOrder(id: string): Promise<OrderWithDetails | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        service:services(*),
        client:users!orders_client_id_fkey(*),
        provider:users!orders_provider_id_fkey(*),
        review:reviews(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrderStatus(id: string, status: string) {
    const updates: Partial<Order> = {
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 