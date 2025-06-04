import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";

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
    <div className="space-y-8" data-oid="8l1lu81">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
        data-oid="h-dn3zf"
      >
        <h2 className="text-xl font-bold mb-4" data-oid="92hwea0">
          Настройки ЮKassa
        </h2>
        <form
          className="space-y-4"
          onSubmit={handleSaveSettings}
          data-oid="5jp1kv6"
        >
          <div data-oid="3kn34jz">
            <label
              className="block text-sm font-medium mb-1"
              data-oid="bni_-6m"
            >
              Shop ID
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              required
              data-oid="7n59v.v"
            />
          </div>
          <div data-oid=".15fvw7">
            <label
              className="block text-sm font-medium mb-1"
              data-oid="fs89t96"
            >
              Secret
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              data-oid="x3pi88x"
            />
          </div>
          {settingsError && (
            <div className="text-red-500 text-sm" data-oid="55aug0l">
              {settingsError}
            </div>
          )}
          {settingsSuccess && (
            <div className="text-green-500 text-sm" data-oid="h80xyhe">
              Сохранено!
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={settingsLoading}
            data-oid="d5lbx:e"
          >
            Сохранить
          </Button>
        </form>
      </div>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
        data-oid="u6st7b:"
      >
        <h2 className="text-xl font-bold mb-4" data-oid="baqbzhz">
          Шаблоны пополнения
        </h2>
        {templatesLoading ? (
          <div data-oid="08t54h3">Загрузка...</div>
        ) : (
          <div className="space-y-2" data-oid="bmp9r99">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex items-center gap-2 border-b py-2"
                data-oid="y:8_l-."
              >
                {editingTemplate?.id === tpl.id ? (
                  <>
                    <input
                      type="number"
                      className="w-24 rounded border px-2 py-1"
                      value={editingTemplate.credits}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          credits: Number(e.target.value),
                        })
                      }
                      data-oid="o3y-4v4"
                    />

                    <input
                      type="number"
                      className="w-24 rounded border px-2 py-1"
                      value={editingTemplate.price}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          price: Number(e.target.value),
                        })
                      }
                      data-oid="90x:aio"
                    />

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSaveTemplate(editingTemplate)}
                      data-oid="2iqtif0"
                    >
                      Сохранить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTemplate(null)}
                      data-oid="xbsj8z4"
                    >
                      Отмена
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium w-24" data-oid=".lvizn0">
                      {tpl.credits} кр.
                    </span>
                    <span className="w-24" data-oid="bqw8jai">
                      {tpl.price} ₽
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTemplate(tpl)}
                      data-oid="iue:j-0"
                    >
                      Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      data-oid="fzlcgxj"
                    >
                      Удалить
                    </Button>
                  </>
                )}
              </div>
            ))}
            {/* Добавить новый шаблон */}
            {editingTemplate === null && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setEditingTemplate({ credits: 0, price: 0 })}
                data-oid="nxntmtj"
              >
                Добавить шаблон
              </Button>
            )}
            {editingTemplate && !editingTemplate.id && (
              <div className="flex items-center gap-2 mt-2" data-oid="ztf9hh_">
                <input
                  type="number"
                  className="w-24 rounded border px-2 py-1"
                  value={editingTemplate.credits}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      credits: Number(e.target.value),
                    })
                  }
                  placeholder="Кредиты"
                  data-oid="97p_vfk"
                />

                <input
                  type="number"
                  className="w-24 rounded border px-2 py-1"
                  value={editingTemplate.price}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      price: Number(e.target.value),
                    })
                  }
                  placeholder="Цена"
                  data-oid="g3s:qn:"
                />

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleSaveTemplate(editingTemplate)}
                  data-oid="7poha7i"
                >
                  Сохранить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingTemplate(null)}
                  data-oid="c-qu_s7"
                >
                  Отмена
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
        data-oid="15spm_k"
      >
        <h2 className="text-xl font-bold mb-4" data-oid="zb424-2">
          История пополнений (последние 50)
        </h2>
        {historyLoading ? (
          <div data-oid="s0l4j0d">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto" data-oid="7v4d7re">
            <table className="min-w-full text-sm" data-oid="19wy9ul">
              <thead data-oid="n-qgfoi">
                <tr data-oid="a.ktx-v">
                  <th className="p-2 text-left" data-oid="exm1p9.">
                    ID
                  </th>
                  <th className="p-2 text-left" data-oid="1-usgcx">
                    Пользователь
                  </th>
                  <th className="p-2 text-left" data-oid="5koh496">
                    Кредиты
                  </th>
                  <th className="p-2 text-left" data-oid="dwxzz62">
                    Сумма
                  </th>
                  <th className="p-2 text-left" data-oid="bojf20z">
                    Статус
                  </th>
                  <th className="p-2 text-left" data-oid="8mu2clo">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody data-oid="w9c06g5">
                {history.map((h) => (
                  <tr key={h.id} className="border-b" data-oid="ca3yy-7">
                    <td className="p-2" data-oid="26sd3wt">
                      {h.id}
                    </td>
                    <td className="p-2" data-oid="6i9snwa">
                      {h.user?.name || h.user_id}
                    </td>
                    <td className="p-2" data-oid="w7mc419">
                      {h.credits}
                    </td>
                    <td className="p-2" data-oid="w__oh54">
                      {h.amount} ₽
                    </td>
                    <td className="p-2" data-oid="xpbq5rh">
                      {h.status}
                    </td>
                    <td className="p-2" data-oid="3yb1a1g">
                      {new Date(h.created_at).toLocaleString()}
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
