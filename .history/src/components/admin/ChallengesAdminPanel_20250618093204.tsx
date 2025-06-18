import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { Loader2, CheckCircle, Pencil } from "lucide-react";

interface Challenge {
    id: number;
    title: string;
    status: string;
    ends_at: string;
}

interface Submission {
    id: number;
    user_name: string;
    file_url: string | null;
    comment: string | null;
    is_finalist: boolean;
}

interface ChallengeFormProps { challenge: Challenge; onClose: () => void; onSaved: () => void; }

const EditChallengeModal: React.FC<ChallengeFormProps> = ({ challenge, onClose, onSaved }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // поля
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [prize, setPrize] = useState('');
    const [prizeType, setPrizeType] = useState<'money' | 'certificate' | 'item' | 'points'>('money');
    const [brand, setBrand] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [participantsLimit, setParticipantsLimit] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.from('challenges').select('*').eq('id', challenge.id).single();
            if (data) {
                setTitle(data.title || '');
                setDescription(data.description || '');
                setPrize(data.prize || '');
                setPrizeType(data.prize_type || 'money');
                setBrand(data.brand || '');
                setEndsAt(data.ends_at ? data.ends_at.slice(0, 10) : '');
                setParticipantsLimit(data.participants_limit?.toString() || '');
                setImagePreview(data.image_url || null);
            }
            setLoading(false);
        })();
    }, [challenge.id]);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        let image_url = imagePreview;
        if (imageFile) {
            const ext = imageFile.name.split('.').pop();
            const path = `challenges/${challenge.id}/${Date.now()}.${ext}`;
            await supabase.storage.from('challenge-files').upload(path, imageFile, { upsert: true });
            const { data } = supabase.storage.from('challenge-files').getPublicUrl(path);
            image_url = data.publicUrl;
        }
        await supabase.from('challenges').update({
            title, description, prize, prize_type: prizeType, brand, ends_at: endsAt, participants_limit: participantsLimit ? Number(participantsLimit) : null, image_url
        }).eq('id', challenge.id);
        setSaving(false);
        onSaved();
        onClose();
    }

    if (loading) {
        return <Modal isOpen onClose={onClose}><div className="p-6 flex items-center gap-2"><Loader2 className="animate-spin" /> Загрузка...</div></Modal>;
    }

    return (
        <Modal isOpen onClose={onClose}>
            <form onSubmit={handleSave} className="p-4 w-[90vw] max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-center">Редактировать челлендж</h3>

                <div>
                    <label className="block text-sm font-medium mb-1">Название</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary-200" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Описание</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary-200"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Тип приза</label>
                        <select value={prizeType} onChange={e => setPrizeType(e.target.value as any)} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50">
                            <option value="money">💰 Деньги</option>
                            <option value="certificate">🎫 Сертификат</option>
                            <option value="item">🎁 Товар</option>
                            <option value="points">⭐ Баллы</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Приз</label>
                        <input value={prize} onChange={e => setPrize(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Дата окончания</label>
                        <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Лимит участников</label>
                        <input type="number" min="1" value={participantsLimit} onChange={e => setParticipantsLimit(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Бренд</label>
                    <input value={brand} onChange={e => setBrand(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Изображение</label>
                    <div className="flex items-center gap-3">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="flex-1" />
                        {imagePreview && <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded-lg" />}
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Отмена</Button>
                    <Button variant="primary" className="flex-1" type="submit" isLoading={saving}>Сохранить</Button>
                </div>
            </form>
        </Modal>
    );
};

const ChallengesAdminPanel: React.FC = () => {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const finalistsLimit = 10;
    const [editModal, setEditModal] = useState<Challenge | null>(null);

    useEffect(() => {
        fetchChallenges();
    }, []);

    async function fetchChallenges() {
        setLoading(true);
        const { data } = await supabase
            .from("challenges")
            .select("id, title, status, ends_at")
            .in("status", ["active", "voting"])
            .order("created_at", { ascending: false });
        setChallenges((data as any) || []);
        setLoading(false);
    }

    async function openSelectModal(ch: Challenge) {
        setSelectedChallenge(ch);
        setSelectedIds(new Set());
        setSubsLoading(true);
        const { data } = await supabase
            .from("challenge_submissions")
            .select("id, user_name, file_url, comment, is_finalist")
            .eq("challenge_id", ch.id)
            .eq("status", "approved");
        setSubmissions((data as any) || []);
        setSubsLoading(false);
    }

    function toggleId(id: number) {
        setSelectedIds(prev => {
            const copy = new Set(prev);
            copy.has(id) ? copy.delete(id) : copy.add(id);
            return copy;
        });
    }

    async function handleSaveFinalists() {
        if (!selectedChallenge) return;
        setSubsLoading(true);
        // Сброс предыдущих финалистов
        await supabase
            .from("challenge_submissions")
            .update({ is_finalist: false })
            .eq("challenge_id", selectedChallenge.id);
        // Обновляем выбранных
        await supabase
            .from("challenge_submissions")
            .update({ is_finalist: true })
            .in("id", Array.from(selectedIds));
        // Переводим челлендж в статус voting
        await supabase
            .from("challenges")
            .update({ status: "voting" })
            .eq("id", selectedChallenge.id);
        await fetchChallenges();
        setSelectedChallenge(null);
        setSubsLoading(false);
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Челленджи</h2>
            {loading ? (
                <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>
            ) : (
                <div className="overflow-x-auto rounded-xl shadow-sm">
                    <table className="min-w-full text-base border">
                        <thead>
                            <tr>
                                <th className="p-2 text-left">ID</th>
                                <th className="p-2 text-left">Название</th>
                                <th className="p-2 text-left">Статус</th>
                                <th className="p-2 text-left">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {challenges.map((c) => (
                                <tr key={c.id} className="border-b hover:bg-primary-50/30 transition">
                                    <td className="p-2">{c.id}</td>
                                    <td className="p-2">{c.title}</td>
                                    <td className="p-2 capitalize">{c.status}</td>
                                    <td className="p-2 flex gap-2">
                                        {c.status === "active" ? (
                                            <Button size="sm" onClick={() => openSelectModal(c)}>
                                                Финалисты
                                            </Button>
                                        ) : (
                                            <span className="text-gray-500 text-sm">В голосовании</span>
                                        )}
                                        <Button size="sm" variant="outline" onClick={() => setEditModal(c)}>
                                            <Pencil size={14} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Модалка выбора финалистов */}
            {selectedChallenge && (
                <Modal isOpen onClose={() => setSelectedChallenge(null)}>
                    <div className="p-4 w-[90vw] max-w-2xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            Финалисты • {selectedIds.size}/{finalistsLimit}
                        </h3>
                        {subsLoading ? (
                            <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                {submissions.length === 0 ? (
                                    <p className="text-gray-500">Нет одобренных работ</p>
                                ) : (
                                    submissions.map((s) => {
                                        const checked = selectedIds.has(s.id);
                                        const disabled = !checked && selectedIds.size >= finalistsLimit;
                                        return (
                                            <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${checked ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={disabled}
                                                    className="h-4 w-4 text-primary-600"
                                                    onChange={() => toggleId(s.id)}
                                                />
                                                {s.file_url && <img src={s.file_url} alt="work" className="w-10 h-10 object-cover rounded-lg" />}
                                                <span className="flex-1 text-sm truncate">{s.user_name} – {s.comment?.slice(0, 40) || 'Без описания'}</span>
                                                {checked && <CheckCircle size={18} className="text-primary-500" />}
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        )}
                        <div className="mt-4 flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedChallenge(null)}>Отмена</Button>
                            <Button variant="primary" className="flex-1" onClick={handleSaveFinalists} disabled={selectedIds.size === 0 || subsLoading}>Сохранить</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {editModal && (
                <EditChallengeModal challenge={editModal} onClose={() => setEditModal(null)} onSaved={fetchChallenges} />
            )}
        </div>
    );
};

export default ChallengesAdminPanel; 