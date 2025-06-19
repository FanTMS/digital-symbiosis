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
  async listUserOrders(userId: number, role: 'client' | 'provider', limit: number = 20, offset: number = 0): Promise<OrderWithDetails[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        service:services(*),
        client:users!orders_client_id_fkey(*),
        provider:users!orders_provider_id_fkey(*),
        review:reviews(*)
      `)
      .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
      .range(offset, offset + limit - 1);

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

  /**
   * Создаёт заказ с резервированием средств (escrow)
   * 1) Вызывает RPC lock_credits
   * 2) Добавляет запись в orders c escrow_locked=true
   */
  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'escrow_locked' | 'payout_done'> & { quiz_answers?: any, deadline_at?: string }) {
    // 1. Резервируем средства клиента
    const lockRes = await supabase.rpc('lock_credits', {
      user_id: order.client_id,
      amount: order.price,
    });
    if (lockRes.error) throw lockRes.error;

    // 2. Создаём заказ
    const insertData = { ...order, escrow_locked: true } as Partial<Order>;

    const { data, error } = await supabase
      .from('orders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // При ошибке откатываем резерв
      await supabase.rpc('unlock_credits', {
        user_id: order.client_id,
        amount: order.price,
      });
      throw error;
    }
    return data;
  },

  /**
   * Обновление статуса заказа. При статусе completed производим выплату исполнителю и проставляем payout_done
   */
  async updateOrderStatus(id: string, status: string) {
    let orderRes = await supabase
      .from('orders')
      .select('id, client_id, provider_id, price, status, completed_at, payout_done')
      .eq('id', id)
      .single();

    if (orderRes.error || !orderRes.data) throw orderRes.error;
    const orderCurrent = orderRes.data as Order;

    const updates: Partial<Order> = { status };

    if (status === 'completed' && !orderCurrent.payout_done) {
      // Выплата исполнителю
      const payout = await supabase.rpc('payout_to_provider', {
        client_id: orderCurrent.client_id,
        provider_id: orderCurrent.provider_id,
        amount: orderCurrent.price,
        order_id: orderCurrent.id,
      });
      if (payout.error) throw payout.error;
      updates.completed_at = new Date().toISOString();
      updates.payout_done = true;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Обновление дедлайна заказа
   */
  async updateDeadline(id: string, deadline_at: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ deadline_at })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}; 