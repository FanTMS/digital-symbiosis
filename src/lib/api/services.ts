import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';
import type { Service } from '../../types/models';

type ServiceWithUser = Service & {
  user: Database['public']['Tables']['users']['Row'];
};

export const servicesApi = {
  async listServices(category?: string, limit: number = 20, offset: number = 0): Promise<ServiceWithUser[]> {
    const query = supabase
      .from('services')
      .select(`
        *,
        user:users!services_user_id_fkey(*)
      `)
      .eq('is_active', true)
      .range(offset, offset + limit - 1);
    
    if (category) {
      query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getService(id: string): Promise<ServiceWithUser | null> {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        user:users!services_user_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'rating' | 'reviews_count'>) {
    if (!service.user_id) {
      throw new Error('user_id обязателен для создания услуги');
    }
    const { data, error } = await supabase
      .from('services')
      .insert({ ...service, is_active: true, user_id: service.user_id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateService(id: string, updates: Partial<Service>) {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteService(id: string) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}; 