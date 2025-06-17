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
    // Получить работы участников по челленджу
    async listSubmissions(challengeId: string) {
        const { data, error } = await supabase
            .from('challenge_submissions')
            .select('*')
            .eq('challenge_id', challengeId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    // Отправить работу
    async submitWork(submission: Omit<any, 'id' | 'created_at' | 'status'>) {
        const { data, error } = await supabase
            .from('challenge_submissions')
            .insert([{ ...submission, status: 'pending' }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    // Модерировать работу (approve/reject)
    async moderateSubmission(id: string, status: 'approved' | 'rejected') {
        const { data, error } = await supabase
            .from('challenge_submissions')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    // Загрузка файла работы в Storage
    async uploadSubmissionFile(file: File, userId: number, challengeId: string) {
        const ext = file.name.split('.').pop();
        const filePath = `submissions/${challengeId}/${userId}_${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('challenge-files').upload(filePath, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('challenge-files').getPublicUrl(filePath);
        return data.publicUrl;
    },
    // Получить комментарии к работе
    async listComments(submissionId: string) {
        const { data, error } = await supabase
            .from('challenge_comments')
            .select('*')
            .eq('submission_id', submissionId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },
    // Оставить комментарий
    async addComment(comment: { submission_id: string; user_id: number; text: string }) {
        const { data, error } = await supabase
            .from('challenge_comments')
            .insert([comment])
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    // Пожаловаться на работу
    async reportSubmission(report: { submission_id: string; user_id: number; reason: string }) {
        const { data, error } = await supabase
            .from('challenge_reports')
            .insert([report])
            .select()
            .single();
        if (error) throw error;
        return data;
    },
}; 