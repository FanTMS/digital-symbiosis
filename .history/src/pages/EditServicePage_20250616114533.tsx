import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import type { Service, Quiz } from '../types/models';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/ui/Modal';
import { ChevronLeft, FileEdit, Trash2, Plus } from 'lucide-react';

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
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white flex flex-col items-center py-4 px-2 sm:px-0">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col gap-6 relative">
                <button onClick={() => navigate(`/services/${service.id}`)} className="mb-2 flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium absolute left-4 top-4">
                    <ChevronLeft size={22} /> <span>К услуге</span>
                </button>
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-blue-900 text-center flex items-center gap-2 justify-center"><FileEdit size={28} /> Редактировать услугу</h2>
                <div className="flex flex-col gap-4 mt-6">
                    <div>
                        <label className="block font-medium mb-1">Название</label>
                        <input className="w-full border rounded-xl px-3 py-2 text-base focus:ring-2 focus:ring-primary-400" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Описание</label>
                        <textarea className="w-full border rounded-xl px-3 py-2 min-h-[60px] text-base focus:ring-2 focus:ring-primary-400" value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Категория</label>
                        <input className="w-full border rounded-xl px-3 py-2 text-base focus:ring-2 focus:ring-primary-400" value={category} onChange={e => setCategory(e.target.value)} maxLength={40} />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Навыки (через запятую)</label>
                        <input className="w-full border rounded-xl px-3 py-2 text-base focus:ring-2 focus:ring-primary-400" value={skills} onChange={e => setSkills(e.target.value)} maxLength={200} />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Цена (кредитов)</label>
                        <input className="w-full border rounded-xl px-3 py-2 text-base focus:ring-2 focus:ring-primary-400" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Квиз для клиента</label>
                        <div className="flex flex-col gap-2">
                            {quizLoading ? (
                                <div>Загрузка квизов...</div>
                            ) : (
                                <select className="w-full border rounded-xl px-3 py-2 text-base focus:ring-2 focus:ring-primary-400" value={quizId || ''} onChange={e => setQuizId(e.target.value || null)}>
                                    <option value="">Без квиза</option>
                                    {quizzes.map(q => (
                                        <option key={q.id} value={q.id}>{q.title}</option>
                                    ))}
                                </select>
                            )}
                            <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-2 rounded-xl" onClick={() => navigate('/quizzes/new')}>
                                <Plus size={20} /> <span>Создать новый квиз</span>
                            </Button>
                        </div>
                    </div>
                </div>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                {/* Кнопка для десктопа */}
                <div className="hidden md:block mt-4">
                    <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving} fullWidth className="py-3 text-base rounded-xl">
                        Сохранить изменения
                    </Button>
                    <Button variant="danger" onClick={() => setShowDeleteModal(true)} disabled={saving} className="mt-4 w-full py-3 rounded-xl">
                        <Trash2 size={18} /> Удалить услугу
                    </Button>
                </div>
                {/* Фиксированная кнопка для мобильных */}
                <div className="md:hidden fixed left-0 right-0 bottom-0 z-40 px-2 pb-[90px] animate-fade-in flex flex-col gap-2">
                    <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving} fullWidth className="py-4 text-base rounded-2xl shadow-xl">
                        Сохранить изменения
                    </Button>
                    <Button variant="danger" onClick={() => setShowDeleteModal(true)} disabled={saving} fullWidth className="py-4 text-base rounded-2xl shadow-xl">
                        <Trash2 size={18} /> Удалить услугу
                    </Button>
                </div>
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
        </div>
    );
};

export default EditServicePage; 