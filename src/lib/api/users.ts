import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

type User = Database['public']['Tables']['users']['Row'];
type UserWithBadges = User & {
  badges: {
    badge: Database['public']['Tables']['badges']['Row'];
  }[];
};

export const usersApi = {
  async getUser(id: number): Promise<UserWithBadges | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        badges:user_badges(
          badge:badges(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(id: number, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data;
  }
}; 