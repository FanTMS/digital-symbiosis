import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";
import { Search, Gift, Award } from 'lucide-react';

const ReferralsAdminPanel: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Получаем все активации промокодов с пользователями
      const { data } = await supabase
        .from("referrals")
        .select(
          "*, referrer:users!referrals_referrer_id_fkey(*), referred:users!referrals_referred_id_fkey(*)",
        )
        .order("created_at", { ascending: false });
      setReferrals(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = referrals.filter((r) => {
    const refName = r.referrer?.name?.toLowerCase() || "";
    const referredName = r.referred?.name?.toLowerCase() || "";
    return (
      refName.includes(search.toLowerCase()) ||
      referredName.includes(search.toLowerCase()) ||
      String(r.referrer_id).includes(search) ||
      String(r.referred_id).includes(search)
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Award size={28} className="text-primary-500" /> Отчёт по рефералам и промокодам
      </h2>
      <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-base bg-gray-50 pl-10"
            placeholder="Поиск по имени или ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 animate-pulse">Загрузка...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-sm">
          <table className="min-w-full text-base border">
            <thead>
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Пригласивший</th>
                <th className="p-2 text-left">Код пригласившего</th>
                <th className="p-2 text-left">Приглашённый</th>
                <th className="p-2 text-left">Код приглашённого</th>
                <th className="p-2 text-left">Дата</th>
                <th className="p-2 text-left">Бонус</th>
                <th className="p-2 text-left">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-primary-50/30 transition">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.referrer?.name || r.referrer_id}</td>
                  <td className="p-2 font-mono">{r.referrer?.referral_code}</td>
                  <td className="p-2">{r.referred?.name || r.referred_id}</td>
                  <td className="p-2 font-mono">{r.referred?.referral_code}</td>
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2">{r.bonus_received ? <span className="text-green-600 font-semibold">20/10 кр.</span> : <span className="text-gray-400">-</span>}</td>
                  <td className="p-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReferralsAdminPanel;
