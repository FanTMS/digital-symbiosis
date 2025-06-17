import { supabase } from '../../lib/supabase';
import type { PriceProposal } from '../../types/models';

export const priceProposalsApi = {
  // Получить предложения по заказу (только для участников)
  async listByOrder(orderId: string, userId: number): Promise<PriceProposal[]> {
    const { data, error } = await supabase
      .from('price_proposals')
      .select('*')
      .eq('order_id', orderId)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Создать новое предложение
  async create(proposal: Omit<PriceProposal, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('price_proposals')
      .insert({ ...proposal, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Обновить статус предложения (принять/отклонить)
  async updateStatus(id: string, status: 'accepted' | 'rejected') {
    const { data, error } = await supabase
      .from('price_proposals')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
}; 