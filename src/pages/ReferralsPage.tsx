import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { Share2, Gift, Users, Award, Copy, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import { User, Referral } from '../types';
import { formatDate } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const ReferralsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tg, user } = useTelegram();
  
  const [userReferrals, setUserReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  
  useEffect(() => {
    if (tg) {
      tg.setHeaderColor('#0BBBEF');
      tg.BackButton.show();
      tg.BackButton.onClick(() => navigate('/'));
      
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
        .from('referrals')
        .select('*, referred:users!referrals_referred_id_fkey(*)')
        .eq('referrer_id', user.id);
      if (!error && referrals) {
        setUserReferrals(referrals);
        // Сохраняем пользователей, которые активировали промокод
        setInvitedUsers(referrals.map(r => r.referred));
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
      case 'invited':
        return { color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Приглашен' };
      case 'registered':
        return { color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Зарегистрирован' };
      case 'active':
        return { color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Активен' };
      default:
        return { color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900/30', label: 'Неизвестно' };
    }
  };
  
  // Персональная ссылка
  const referralLink = user?.referral_code
    ? `https://t.me/DigitalSymbiosisBot?start=ref${user.referral_code}`
    : 'https://t.me/DigitalSymbiosisBot';
  
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = () => {
    if (tg) {
      // In a real app, we'd use the actual sharing mechanism
      tg.showAlert('Функция отправки приглашений временно недоступна');
    } else {
      alert('Поделиться ссылкой');
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
      setPromoError('Введите промокод');
      setPromoLoading(false);
      return;
    }
    if (user.used_referral_code) {
      setPromoError('Вы уже активировали промокод ранее');
      setPromoLoading(false);
      return;
    }
    if (promoCode === user.referral_code) {
      setPromoError('Нельзя активировать свой собственный промокод');
      setPromoLoading(false);
      return;
    }
    // Найти пригласившего
    const { data: inviter, error: inviterError } = await supabase
      .from('users')
      .select('*')
      .eq('referral_code', promoCode)
      .single();
    if (inviterError || !inviter) {
      setPromoError('Промокод не найден');
      setPromoLoading(false);
      return;
    }
    // Начислить кредиты обоим
    const updates = [
      supabase.from('users').update({ credits: (inviter.credits || 0) + 20 }).eq('id', inviter.id),
      supabase.from('users').update({ credits: (user.credits || 0) + 10, used_referral_code: promoCode }).eq('id', user.id),
    ];
    const [inviterRes, userRes] = await Promise.all(updates);
    if (inviterRes.error || userRes.error) {
      setPromoError('Ошибка начисления бонусов');
      setPromoLoading(false);
      return;
    }
    // Создать запись в referrals
    await supabase.from('referrals').insert({
      referrer_id: inviter.id,
      referred_id: user.id,
      status: 'active',
      bonus_received: true,
    });
    setPromoSuccess('Промокод успешно активирован! Бонусы начислены.');
    setPromoLoading(false);
    setPromoCode('');
    toast.success('Промокод активирован!');
    // Можно обновить пользователя и рефералов
    window.location.reload();
  };

  return (
    <div className="pb-16 pt-2">
      <div className="px-4">
        <h1 className="text-2xl font-bold mb-4">Реферальная программа</h1>
        
        {/* Referral info card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-card overflow-hidden mb-6"
        >
          <div className="p-5">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                <Gift size={32} className="text-primary-500" />
              </div>
            </div>
            
            <h2 className="text-center text-lg font-semibold mb-2">Приглашайте друзей</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Получайте 5 кредитов за каждого приглашенного друга, который выполнит хотя бы одно задание
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate mr-2">{referralLink}</span>
              <button 
                onClick={handleCopyReferralLink}
                className="p-2 bg-white dark:bg-gray-600 rounded-lg"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
            <div className="text-xs text-gray-500 mb-2 text-center">Ваш реферальный код: <span className="font-mono text-primary-500">{user?.referral_code}</span></div>
            
            <Button 
              variant="primary" 
              fullWidth 
              leftIcon={<Share2 size={18} />}
              onClick={handleShare}
            >
              Поделиться ссылкой
            </Button>
            
            {/* Форма для промокода */}
            <form onSubmit={handleActivatePromo} className="mb-4 flex flex-col gap-2">
              <label className="font-medium text-sm">У вас есть промокод?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded border px-3 py-2"
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  disabled={promoLoading}
                />
                <Button type="submit" size="sm" variant="primary" disabled={promoLoading}>Активировать</Button>
              </div>
              {promoError && <div className="text-red-500 text-xs mt-1">{promoError}</div>}
              {promoSuccess && <div className="text-green-500 text-xs mt-1">{promoSuccess}</div>}
            </form>
          </div>
        </motion.div>
        
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-4 mb-6"
        >
          <h2 className="font-semibold mb-3">Статистика</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Приглашено</div>
              <div className="text-2xl font-bold flex items-center">
                {userReferrals.length}
                <Users size={18} className="ml-2 text-primary-500" />
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Заработано</div>
              <div className="text-2xl font-bold flex items-center">
                {userReferrals.filter(r => r.bonusReceived).length * 5}
                <Award size={18} className="ml-2 text-accent-500" />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Referrals list */}
        <h2 className="font-semibold mb-3">Приглашённые по вашему промокоду</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 animate-pulse h-20 rounded-lg"></div>
            ))}
          </div>
        ) : invitedUsers.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {userReferrals.map((referral, idx) => {
              const referredUser = invitedUsers[idx];
              const statusInfo = getReferralStatusInfo(referral.status);
              return (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      {referredUser?.avatar_url ? (
                        <img src={referredUser.avatar_url} alt={referredUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <Users size={18} />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">{referredUser?.name || 'Пользователь'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {referral.created_at ? formatDate(referral.created_at) : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {referral.bon_received && (
                      <div className="mr-2 flex items-center text-xs text-green-500 bg-green-50 dark:bg-green-900/30 py-1 px-2 rounded-full">
                        <Check size={12} className="mr-1" />
                        +20/+10 кр.
                      </div>
                    )}
                    <div className={`text-xs ${statusInfo.bgColor} ${statusInfo.color} py-1 px-2 rounded-full`}>
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
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6 text-center"
          >
            <div className="text-4xl mb-2">👥</div>
            <h3 className="text-lg font-medium mb-1">Пока никого нет</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Поделитесь своей реферальной ссылкой с друзьями, чтобы получить бонусы
            </p>
            <Button 
              variant="primary" 
              leftIcon={<Share2 size={18} />}
              onClick={handleShare}
            >
              Пригласить друзей
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReferralsPage;