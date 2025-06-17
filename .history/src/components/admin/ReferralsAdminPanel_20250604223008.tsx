import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";

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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-4">
        Отчёт по рефералам и промокодам
      </h2>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          className="w-full md:w-72 rounded border px-3 py-2"
          placeholder="Поиск по имени или ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
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
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.referrer?.name || r.referrer_id}</td>
                  <td className="p-2 font-mono">{r.referrer?.referral_code}</td>
                  <td className="p-2">{r.referred?.name || r.referred_id}</td>
                  <td className="p-2 font-mono">{r.referred?.referral_code}</td>
                  <td className="p-2">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">
                    {r.bonus_received ? "20/10 кр." : "-"}
                  </td>
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
