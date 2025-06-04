import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTelegram } from "../hooks/useTelegram";
import { Share2, Gift, Users, Award, Copy, Check } from "lucide-react";
import Button from "../components/ui/Button";
import type { User, Referral } from "../types/models";
import { formatDate } from "../utils/formatters";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

const ReferralsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tg, user: rawUser } = useTelegram();
  const user = rawUser as User | null;

  const [userReferrals, setUserReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (tg) {
      tg.setHeaderColor("#0BBBEF");
      tg.BackButton.show();
      tg.BackButton.onClick(() => navigate("/"));

      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick();
      };
    }
  }, [tg, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchReferrals = async () => {
      setLoading(true);
      // Получаем все рефералы пользователя
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*, referred:users!referrals_referred_id_fkey(*)")
        .eq("referrer_id", user.id);
      if (!error && referrals) {
        setUserReferrals(referrals);
        // Сохраняем пользователей, которые активировали промокод
        setInvitedUsers(referrals.map((r) => r.referred));
      }
      setLoading(false);
    };
    fetchReferrals();
  }, [user?.id]);

  const getUserById = (id: number) => {
    // В реальном проекте лучше использовать глобальный стор или отдельный запрос
    // Здесь делаем простой запрос к Supabase
    // (или можно прокинуть пользователей через props/контекст)
    return null; // TODO: реализовать при необходимости
  };

  const getReferralStatusInfo = (status: string) => {
    switch (status) {
      case "invited":
        return {
          color: "text-yellow-500",
          bgColor: "bg-yellow-100",
          label: "Приглашен",
        };
      case "registered":
        return {
          color: "text-blue-500",
          bgColor: "bg-blue-100",
          label: "Зарегистрирован",
        };
      case "active":
        return {
          color: "text-green-500",
          bgColor: "bg-green-100",
          label: "Активен",
        };
      default:
        return {
          color: "text-gray-500",
          bgColor: "bg-gray-100",
          label: "Неизвестно",
        };
    }
  };

  // Персональная ссылка
  const referralLink = user?.referral_code
    ? `https://t.me/DigitalSymbiosisBot?start=ref${user.referral_code}`
    : "https://t.me/DigitalSymbiosisBot";

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (tg) {
      // In a real app, we'd use the actual sharing mechanism
      tg.showAlert("Функция отправки приглашений временно недоступна");
    } else {
      alert("Поделиться ссылкой");
    }
  };

  // Активация промокода
  const handleActivatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoLoading(true);
    setPromoError(null);
    setPromoSuccess(null);
    if (!user?.id) return;
    if (!promoCode.trim()) {
      setPromoError("Введите промокод");
      setPromoLoading(false);
      return;
    }
    if (user.used_referral_code) {
      setPromoError("Вы уже активировали промокод ранее");
      setPromoLoading(false);
      return;
    }
    if (promoCode === user.referral_code) {
      setPromoError("Нельзя активировать свой собственный промокод");
      setPromoLoading(false);
      return;
    }
    // Найти пригласившего
    const { data: inviter, error: inviterError } = await supabase
      .from("users")
      .select("*")
      .eq("referral_code", promoCode)
      .single();
    if (inviterError || !inviter) {
      setPromoError("Промокод не найден");
      setPromoLoading(false);
      return;
    }
    // Начислить кредиты обоим
    const updates = [
      supabase
        .from("users")
        .update({ credits: (inviter.credits || 0) + 20 })
        .eq("id", inviter.id),
      supabase
        .from("users")
        .update({
          credits: (user.credits || 0) + 10,
          used_referral_code: promoCode,
        })
        .eq("id", user.id),
    ];

    const [inviterRes, userRes] = await Promise.all(updates);
    if (inviterRes.error || userRes.error) {
      setPromoError("Ошибка начисления бонусов");
      setPromoLoading(false);
      return;
    }
    // Создать запись в referrals
    await supabase.from("referrals").insert({
      referrer_id: inviter.id,
      referred_id: user.id,
      status: "active",
      bonus_received: true,
    });
    setPromoSuccess("Промокод успешно активирован! Бонусы начислены.");
    setPromoLoading(false);
    setPromoCode("");
    toast.success("Промокод активирован!");
    // Можно обновить пользователя и рефералов
    window.location.reload();
  };

  return (
    <div className="pb-16 pt-2" data-oid="t6:s0tu">
      <div className="px-4" data-oid=":i7niwe">
        <h1 className="text-2xl font-bold mb-4" data-oid="lddoerp">
          Реферальная программа
        </h1>

        {/* Referral info card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-card overflow-hidden mb-6"
          data-oid="c4phz:w"
        >
          <div className="p-5" data-oid="4orp:wy">
            <div
              className="flex items-center justify-center mb-4"
              data-oid="9idfzsw"
            >
              <div
                className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center"
                data-oid="ro-nz2o"
              >
                <Gift
                  size={32}
                  className="text-primary-500"
                  data-oid="dc60ze:"
                />
              </div>
            </div>

            <h2
              className="text-center text-lg font-semibold mb-2"
              data-oid="mwbhe5o"
            >
              Приглашайте друзей
            </h2>
            <p className="text-center text-gray-600 mb-4" data-oid="v15ap:z">
              Получайте 5 кредитов за каждого приглашенного друга, который
              выполнит хотя бы одно задание
            </p>

            <div
              className="bg-gray-50 rounded-lg p-3 flex items-center justify-between mb-4"
              data-oid="q63eui2"
            >
              <span
                className="text-sm text-gray-600 truncate mr-2"
                data-oid="kfjcvjl"
              >
                {referralLink}
              </span>
              <button
                onClick={handleCopyReferralLink}
                className="p-2 bg-white rounded-lg"
                data-oid="i2t.3ps"
              >
                {copied ? (
                  <Check
                    size={18}
                    className="text-green-500"
                    data-oid="of0vg7."
                  />
                ) : (
                  <Copy size={18} data-oid="1d_gw23" />
                )}
              </button>
            </div>
            <div
              className="text-xs text-gray-500 mb-2 text-center"
              data-oid=":jev:e0"
            >
              Ваш реферальный код:{" "}
              <span className="font-mono text-primary-500" data-oid="zi0.s26">
                {user?.referral_code}
              </span>
            </div>

            {/* Форма для промокода */}
            <form
              onSubmit={handleActivatePromo}
              className="mb-4 flex flex-col gap-2"
              data-oid="15plhdf"
            >
              <label className="font-medium text-sm" data-oid="1c4sub9">
                У вас есть промокод?
              </label>
              <div className="flex gap-2" data-oid="y3snhjg">
                <input
                  type="text"
                  className="flex-1 rounded border px-3 py-2"
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoLoading}
                  data-oid="1wa0s:-"
                />

                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={promoLoading}
                  data-oid="bhno__y"
                >
                  Активировать
                </Button>
              </div>
              {promoError && (
                <div className="text-red-500 text-xs mt-1" data-oid="_x-01wy">
                  {promoError}
                </div>
              )}
              {promoSuccess && (
                <div className="text-green-500 text-xs mt-1" data-oid=":32nz8n">
                  {promoSuccess}
                </div>
              )}
            </form>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-card p-4 mb-6"
          data-oid="axd7ui-"
        >
          <h2 className="font-semibold mb-3" data-oid="u25ewyb">
            Статистика
          </h2>
          <div className="grid grid-cols-2 gap-4" data-oid="_0rrqr0">
            <div data-oid="y_elm2c">
              <div className="text-gray-500 text-sm mb-1" data-oid="9b536_5">
                Приглашено
              </div>
              <div
                className="text-2xl font-bold flex items-center"
                data-oid="maexaw7"
              >
                {userReferrals.length}
                <Users
                  size={18}
                  className="ml-2 text-primary-500"
                  data-oid="ypt71de"
                />
              </div>
            </div>
            <div data-oid="vf2altw">
              <div className="text-gray-500 text-sm mb-1" data-oid="hkmdf40">
                Заработано
              </div>
              <div
                className="text-2xl font-bold flex items-center"
                data-oid="vwtzdo3"
              >
                {userReferrals.filter((r) => r.bonus_received).length * 5}
                <Award
                  size={18}
                  className="ml-2 text-accent-500"
                  data-oid="5311h7."
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Referrals list */}
        <h2 className="font-semibold mb-3" data-oid="8.rm-5w">
          Приглашённые по вашему промокоду
        </h2>
        {loading ? (
          <div className="space-y-3" data-oid="qizjm5c">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-gray-100 animate-pulse h-20 rounded-lg"
                data-oid="wog.80n"
              ></div>
            ))}
          </div>
        ) : invitedUsers.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-3"
            data-oid="l4clz_t"
          >
            {userReferrals.map((referral, idx) => {
              const referredUser = invitedUsers[idx];
              const statusInfo = getReferralStatusInfo(referral.status);
              return (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg shadow-card p-3 flex items-center justify-between"
                  data-oid="8p8a9yo"
                >
                  <div className="flex items-center" data-oid="otrz.1i">
                    <div
                      className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden"
                      data-oid="vu6fzxc"
                    >
                      {referredUser?.avatar_url ? (
                        <img
                          src={referredUser.avatar_url}
                          alt={referredUser.name}
                          className="w-full h-full object-cover"
                          data-oid="j:e3usz"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-gray-500"
                          data-oid="y9kzne1"
                        >
                          <Users size={18} data-oid="gns0iq1" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3" data-oid="x96:coc">
                      <div className="font-medium" data-oid="iibuwv-">
                        {referredUser?.name || "Пользователь"}
                      </div>
                      <div className="text-xs text-gray-500" data-oid="1wn8h7z">
                        {referral.created_at
                          ? new Date(referral.created_at).toLocaleString()
                          : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center" data-oid="4y5:943">
                    {referral.bonus_received && (
                      <div
                        className="mr-2 flex items-center text-xs text-green-500 bg-green-50 py-1 px-2 rounded-full"
                        data-oid="3u78qgd"
                      >
                        <Check size={12} className="mr-1" data-oid="znh_b_s" />
                        +20/+10 кр.
                      </div>
                    )}
                    <div
                      className={`text-xs ${statusInfo.bgColor} ${statusInfo.color} py-1 px-2 rounded-full`}
                      data-oid="rvgu.61"
                    >
                      {statusInfo.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-8 text-center"
            data-oid="xvckbp3"
          >
            <div className="text-4xl mb-2" data-oid="z7mc9uv">
              👥
            </div>
            <h3 className="text-lg font-medium mb-1" data-oid="7yrx4_c">
              Нет приглашённых
            </h3>
            <p className="text-gray-500 mb-4 max-w-xs" data-oid="fbpw5pk">
              Вы ещё никого не пригласили. Поделитесь своим промокодом!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReferralsPage;
