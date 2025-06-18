import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { Loader2, CheckCircle } from "lucide-react";

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

const ChallengesAdminPanel: React.FC = () => {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const finalistsLimit = 10;

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
                                    <td className="p-2">
                                        {c.status === "active" ? (
                                            <Button size="sm" onClick={() => openSelectModal(c)}>
                                                Выбрать финалистов
                                            </Button>
                                        ) : (
                                            <span className="text-gray-500 text-sm">В голосовании</span>
                                        )}
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
                            Выбор финалистов для: {selectedChallenge.title}
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
                                            <label key={s.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition ${checked ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={disabled}
                                                    className="h-4 w-4 text-primary-600"
                                                    onChange={() => toggleId(s.id)}
                                                />
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
        </div>
    );
};

export default ChallengesAdminPanel; 