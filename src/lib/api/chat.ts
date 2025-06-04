import { supabase } from '../supabase';

export const chatApi = {
  async getOrCreateChat(user1_id: number, user2_id: number) {
    let { data: chat } = await supabase
      .from('chats')
      .select('*')
      .or(`and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`)
      .single();

    if (!chat) {
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert([{ user1_id, user2_id }])
        .select()
        .single();
      if (error) throw error;
      chat = newChat;
    }
    return chat;
  },

  async listMessages(chat_id: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async sendMessage(chat_id: string, sender_id: number, content: string, meta?: object) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_id, sender_id, content, meta: meta || null }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}; 