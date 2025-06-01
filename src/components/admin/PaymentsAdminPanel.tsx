import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';

const PaymentsAdminPanel: React.FC = () => {
  // YooKassa settings
  const [shopId, setShopId] = useState('');
  const [secret, setSecret] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Topup templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Получить настройки ЮKassa
  useEffect(() => {
    (async () => {
      setSettingsLoading(true);
      const { data, error } = await supabase.from('yookassa_settings').select('*').single();
      if (error) setSettingsError(error.message);
      if (data) {
        setShopId(data.shop_id || '');
        setSecret(data.secret || '');
      }
      setSettingsLoading(false);
    })();
  }, []);

  // Получить шаблоны пополнения
  useEffect(() => {
    (async () => {
      setTemplatesLoading(true);
      const { data, error } = await supabase.from('topup_templates').select('*').order('credits');
      if (error) setTemplatesError(error.message);
      if (data) setTemplates(data);
      setTemplatesLoading(false);
    })();
  }, []);

  // Получить историю пополнений
  useEffect(() => {
    (async () => {
      setHistoryLoading(true);
      const { data } = await supabase.from('topup_history').select('*, user:users(*)').order('created_at', { ascending: false }).limit(50);
      setHistory(data || []);
      setHistoryLoading(false);
    })();
  }, []);

  // Сохранить настройки ЮKassa
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(false);
    const { error } = await supabase.from('yookassa_settings').upsert({ id: 1, shop_id: shopId, secret });
    if (error) setSettingsError(error.message);
    else setSettingsSuccess(true);
  };

  // Сохранить шаблон
  const handleSaveTemplate = async (tpl: any) => {
    if (!tpl.credits || !tpl.price) return;
    await supabase.from('topup_templates').upsert(tpl);
    setEditingTemplate(null);
    // Обновить список
    const { data } = await supabase.from('topup_templates').select('*').order('credits');
    setTemplates(data || []);
  };

  // Удалить шаблон
  const handleDeleteTemplate = async (id: number) => {
    await supabase.from('topup_templates').delete().eq('id', id);
    const { data } = await supabase.from('topup_templates').select('*').order('credits');
    setTemplates(data || []);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Настройки ЮKassa</h2>
        <form className="space-y-4" onSubmit={handleSaveSettings}>
          <div>
            <label className="block text-sm font-medium mb-1">Shop ID</label>
            <input type="text" className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800" value={shopId} onChange={e => setShopId(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Secret</label>
            <input type="text" className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800" value={secret} onChange={e => setSecret(e.target.value)} required />
          </div>
          {settingsError && <div className="text-red-500 text-sm">{settingsError}</div>}
          {settingsSuccess && <div className="text-green-500 text-sm">Сохранено!</div>}
          <Button type="submit" variant="primary" size="md" disabled={settingsLoading}>Сохранить</Button>
        </form>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Шаблоны пополнения</h2>
        {templatesLoading ? (
          <div>Загрузка...</div>
        ) : (
          <div className="space-y-2">
            {templates.map(tpl => (
              <div key={tpl.id} className="flex items-center gap-2 border-b py-2">
                {editingTemplate?.id === tpl.id ? (
                  <>
                    <input type="number" className="w-24 rounded border px-2 py-1" value={editingTemplate.credits} onChange={e => setEditingTemplate({ ...editingTemplate, credits: Number(e.target.value) })} />
                    <input type="number" className="w-24 rounded border px-2 py-1" value={editingTemplate.price} onChange={e => setEditingTemplate({ ...editingTemplate, price: Number(e.target.value) })} />
                    <Button size="sm" variant="primary" onClick={() => handleSaveTemplate(editingTemplate)}>Сохранить</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)}>Отмена</Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium w-24">{tpl.credits} кр.</span>
                    <span className="w-24">{tpl.price} ₽</span>
                    <Button size="sm" variant="outline" onClick={() => setEditingTemplate(tpl)}>Изменить</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteTemplate(tpl.id)}>Удалить</Button>
                  </>
                )}
              </div>
            ))}
            {/* Добавить новый шаблон */}
            {editingTemplate === null && (
              <Button size="sm" variant="primary" onClick={() => setEditingTemplate({ credits: 0, price: 0 })}>Добавить шаблон</Button>
            )}
            {editingTemplate && !editingTemplate.id && (
              <div className="flex items-center gap-2 mt-2">
                <input type="number" className="w-24 rounded border px-2 py-1" value={editingTemplate.credits} onChange={e => setEditingTemplate({ ...editingTemplate, credits: Number(e.target.value) })} placeholder="Кредиты" />
                <input type="number" className="w-24 rounded border px-2 py-1" value={editingTemplate.price} onChange={e => setEditingTemplate({ ...editingTemplate, price: Number(e.target.value) })} placeholder="Цена" />
                <Button size="sm" variant="primary" onClick={() => handleSaveTemplate(editingTemplate)}>Сохранить</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)}>Отмена</Button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">История пополнений (последние 50)</h2>
        {historyLoading ? (
          <div>Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Пользователь</th>
                  <th className="p-2 text-left">Кредиты</th>
                  <th className="p-2 text-left">Сумма</th>
                  <th className="p-2 text-left">Статус</th>
                  <th className="p-2 text-left">Дата</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b">
                    <td className="p-2">{h.id}</td>
                    <td className="p-2">{h.user?.name || h.user_id}</td>
                    <td className="p-2">{h.credits}</td>
                    <td className="p-2">{h.amount} ₽</td>
                    <td className="p-2">{h.status}</td>
                    <td className="p-2">{new Date(h.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsAdminPanel; 