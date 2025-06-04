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
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
      data-oid="1ttqm6d"
    >
      <h2 className="text-xl font-bold mb-4" data-oid="6:2rxq5">
        Отчёт по рефералам и промокодам
      </h2>
      <div className="mb-4 flex gap-2" data-oid="pix3wp2">
        <input
          type="text"
          className="w-full md:w-72 rounded border px-3 py-2"
          placeholder="Поиск по имени или ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-oid="qg8rfag"
        />
      </div>
      {loading ? (
        <div data-oid="5vk-70:">Загрузка...</div>
      ) : (
        <div className="overflow-x-auto" data-oid="o_5yt2p">
          <table className="min-w-full text-sm" data-oid="1vo74e.">
            <thead data-oid="0aebp3i">
              <tr data-oid="b83_efr">
                <th className="p-2 text-left" data-oid="o.bfw38">
                  ID
                </th>
                <th className="p-2 text-left" data-oid="brupgvn">
                  Пригласивший
                </th>
                <th className="p-2 text-left" data-oid="8896p4o">
                  Код пригласившего
                </th>
                <th className="p-2 text-left" data-oid="ilv91y.">
                  Приглашённый
                </th>
                <th className="p-2 text-left" data-oid=":oovalt">
                  Код приглашённого
                </th>
                <th className="p-2 text-left" data-oid="_tj9hou">
                  Дата
                </th>
                <th className="p-2 text-left" data-oid="zs6-lnf">
                  Бонус
                </th>
                <th className="p-2 text-left" data-oid="-pgywqi">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody data-oid="c3ttq.t">
              {filtered.map((r) => (
                <tr key={r.id} className="border-b" data-oid="norzkke">
                  <td className="p-2" data-oid="u83_bb-">
                    {r.id}
                  </td>
                  <td className="p-2" data-oid="cbygzus">
                    {r.referrer?.name || r.referrer_id}
                  </td>
                  <td className="p-2 font-mono" data-oid="v:6thje">
                    {r.referrer?.referral_code}
                  </td>
                  <td className="p-2" data-oid="22e:tu1">
                    {r.referred?.name || r.referred_id}
                  </td>
                  <td className="p-2 font-mono" data-oid="zw47kzw">
                    {r.referred?.referral_code}
                  </td>
                  <td className="p-2" data-oid="-gqn.y6">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-2" data-oid="w5:hy.8">
                    {r.bonus_received ? "20/10 кр." : "-"}
                  </td>
                  <td className="p-2" data-oid="o0c9pc2">
                    {r.status}
                  </td>
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
