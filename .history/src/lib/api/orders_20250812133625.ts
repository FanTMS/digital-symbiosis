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
    const query = supabase
      .from('orders')
      .select(`
        *,
        service:services(*),
        client:users!orders_client_id_fkey(*),
        provider:users!orders_provider_id_fkey(*),
        review:reviews(*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role === 'client') {
      // Заказы, где текущий пользователь — заказчик
      query.eq('client_id', userId);
    } else {
      // Заказы, где текущий пользователь — исполнитель
      query.eq('provider_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as OrderWithDetails[];
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
   * 1) Вызывает RPC lock_credits с идентификатором транзакции
   * 2) Добавляет запись в orders c escrow_locked=true и transaction_id
   */
  async createOrder(
    order: Omit<
      Order,
      'id' | 'created_at' | 'updated_at' | 'completed_at' | 'escrow_locked' | 'payout_done'
    > & { quiz_answers?: any; deadline_at?: string; transaction_id?: string }
  ) {
    // Используем переданный transaction_id, либо генерируем новый
    const transactionId =
      order.transaction_id ||
      `order_${order.client_id}_${order.service_id}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 10)}`;
    
    try {
      // 1. Резервируем средства клиента с идентификатором транзакции
      const lockRes = await supabase.rpc('lock_credits', {
        user_id: order.client_id,
        amount: order.price,
        transaction_id: transactionId
      });
      
      if (lockRes.error) {
        // Обрабатываем специфические ошибки
        if (lockRes.error.message.includes('transaction_in_progress')) {
          throw new Error('TRANSACTION_IN_PROGRESS');
        } else if (lockRes.error.message.includes('insufficient_funds')) {
          throw new Error('NOT_ENOUGH_CREDITS');
        }
        throw lockRes.error;
      }

      // 2. Создаём заказ с идентификатором транзакции
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData = { 
        ...order, 
        escrow_locked: true,
        transaction_id: transactionId 
      } as any;

      const { data, error } = await supabase
        .from('orders')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Нет необходимости разблокировать кредиты при ошибке - идентификатор транзакции предотвращает дублирование блокировок
      throw error;
    }
  },

  /**
   * Обновление статуса заказа. При статусе completed производим выплату исполнителю и проставляем payout_done
   */
  async updateOrderStatus(id: string, status: string) {
    const orderRes = await supabase
      .from('orders')
      .select('id, client_id, provider_id, price, status, completed_at, payout_done, transaction_id')
      .eq('id', id)
      .single();

    if (orderRes.error || !orderRes.data) throw orderRes.error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderCurrent = orderRes.data as any;

    const updates: Partial<Order> = { status };

    if (status === 'completed' && !orderCurrent.payout_done) {
      // Генерируем идентификатор транзакции для выплаты
      const payoutTransactionId = `payout_${orderCurrent.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Выплата исполнителю с идентификатором транзакции
      const payout = await supabase.rpc('payout_to_provider', {
        client_id: orderCurrent.client_id,
        provider_id: orderCurrent.provider_id,
        amount: orderCurrent.price,
        order_id: orderCurrent.id,
        transaction_id: payoutTransactionId
      });
      
      if (payout.error) {
        // Обрабатываем специфические ошибки
        if (payout.error.message.includes('transaction_in_progress')) {
          throw new Error('TRANSACTION_IN_PROGRESS');
        }
        throw payout.error;
      }
      
      updates.completed_at = new Date().toISOString();
      // @ts-ignore - см. выше
      updates.payout_done = true;
    }

    // Возврат средств клиенту
    // @ts-ignore escrow_locked
    if ((status === 'refunded' || status === 'cancelled') && orderCurrent.escrow_locked) {
      // Генерируем идентификатор транзакции для разблокировки
      const unlockTransactionId = `unlock_${orderCurrent.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Разблокируем средства с идентификатором транзакции
      const unlock = await supabase.rpc('unlock_credits', {
        user_id: orderCurrent.client_id,
        amount: orderCurrent.price,
        transaction_id: unlockTransactionId
      });
      
      if (unlock.error) {
        // Обрабатываем специфические ошибки
        if (unlock.error.message.includes('transaction_in_progress')) {
          throw new Error('TRANSACTION_IN_PROGRESS');
        }
        throw unlock.error;
      }
      
      // @ts-ignore
      updates.escrow_locked = false;
    }

    const { data, error } = await supabase
      .from('orders')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(updates as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('orders')
      .update({ deadline_at } as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}; 