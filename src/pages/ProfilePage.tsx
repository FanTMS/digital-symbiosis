import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Award, Gift, ChevronRight, CreditCard, FileText, Settings, LogOut, Star, MessageCircle, Pencil, X } from 'lucide-react';
import ProfileCard from '../components/ui/ProfileCard';
import Button from '../components/ui/Button';
import { User } from '../types/models';
import { supabase } from '../lib/supabase';
import Modal from '../components/ui/Modal';

const ProfilePage: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tg, user: currentUser } = useTelegram();
  const id = paramId || currentUser?.id;
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwn, setIsOwn] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || '');
  const [editDescription, setEditDescription] = useState(user?.description || '');
  const [editSkills, setEditSkills] = useState<string[]>(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        setUser(null);
        return;
      }
      setLoading(true);
      const idNum = Number(id);
      // Получаем пользователя
      const { data: userData } = await supabase.from('users').select('*').eq('id', idNum).single();
      setUser(userData);
      // Получаем отзывы (review.user_id = user.id)
      const { data: reviewData } = await supabase.from('reviews').select('*').eq('user_id', idNum).order('created_at', { ascending: false });
      setReviews(reviewData || []);
      // Получаем выполненные заказы (provider_id = user.id, status = completed)
      const { data: orderData } = await supabase.from('orders').select('*, service:services(*)').eq('provider_id', idNum).eq('status', 'completed').order('created_at', { ascending: false });
      setOrders(orderData || []);
      // Получаем услуги пользователя
      const { data: serviceData } = await supabase.from('services').select('*').eq('user_id', idNum).eq('is_active', true);
      setServices(serviceData || []);
      // Проверяем, свой ли это профиль
      setIsOwn(currentUser?.id === userData?.id);
      setEditName(userData?.name || '');
      setEditAvatar(userData?.avatar_url || '');
      setEditDescription(userData?.description || '');
      setEditSkills(userData?.skills || []);
      setSkillInput('');
      setLoading(false);
    })();
  }, [id, currentUser]);

  useEffect(() => {
    if (tg) {
      tg.setHeaderColor('#0BBBEF');
      tg.MainButton.hide();
    }
  }, [tg]);

  const menuItems = [
    { icon: CreditCard, label: 'Мои кредиты', value: user?.credits, onClick: () => alert('Кредиты: ' + user?.credits) },
    { icon: FileText, label: 'Мои услуги', onClick: () => navigate('/services') },
    { icon: Award, label: 'Достижения', badge: Array.isArray((user as any)?.badges) ? (user as any).badges.length : undefined, onClick: () => navigate('/achievements') },
    { icon: Gift, label: 'Пригласить друзей', onClick: () => navigate('/referrals') },
    { icon: Settings, label: 'Настройки', onClick: () => navigate('/settings') },
  ];
  
  // Реальный прогресс до следующего уровня
  const TASKS_FOR_NEXT_LEVEL = 20;
  const completedTasks = user?.completed_tasks || 0;
  const progressToNextLevel = Math.min(completedTasks / TASKS_FOR_NEXT_LEVEL, 1);

  if (loading) return (
    <div className="pb-16 pt-2">
      <div className="px-4 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-6 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="mb-6">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="w-full bg-gray-200 rounded-full h-2.5 animate-pulse" />
        </div>
        <div className="bg-white rounded-lg shadow-card overflow-hidden mb-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-gray-200 rounded mr-3 animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 grid md:grid-cols-2 gap-6">
        <div>
          <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
          {[1,2].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg mb-2 animate-pulse" />
          ))}
        </div>
        <div>
          <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
          {[1,2].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg mb-2 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
  if (!user) return <div className="p-8 text-center text-red-500">Пользователь не найден</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="pb-16 pt-2"
    >
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-bold mb-4">Профиль</h1>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <img src={user.avatar_url || 'https://images.pexels.com/photos/4926674/pexels-photo-4926674.jpeg?auto=compress&cs=tinysrgb&w=150'} alt={user.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary-500 cursor-pointer" onClick={() => setShowEditModal(true)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{user.name} <span className="text-gray-400 text-base">@{user.username}</span></span>
              {isOwn && (
                <button className="ml-2 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowEditModal(true)} title="Редактировать профиль">
                  <Pencil size={18} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Star size={18} className="text-yellow-400 fill-yellow-400" />
              <span className="font-medium">{user.rating?.toFixed(1) ?? '—'}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">Уровень: {user.level ?? '-'}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">Кредиты: {user.credits ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {/* Бейджи */}
              {Array.isArray((user as any).badges) && (user as any).badges.length > 0 ?
                (user as any).badges.map((b: any) => (
                  <span key={b.badge_id} title={b.badge?.name} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs gap-1"><Award size={14} />{b.badge?.name}</span>
                )) : <span className="text-gray-400 text-xs">Бейджей нет</span>}
            </div>
          </div>
          {!isOwn && (
            <Button className="ml-auto" leftIcon={<MessageCircle size={18} />} onClick={() => navigate(`/chat/${user.id}`)}>
              Написать сообщение
            </Button>
          )}
        </div>
        
        {!loading && (
          <>
            {/* Level progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-medium text-gray-700">Прогресс уровня</h2>
                <span className="text-xs text-gray-500">
                  {completedTasks}/{TASKS_FOR_NEXT_LEVEL} заданий до "{user!.level === 'Новичок' ? 'Специалист' : user!.level === 'Специалист' ? 'Эксперт' : 'Мастер'}"
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNextLevel * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-primary-500 h-2.5 rounded-full"
                ></motion.div>
              </div>
            </div>
            
            {/* Menu */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden mb-6">
              {menuItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 ${
                    index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  onClick={item.onClick}
                >
                  <div className="flex items-center">
                    <item.icon size={18} className="text-gray-500" />
                    <span className="ml-3 font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center">
                    {item.value && (
                      <span className="mr-2 text-accent-500 font-medium">{item.value}</span>
                    )}
                    {item.badge && (
                      <span className="mr-2 bg-primary-100 text-primary-800 text-xs py-0.5 px-2 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Стена профиля */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Отзывы */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Отзывы</h3>
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                    <div className="text-3xl mb-2">💬</div>
                    <div className="font-medium mb-1">Нет отзывов</div>
                    <div className="text-xs mb-2">Пользователь ещё не получил ни одного отзыва</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reviews.map(r => (
                      <div key={r.id} className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {[1,2,3,4,5].map(i => <Star key={i} size={14} className={i <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />)}
                          <span className="text-xs text-gray-500 ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm">{r.comment || <span className="text-gray-400">Без комментария</span>}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Выполненные заказы */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Выполненные заказы</h3>
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="font-medium mb-1">Нет выполненных заказов</div>
                    <div className="text-xs mb-2">Пользователь ещё не выполнил ни одного заказа</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.map(o => (
                      <div key={o.id} className="bg-gray-100 rounded-lg p-3">
                        <div className="font-medium">{o.service?.title || 'Без названия'}</div>
                        <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Услуги пользователя */}
              <div className="md:col-span-2">
                <h3 className="font-semibold text-lg mb-2">Услуги пользователя</h3>
                {services.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                    <div className="text-3xl mb-2">🛠️</div>
                    <div className="font-medium mb-1">Нет активных услуг</div>
                    <div className="text-xs mb-2">{isOwn ? 'Вы ещё не добавили ни одной услуги' : 'Пользователь ещё не добавил ни одной услуги'}</div>
                    {isOwn && (
                      <Button size="sm" variant="primary" onClick={() => navigate('/create-service')}>Добавить услугу</Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map(s => (
                      <div key={s.id} className="bg-white rounded-lg shadow p-3 flex flex-col">
                        <div className="font-medium mb-1">{s.title}</div>
                        <div className="text-xs text-gray-500 mb-1">{s.category}</div>
                        <div className="text-xs text-gray-500 mb-1">{s.price} кр.</div>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/services/${s.id}`)}>Подробнее</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Logout button */}
            <Button 
              variant="outline" 
              fullWidth 
              leftIcon={<LogOut size={16} />}
              onClick={() => alert('Выход из системы')}
            >
              Выйти из аккаунта
            </Button>
          </>
        )}
      </div>
      {/* Модальное окно для редактирования профиля */}
      {showEditModal && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="p-4 w-80">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Редактировать профиль</h2>
              <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="flex flex-col items-center mb-4">
              <label className="relative cursor-pointer group">
                <img src={editAvatar || user.avatar_url || 'https://images.pexels.com/photos/4926674/pexels-photo-4926674.jpeg?auto=compress&cs=tinysrgb&w=150'} alt="avatar" className="w-24 h-24 rounded-full object-cover border-2 border-primary-500" />
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setEditAvatar(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
                <span className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow group-hover:bg-primary-100"><Pencil size={16} /></span>
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Имя</label>
              <input type="text" className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50 resize-none" rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Навыки</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editSkills.length > 0 ? editSkills.map((skill, idx) => (
                  <span key={idx} className="flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                    {skill}
                    <button
                      type="button"
                      className="ml-1 text-gray-400 hover:text-red-500 focus:outline-none"
                      aria-label={`Удалить навык ${skill}`}
                      onClick={() => setEditSkills(editSkills.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </span>
                )) : <span className="text-gray-400 text-xs">Навыки не указаны</span>}
              </div>
              <input
                type="text"
                className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',')) {
                    e.preventDefault();
                    const newSkill = skillInput.trim();
                    if (
                      newSkill &&
                      newSkill.length <= 30 &&
                      !editSkills.includes(newSkill) &&
                      editSkills.length < 10
                    ) {
                      setEditSkills([...editSkills, newSkill]);
                    }
                    setSkillInput('');
                  }
                }}
                placeholder="Введите навык и нажмите Enter или запятую"
                maxLength={30}
                disabled={editSkills.length >= 10}
              />
              <div className="text-xs text-gray-400 mt-1">Максимум 10 навыков, каждый до 30 символов</div>
            </div>
            <button className="w-full bg-primary-500 text-white rounded py-2 font-medium disabled:opacity-60" disabled={saving} onClick={async () => {
              setSaving(true);
              // Сохраняем изменения (имя, аватар, описание, навыки)
              await supabase.from('users').update({
                name: editName,
                avatar_url: editAvatar,
                description: editDescription,
                skills: editSkills,
              }).eq('id', user.id);
              setShowEditModal(false);
              setSaving(false);
              window.location.reload();
            }}>Сохранить</button>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default ProfilePage;