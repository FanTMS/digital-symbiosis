import { supabase } from '../supabase';

export const challengesApi = {
  // Получить список челленджей
  async list() {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  // Получить челлендж по id
  async getById(id: string) {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  // Создать челлендж (для админа/спонсора)
  async create(challenge: Omit<any, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('challenges')
      .insert([challenge])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
}; 