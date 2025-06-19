import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";
import { Plus, Edit3, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PaymentsAdminPanel: React.FC = () => {
  // YooKassa settings
  const [shopId, setShopId] = useState("");
  const [secret, setSecret] = useState("");
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
      const { data, error } = await supabase
        .from("yookassa_settings")
        .select("*")
        .single();
      if (error) setSettingsError(error.message);
      if (data) {
        setShopId(data.shop_id || "");
        setSecret(data.secret || "");
      }
      setSettingsLoading(false);
    })();
  }, []);

  // Получить шаблоны пополнения
  useEffect(() => {
    (async () => {
      setTemplatesLoading(true);
      const { data, error } = await supabase
        .from("topup_templates")
        .select("*")
        .order("credits");
      if (error) setTemplatesError(error.message);
      if (data) setTemplates(data);
      setTemplatesLoading(false);
    })();
  }, []);

  // Получить историю пополнений
  useEffect(() => {
    (async () => {
      setHistoryLoading(true);
      const { data } = await supabase
        .from("topup_history")
        .select("*, user:users(*)")
        .order("created_at", { ascending: false })
        .limit(50);
      setHistory(data || []);
      setHistoryLoading(false);
    })();
  }, []);

  // Сохранить настройки ЮKassa
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(false);
    const { error } = await supabase
      .from("yookassa_settings")
      .upsert({ id: 1, shop_id: shopId, secret });
    if (error) setSettingsError(error.message);
    else setSettingsSuccess(true);
  };

  // Сохранить шаблон
  const handleSaveTemplate = async (tpl: any) => {
    if (!tpl.credits || !tpl.price) return;
    await supabase.from("topup_templates").upsert(tpl);
    setEditingTemplate(null);
    // Обновить список
    const { data } = await supabase
      .from("topup_templates")
      .select("*")
      .order("credits");
    setTemplates(data || []);
  };

  // Удалить шаблон
  const handleDeleteTemplate = async (id: number) => {
    await supabase.from("topup_templates").delete().eq("id", id);
    const { data } = await supabase
      .from("topup_templates")
      .select("*")
      .order("credits");
    setTemplates(data || []);
  };

  return (
    <div className="space-y-8">
      {/* Настройки YooKassa */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">YooKassa <span className="text-base font-normal text-gray-400">(оплаты)</span></h2>
        <form className="space-y-4" onSubmit={handleSaveSettings}>
          <div>
            <label className="block text-base font-semibold mb-1">Shop ID</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 px-4 py-2 bg-gray-50 text-base"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-base font-semibold mb-1">Secret</label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 px-4 py-2 bg-gray-50 text-base"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
            />
          </div>
          {settingsError && (
            <div className="text-red-500 text-sm">{settingsError}</div>
          )}
          {settingsSuccess && (
            <div className="text-green-500 text-sm">Сохранено!</div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto mt-2"
            disabled={settingsLoading}
          >
            {settingsLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} Сохранить
          </Button>
        </form>
      </div>
      {/* Шаблоны пополнения */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Шаблоны пополнения</h2>
        {templatesLoading ? (
          <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>
        ) : (
          <div className="space-y-2">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex flex-col sm:flex-row items-center gap-2 border-b py-2"
              >
                {editingTemplate?.id === tpl.id ? (
                  <>
                    <input
                      type="number"
                      className="w-24 rounded-xl border px-3 py-2 text-base"
                      value={editingTemplate.credits}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, credits: Number(e.target.value) })}
                    />
                    <input
                      type="number"
                      className="w-24 rounded-xl border px-3 py-2 text-base"
                      value={editingTemplate.price}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, price: Number(e.target.value) })}
                    />
                    <Button size="sm" variant="primary" className="flex items-center gap-1" onClick={() => handleSaveTemplate(editingTemplate)}>
                      <CheckCircle size={16} /> Сохранить
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => setEditingTemplate(null)}>
                      <XCircle size={16} /> Отмена
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium w-24">{tpl.credits} кр.</span>
                    <span className="w-24">{tpl.price} ₽</span>
                    <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => setEditingTemplate(tpl)}>
                      <Edit3 size={16} /> Изменить
                    </Button>
                    <Button size="sm" variant="danger" className="flex items-center gap-1" onClick={() => handleDeleteTemplate(tpl.id)}>
                      <Trash2 size={16} /> Удалить
                    </Button>
                  </>
                )}
              </div>
            ))}
            {/* Добавить новый шаблон */}
            {editingTemplate === null && (
              <Button size="sm" variant="primary" className="flex items-center gap-1 mt-2" onClick={() => setEditingTemplate({ credits: 0, price: 0 })}>
                <Plus size={16} /> Добавить шаблон
              </Button>
            )}
            {editingTemplate && !editingTemplate.id && (
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                <input
                  type="number"
                  className="w-24 rounded-xl border px-3 py-2 text-base"
                  value={editingTemplate.credits}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, credits: Number(e.target.value) })}
                  placeholder="Кредиты"
                />
                <input
                  type="number"
                  className="w-24 rounded-xl border px-3 py-2 text-base"
                  value={editingTemplate.price}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, price: Number(e.target.value) })}
                  placeholder="Цена"
                />
                <Button size="sm" variant="primary" className="flex items-center gap-1" onClick={() => handleSaveTemplate(editingTemplate)}>
                  <CheckCircle size={16} /> Сохранить
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => setEditingTemplate(null)}>
                  <XCircle size={16} /> Отмена
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* История пополнений */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">История пополнений</h2>
        {historyLoading ? (
          <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-sm">
            <table className="min-w-full text-base border">
              <thead>
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Пользователь</th>
                  <th className="p-2 text-left">Сумма</th>
                  <th className="p-2 text-left">Кредиты</th>
                  <th className="p-2 text-left">Дата</th>
                  <th className="p-2 text-left">Статус</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b hover:bg-primary-50/30 transition">
                    <td className="p-2">{h.id}</td>
                    <td className="p-2">{h.user?.name || h.user_id}</td>
                    <td className="p-2">{h.amount} ₽</td>
                    <td className="p-2">{h.credits} кр.</td>
                    <td className="p-2">{new Date(h.created_at).toLocaleString()}</td>
                    <td className="p-2">
                      {h.status === 'success' ? (
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Успешно</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1"><XCircle size={16} /> Ошибка</span>
                      )}
                    </td>
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
