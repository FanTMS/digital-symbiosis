import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import type { Service, Quiz } from '../types/models';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/ui/Modal';

const EditServicePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUser();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [skills, setSkills] = useState<string>('');
    const [quizId, setQuizId] = useState<string | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [quizLoading, setQuizLoading] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        supabase.from('services').select('*').eq('id', id).single().then(({ data }) => {
            if (data) {
                setService(data);
                setTitle(data.title || '');
                setDescription(data.description || '');
                setPrice(data.price?.toString() || '');
                setCategory(data.category || '');
                setSkills((data.skills || []).join(', '));
                setQuizId(data.quiz_id || null);
            }
        }).finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!user?.id) return;
        setQuizLoading(true);
        supabase.from('quizzes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
            .then(({ data }) => setQuizzes(data || []))
            .finally(() => setQuizLoading(false));
    }, [user?.id]);

    useEffect(() => {
        if (service && user?.id) {
            setIsOwner(service.user_id === user.id);
        }
    }, [service, user?.id]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            if (!service) throw new Error('Услуга не найдена');
            await supabase.from('services').update({
                title,
                description,
                price: Number(price),
                category,
                skills: skills.split(',').map(s => s.trim()).filter(Boolean),
                quiz_id: quizId || null,
            }).eq('id', service.id);
            alert('Услуга обновлена!');
            navigate(`/services/${service.id}`);
        } catch (e: any) {
            setError(e.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!service) return;
        setSaving(true);
        try {
            await supabase.from('services').delete().eq('id', service.id);
            alert('Услуга удалена!');
            navigate('/services');
        } catch (e: any) {
            setError(e.message || 'Ошибка удаления');
        } finally {
            setSaving(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) return <div className="p-4">Загрузка...</div>;
    if (!service) return <div className="p-4 text-red-500">Услуга не найдена</div>;
    if (!isOwner) return <div className="p-4 text-red-500">У вас нет прав на редактирование этой услуги</div>;

    return (
        <div className="max-w-xl mx-auto p-4 bg-white rounded-xl shadow">
            <h2 className="text-2xl font-bold mb-6">Редактировать услугу</h2>
            <div className="mb-4">
                <label className="block font-medium mb-1">Название</label>
                <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} />
            </div>
            <div className="mb-4">
                <label className="block font-medium mb-1">Описание</label>
                <textarea className="w-full border rounded px-3 py-2 min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
            </div>
            <div className="mb-4">
                <label className="block font-medium mb-1">Категория</label>
                <input className="w-full border rounded px-3 py-2" value={category} onChange={e => setCategory(e.target.value)} maxLength={40} />
            </div>
            <div className="mb-4">
                <label className="block font-medium mb-1">Навыки (через запятую)</label>
                <input className="w-full border rounded px-3 py-2" value={skills} onChange={e => setSkills(e.target.value)} maxLength={200} />
            </div>
            <div className="mb-4">
                <label className="block font-medium mb-1">Цена (кредитов)</label>
                <input className="w-full border rounded px-3 py-2" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <div className="mb-6">
                <label className="block font-medium mb-1">Квиз для клиента</label>
                {quizLoading ? (
                    <div>Загрузка квизов...</div>
                ) : (
                    <select className="w-full border rounded px-3 py-2" value={quizId || ''} onChange={e => setQuizId(e.target.value || null)}>
                        <option value="">Без квиза</option>
                        {quizzes.map(q => (
                            <option key={q.id} value={q.id}>{q.title}</option>
                        ))}
                    </select>
                )}
                <Button variant="outline" className="mt-2" onClick={() => navigate('/quizzes/new')}>Создать новый квиз</Button>
            </div>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving} fullWidth>
                Сохранить изменения
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)} disabled={saving} className="mt-4 w-full">
                Удалить услугу
            </Button>
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <div className="p-2">
                    <h2 className="text-lg font-bold mb-2">Удалить услугу?</h2>
                    <p className="mb-4 text-gray-600">Это действие необратимо. Все данные об услуге будут удалены.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={saving}>Отмена</Button>
                        <Button variant="danger" onClick={handleDelete} loading={saving} disabled={saving}>Удалить</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EditServicePage; 