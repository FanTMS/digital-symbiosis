import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";
import {
  Users,
  BarChart2,
  AlertTriangle,
  Briefcase,
  Search,
  X,
  Eye,
  Shield,
  User,
  Trash2,
  Edit,
  Archive,
  Coins,
  Award,
} from "lucide-react";
import type { Database } from "../types/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import PaymentsAdminPanel from "../components/admin/PaymentsAdminPanel";
import ReferralsAdminPanel from "../components/admin/ReferralsAdminPanel";

const TABS = [
  { key: "stats", label: "Статистика", icon: BarChart2 },
  { key: "users", label: "Пользователи", icon: Users },
  { key: "complaints", label: "Жалобы", icon: AlertTriangle },
  { key: "services", label: "Услуги", icon: Briefcase },
  { key: "archive", label: "Архив", icon: Archive },
  { key: "payments", label: "Платежи", icon: Coins },
  { key: "referrals", label: "Рефералы", icon: Award },
  // Можно добавить "orders", "settings" и т.д.
];

const serviceCategories = [
  { id: "all", label: "Все", emoji: "🔍" },
  { id: "education", label: "Образование", emoji: "🎓" },
  { id: "it", label: "IT", emoji: "💻" },
  { id: "design", label: "Дизайн", emoji: "🎨" },
  { id: "languages", label: "Языки", emoji: "🌐" },
  { id: "business", label: "Бизнес", emoji: "💼" },
  { id: "lifestyle", label: "Лайфстайл", emoji: "🌿" },
  { id: "writing", label: "Копирайтинг", emoji: "✍️" },
  { id: "music", label: "Музыка", emoji: "🎵" },
  { id: "other", label: "Другое", emoji: "🔍" },
];

const AdminDashboardPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [archivedServices, setArchivedServices] = useState<any[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    setLoading(true);
    const fetchStats = async () => {
      const [
        { count: usersCount },
        { count: ordersCount },
        { count: servicesCount },
        { count: complaintsCount },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("services").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }),
      ]);
      setStats({ usersCount, ordersCount, servicesCount, complaintsCount });
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (activeTab === "users" && user?.role === "admin") {
      setLoading(true);
      supabase
        .from("users")
        .select("*")
        .then(({ data }) => {
          setUsers(data || []);
          setFilteredUsers(data || []);
          setLoading(false);
        });
    }
    if (activeTab === "complaints" && user?.role === "admin") {
      setLoading(true);
      supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setComplaints(data || []);
          setLoading(false);
        });
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "users") {
      const q = search.trim().toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q) ||
            String(u.id).includes(q),
        ),
      );
    }
  }, [search, users, activeTab]);

  useEffect(() => {
    if (activeTab === "services" && user?.role === "admin") {
      setServiceLoading(true);
      supabase
        .from("services")
        .select("*, user:users(*)")
        .eq("is_active", true)
        .then(({ data }) => {
          setServices(data || []);
          setFilteredServices(data || []);
          setServiceLoading(false);
        });
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "services") {
      let filtered = services;
      if (selectedCategory !== "all") {
        filtered = filtered.filter((s) => s.category === selectedCategory);
      }
      if (serviceSearch.trim()) {
        const q = serviceSearch.trim().toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.title?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            (s.skills?.some((sk: string) => sk.toLowerCase().includes(q)) ??
              false),
        );
      }
      setFilteredServices(filtered);
    }
  }, [serviceSearch, selectedCategory, services, activeTab]);

  useEffect(() => {
    if (activeTab === "archive" && user?.role === "admin") {
      setArchivedLoading(true);
      supabase
        .from("services")
        .select("*, user:users(*)")
        .eq("is_active", false)
        .then(({ data }) => {
          setArchivedServices(data || []);
          setArchivedLoading(false);
        });
    }
  }, [activeTab, user]);

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Удалить услугу?")) return;
    setServiceLoading(true);
    await supabase.from("services").update({ is_active: false }).eq("id", id);
    setServices(services.filter((s) => s.id !== id));
    setFilteredServices(filteredServices.filter((s) => s.id !== id));
    setShowServiceModal(false);
    setServiceLoading(false);
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="p-6 text-center text-red-500" data-oid=".:ixzsr">
        Доступ запрещён
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 max-w-6xl mx-auto" data-oid="fyqm13v">
      {/* Шапка */}
      <div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
        data-oid="x_:osms"
      >
        <h1
          className="text-3xl font-bold flex items-center gap-2"
          data-oid="wxf8opt"
        >
          <Shield className="text-primary-500" data-oid="ljf9wan" />{" "}
          Админ-панель
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          data-oid="3.hvg2l"
        >
          Назад
        </Button>
      </div>
      {/* Вкладки */}
      <div
        className="flex gap-2 md:gap-4 mb-8 overflow-x-auto"
        data-oid=".kcjmg1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium whitespace-nowrap ${activeTab === tab.key ? "bg-primary-500 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-primary-100"}`}
            onClick={() => setActiveTab(tab.key)}
            data-oid="2c26-1u"
          >
            <tab.icon size={20} data-oid="r33f_j2" /> {tab.label}
          </button>
        ))}
      </div>
      {/* Контент вкладок с анимацией */}
      <AnimatePresence mode="wait" initial={false} data-oid="hppymvq">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, type: "tween" }}
          data-oid="l78mqns"
        >
          {activeTab === "stats" && (
            <div data-oid="7jihp5c">
              <h2 className="text-xl font-semibold mb-4" data-oid="pxhfi8r">
                Общая статистика
              </h2>
              {loading || !stats ? (
                <div data-oid="ziznhpb">Загрузка...</div>
              ) : (
                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
                  data-oid="uxf-5ip"
                >
                  <div
                    className="bg-white rounded-xl shadow p-6 text-center flex flex-col items-center"
                    data-oid="1kc8loz"
                  >
                    <Users
                      className="text-primary-500 mb-2"
                      size={32}
                      data-oid="dd4gnsp"
                    />

                    <div className="text-2xl font-bold" data-oid="q0ru1.7">
                      {stats.usersCount}
                    </div>
                    <div className="text-gray-500" data-oid="kh9gsg4">
                      Пользователей
                    </div>
                  </div>
                  <div
                    className="bg-white rounded-xl shadow p-6 text-center flex flex-col items-center"
                    data-oid="1dggjhy"
                  >
                    <Briefcase
                      className="text-accent-500 mb-2"
                      size={32}
                      data-oid="jrenk_6"
                    />

                    <div className="text-2xl font-bold" data-oid="gh-9i6b">
                      {stats.servicesCount}
                    </div>
                    <div className="text-gray-500" data-oid="jq93cqa">
                      Услуг
                    </div>
                  </div>
                  <div
                    className="bg-white rounded-xl shadow p-6 text-center flex flex-col items-center"
                    data-oid="kk2yulg"
                  >
                    <BarChart2
                      className="text-green-500 mb-2"
                      size={32}
                      data-oid="yc94vkv"
                    />

                    <div className="text-2xl font-bold" data-oid="2b_ko.1">
                      {stats.ordersCount}
                    </div>
                    <div className="text-gray-500" data-oid="3.fdxdk">
                      Заказов
                    </div>
                  </div>
                  <div
                    className="bg-white rounded-xl shadow p-6 text-center flex flex-col items-center"
                    data-oid="3ky.jay"
                  >
                    <AlertTriangle
                      className="text-red-500 mb-2"
                      size={32}
                      data-oid="iya1mq5"
                    />

                    <div className="text-2xl font-bold" data-oid=".s44yl:">
                      {stats.complaintsCount}
                    </div>
                    <div className="text-gray-500" data-oid="b_u4s:8">
                      Жалоб
                    </div>
                  </div>
                </div>
              )}
              {/* Заготовка для графика */}
              <div
                className="bg-white rounded-xl shadow p-6 mt-4 min-h-[220px] flex items-center justify-center text-gray-400"
                data-oid="fwaxplm"
              >
                {/* Здесь будет график (например, Chart.js/ApexCharts) */}
                <span data-oid="5f:q-j7">
                  График активности пользователей (скоро)
                </span>
              </div>
            </div>
          )}
          {activeTab === "users" && (
            <div data-oid="3eh3uhv">
              <div
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
                data-oid="erydzr-"
              >
                <h2 className="text-xl font-semibold" data-oid="1ypb4.t">
                  Пользователи
                </h2>
                <div className="relative w-full md:w-72" data-oid="s57f0:o">
                  <input
                    type="text"
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Поиск по имени, username или ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-oid="3g13587"
                  />

                  <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                    data-oid="hp:pmhx"
                  />

                  {search && (
                    <button
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500"
                      onClick={() => setSearch("")}
                      data-oid="6hkm1yq"
                    >
                      <X size={18} data-oid="shlg7r7" />
                    </button>
                  )}
                </div>
              </div>
              {loading ? (
                <div data-oid="xp__9ee">Загрузка...</div>
              ) : (
                <div
                  className="overflow-x-auto rounded-xl shadow"
                  data-oid="ey5ejtl"
                >
                  <table className="min-w-full bg-white" data-oid="_xesfaw">
                    <thead data-oid="k-pgk5d">
                      <tr data-oid="ow:c_8c">
                        <th className="p-2 text-left" data-oid="x-a1:qj">
                          ID
                        </th>
                        <th className="p-2 text-left" data-oid="1s.mccv">
                          Имя
                        </th>
                        <th className="p-2 text-left" data-oid="wnzlvck">
                          Username
                        </th>
                        <th className="p-2 text-left" data-oid="f4yjb-q">
                          Роль
                        </th>
                        <th className="p-2 text-left" data-oid="jx9ycs4">
                          Уровень
                        </th>
                        <th className="p-2 text-left" data-oid="7fj149o">
                          Статус
                        </th>
                        <th className="p-2 text-left" data-oid="0uw5nj9">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody data-oid="x33kkus">
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b hover:bg-primary-50/30 transition"
                          data-oid="f2xuwub"
                        >
                          <td className="p-2" data-oid="rnc-d:9">
                            {u.id}
                          </td>
                          <td className="p-2" data-oid="vj2uuv9">
                            {u.name}
                          </td>
                          <td className="p-2" data-oid="i2ka41-">
                            {u.username}
                          </td>
                          <td className="p-2" data-oid="mdtfidf">
                            {u.role || "user"}
                          </td>
                          <td className="p-2" data-oid="928dfaq">
                            {u.level || "-"}
                          </td>
                          <td className="p-2" data-oid="h2.8m:y">
                            {u.blocked ? "Заблокирован" : "Активен"}
                          </td>
                          <td className="p-2" data-oid="7tle11_">
                            <button
                              className="text-primary-500 hover:underline flex items-center gap-1"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowUserModal(true);
                              }}
                              data-oid="s9w9nmc"
                            >
                              <Eye size={16} data-oid="a1ln.56" /> Просмотр
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Модалка пользователя */}
              {showUserModal && selectedUser && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  data-oid="ez62mb9"
                >
                  <div
                    className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative"
                    data-oid="p09hdra"
                  >
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
                      onClick={() => setShowUserModal(false)}
                      aria-label="Закрыть"
                      data-oid="f:-iohu"
                    >
                      ×
                    </button>
                    <h3
                      className="text-xl font-bold mb-2 flex items-center gap-2"
                      data-oid="8_qz:4p"
                    >
                      <User size={20} data-oid="zzltdg8" />
                      Профиль пользователя
                    </h3>
                    <div className="mb-2" data-oid="i4:rybb">
                      <b data-oid="qtuwgw_">ID:</b> {selectedUser.id}
                    </div>
                    <div className="mb-2" data-oid="c9ee86:">
                      <b data-oid="v_dwqlu">Имя:</b> {selectedUser.name}
                    </div>
                    <div className="mb-2" data-oid="p6rtoy_">
                      <b data-oid="d97.zw4">Username:</b>{" "}
                      {selectedUser.username}
                    </div>
                    <div className="mb-2" data-oid="-0d87ok">
                      <b data-oid="uphmcor">Роль:</b>{" "}
                      {selectedUser.role || "user"}
                    </div>
                    <div className="mb-2" data-oid="2cb1dvq">
                      <b data-oid="9pdppq8">Статус:</b>{" "}
                      {selectedUser.blocked ? "Заблокирован" : "Активен"}
                    </div>
                    {/* Форма для редактирования баланса, уровня и кредитов */}
                    <form
                      className="space-y-3 mt-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as typeof e.target & {
                          credits: { value: string };
                          level: { value: string };
                          completed_tasks: { value: string };
                        };
                        const updates = {
                          credits: Number(form.credits.value),
                          level: form.level.value,
                          completed_tasks: Number(form.completed_tasks.value),
                        };
                        await supabase
                          .from("users")
                          .update(updates)
                          .eq("id", selectedUser.id);
                        // Обновить данные в таблице пользователей
                        setUsers(
                          users.map((u) =>
                            u.id === selectedUser.id ? { ...u, ...updates } : u,
                          ),
                        );
                        setFilteredUsers(
                          filteredUsers.map((u) =>
                            u.id === selectedUser.id ? { ...u, ...updates } : u,
                          ),
                        );
                        setShowUserModal(false);
                      }}
                      data-oid="w49mpsa"
                    >
                      <div data-oid="6fpffzf">
                        <label
                          className="block text-sm font-medium mb-1"
                          data-oid="_.n8qof"
                        >
                          Кредиты
                        </label>
                        <input
                          name="credits"
                          type="number"
                          defaultValue={selectedUser.credits ?? 0}
                          className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50"
                          data-oid="2xkexuw"
                        />
                      </div>
                      <div data-oid="gu2ork4">
                        <label
                          className="block text-sm font-medium mb-1"
                          data-oid="9qs-zik"
                        >
                          Уровень
                        </label>
                        <input
                          name="level"
                          type="text"
                          defaultValue={selectedUser.level ?? ""}
                          className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50"
                          data-oid="f7fvcot"
                        />
                      </div>
                      <div data-oid="an4ps7q">
                        <label
                          className="block text-sm font-medium mb-1"
                          data-oid="j7ee3cy"
                        >
                          Выполнено заданий
                        </label>
                        <input
                          name="completed_tasks"
                          type="number"
                          defaultValue={selectedUser.completed_tasks ?? 0}
                          className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50"
                          data-oid="-emyoiu"
                        />
                      </div>
                      <div className="flex gap-2 mt-4" data-oid="8qujt30">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => setShowUserModal(false)}
                          data-oid="t.6p1tm"
                        >
                          Закрыть
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          type="submit"
                          data-oid="elgtibz"
                        >
                          Сохранить
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "complaints" && (
            <div data-oid="qn_7w:7">
              <h2 className="text-xl font-semibold mb-4" data-oid="du3n9:4">
                Жалобы
              </h2>
              {loading ? (
                <div data-oid="3r6gtbe">Загрузка...</div>
              ) : complaints.length === 0 ? (
                <div className="text-gray-500" data-oid="secqn-d">
                  Жалоб нет
                </div>
              ) : (
                <div className="space-y-4" data-oid="w7qx_ho">
                  {complaints.map((c) => (
                    <div
                      key={c.id}
                      className="border rounded-lg p-4 bg-white shadow"
                      data-oid="s1h:_vc"
                    >
                      <div
                        className="mb-2 text-sm text-gray-500"
                        data-oid="dq8r_vz"
                      >
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                      <div className="mb-2" data-oid="7pr16fp">
                        <span className="font-semibold" data-oid="1e6n_bu">
                          От:
                        </span>{" "}
                        {c.from_user_id}{" "}
                        <span className="ml-2 font-semibold" data-oid="fm76:y5">
                          На:
                        </span>{" "}
                        {c.to_user_id}
                      </div>
                      <div className="mb-2" data-oid="p1dnqpe">
                        <span className="font-semibold" data-oid="q8yc:p7">
                          Чат:
                        </span>{" "}
                        {c.chat_id}
                      </div>
                      <div className="mb-2" data-oid="1sk:.aa">
                        <span className="font-semibold" data-oid="v7fm::5">
                          Текст жалобы:
                        </span>
                      </div>
                      <div
                        className="bg-gray-100 rounded p-2 text-sm"
                        data-oid="1.r_q8f"
                      >
                        {c.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "services" && (
            <div data-oid="_uoj_d:">
              <div
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
                data-oid="7s.sley"
              >
                <h2 className="text-xl font-semibold" data-oid="tn2qea6">
                  Услуги
                </h2>
                <div className="flex gap-2 w-full md:w-auto" data-oid="n1h:4jp">
                  <div className="relative w-full md:w-72" data-oid="-r69_gk">
                    <input
                      type="text"
                      className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Поиск по названию, описанию, навыкам..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      data-oid="h1:2m3r"
                    />

                    <Search
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                      data-oid="gzwhm2a"
                    />

                    {serviceSearch && (
                      <button
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500"
                        onClick={() => setServiceSearch("")}
                        data-oid=":sr1yrs"
                      >
                        <X size={18} data-oid="wvnhi5v" />
                      </button>
                    )}
                  </div>
                  <select
                    className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    data-oid="-dk4kp."
                  >
                    {serviceCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} data-oid=".hsq8_y">
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {serviceLoading ? (
                <div data-oid="pi4t06g">Загрузка...</div>
              ) : filteredServices.length === 0 ? (
                <div
                  className="text-gray-400 text-center py-12"
                  data-oid="eo6qral"
                >
                  Нет услуг
                </div>
              ) : (
                <div
                  className="overflow-x-auto rounded-xl shadow"
                  data-oid="9avu4cx"
                >
                  <table className="min-w-full bg-white" data-oid="4e6d515">
                    <thead data-oid="-f81l7k">
                      <tr data-oid="kdvaoej">
                        <th className="p-2 text-left" data-oid="wf075po">
                          ID
                        </th>
                        <th className="p-2 text-left" data-oid="kscr33-">
                          Название
                        </th>
                        <th className="p-2 text-left" data-oid="pk7zoxu">
                          Категория
                        </th>
                        <th className="p-2 text-left" data-oid="wj9ebwb">
                          Цена
                        </th>
                        <th className="p-2 text-left" data-oid="_6:4ik6">
                          Владелец
                        </th>
                        <th className="p-2 text-left" data-oid="5ctsu_k">
                          Рейтинг
                        </th>
                        <th className="p-2 text-left" data-oid="rlnmcyi">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody data-oid="xo0-6lv">
                      {filteredServices.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b hover:bg-primary-50/30 transition"
                          data-oid="j:t2c30"
                        >
                          <td className="p-2" data-oid="1r8j2bd">
                            {s.id}
                          </td>
                          <td className="p-2" data-oid="fge3nd6">
                            {s.title}
                          </td>
                          <td className="p-2" data-oid="-pas38a">
                            {serviceCategories.find((c) => c.id === s.category)
                              ?.label || s.category}
                          </td>
                          <td className="p-2" data-oid=".umj7rd">
                            {s.price} кр.
                          </td>
                          <td className="p-2" data-oid="wvwe9mm">
                            {s.user?.name || s.user_id}
                          </td>
                          <td className="p-2" data-oid="5w--sbf">
                            {s.rating?.toFixed(1) ?? "-"}
                          </td>
                          <td className="p-2 flex gap-2" data-oid="_so82yj">
                            <button
                              className="text-primary-500 hover:underline flex items-center gap-1"
                              onClick={() => {
                                setSelectedService(s);
                                setShowServiceModal(true);
                              }}
                              data-oid="2a0k6vo"
                            >
                              <Eye size={16} data-oid="9xvferi" />
                              Просмотр
                            </button>
                            <button
                              className="text-red-500 hover:underline flex items-center gap-1"
                              onClick={() => handleDeleteService(s.id)}
                              data-oid="l.xw-un"
                            >
                              <Trash2 size={16} data-oid="q2r0-of" />
                              Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Модалка услуги */}
              {showServiceModal && selectedService && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  data-oid="gxc6q_v"
                >
                  <div
                    className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative"
                    data-oid="6l.:nx."
                  >
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
                      onClick={() => setShowServiceModal(false)}
                      aria-label="Закрыть"
                      data-oid="by3cdog"
                    >
                      ×
                    </button>
                    <h3
                      className="text-xl font-bold mb-2 flex items-center gap-2"
                      data-oid="f07k3jv"
                    >
                      <Briefcase size={20} data-oid="sri:2eb" />
                      Услуга
                    </h3>
                    <div className="mb-2" data-oid="x.vihbe">
                      <b data-oid="0k79vd4">ID:</b> {selectedService.id}
                    </div>
                    <div className="mb-2" data-oid="856kl:0">
                      <b data-oid="trtnvsp">Название:</b>{" "}
                      {selectedService.title}
                    </div>
                    <div className="mb-2" data-oid="6w8_2lu">
                      <b data-oid="8r_i.r7">Описание:</b>{" "}
                      {selectedService.description}
                    </div>
                    <div className="mb-2" data-oid=".2pzoi9">
                      <b data-oid="-vba8.-">Категория:</b>{" "}
                      {serviceCategories.find(
                        (c) => c.id === selectedService.category,
                      )?.label || selectedService.category}
                    </div>
                    <div className="mb-2" data-oid="yu9lv1i">
                      <b data-oid="qe:p9.b">Цена:</b> {selectedService.price}{" "}
                      кр.
                    </div>
                    <div className="mb-2" data-oid="o_kx-yl">
                      <b data-oid="p85fwsv">Владелец:</b>{" "}
                      {selectedService.user?.name || selectedService.user_id}
                    </div>
                    <div className="mb-2" data-oid="mlgk6.f">
                      <b data-oid="eustidu">Навыки:</b>{" "}
                      {(selectedService.skills || []).join(", ")}
                    </div>
                    <div className="mb-2" data-oid="pn0a5ed">
                      <b data-oid="jm:_p.r">Рейтинг:</b>{" "}
                      {selectedService.rating?.toFixed(1) ?? "-"}
                    </div>
                    <div className="mb-2" data-oid="-521td1">
                      <b data-oid="3dlq2bf">Создана:</b>{" "}
                      {new Date(selectedService.created_at).toLocaleString()}
                    </div>
                    <div className="mb-2" data-oid="flj8y:o">
                      <b data-oid=":g9jiz.">Обновлена:</b>{" "}
                      {new Date(selectedService.updated_at).toLocaleString()}
                    </div>
                    <div className="mt-4 flex gap-2" data-oid="aet7_0h">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowServiceModal(false)}
                        data-oid="2wvuh9d"
                      >
                        Закрыть
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteService(selectedService.id)}
                        data-oid="t5pqn41"
                      >
                        <Trash2 size={16} data-oid="jaw6yjf" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "archive" && (
            <div data-oid="wi5u229">
              <h2 className="text-xl font-semibold mb-4" data-oid="dk6wj7x">
                Архив услуг
              </h2>
              {archivedLoading ? (
                <div data-oid=".8:ngkt">Загрузка...</div>
              ) : archivedServices.length === 0 ? (
                <div
                  className="text-gray-400 text-center py-12"
                  data-oid="dfu3wr1"
                >
                  Архив пуст
                </div>
              ) : (
                <div
                  className="overflow-x-auto rounded-xl shadow"
                  data-oid="xdat:kl"
                >
                  <table className="min-w-full bg-white" data-oid="lb-8i1u">
                    <thead data-oid="-1ro4nj">
                      <tr data-oid=".vwwify">
                        <th className="p-2 text-left" data-oid="gjxqnt9">
                          ID
                        </th>
                        <th className="p-2 text-left" data-oid="32.826_">
                          Название
                        </th>
                        <th className="p-2 text-left" data-oid="w8bodb2">
                          Категория
                        </th>
                        <th className="p-2 text-left" data-oid="p_.u4io">
                          Цена
                        </th>
                        <th className="p-2 text-left" data-oid="p0fmaog">
                          Владелец
                        </th>
                        <th className="p-2 text-left" data-oid="w3yqr91">
                          Рейтинг
                        </th>
                        <th className="p-2 text-left" data-oid="h_5hrqn">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody data-oid="wxg_ipo">
                      {archivedServices.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b hover:bg-primary-50/30 transition"
                          data-oid="49yuo1x"
                        >
                          <td className="p-2" data-oid="_7hjmn3">
                            {s.id}
                          </td>
                          <td className="p-2" data-oid="zr3j-mc">
                            {s.title}
                          </td>
                          <td className="p-2" data-oid="nk-20-f">
                            {serviceCategories.find((c) => c.id === s.category)
                              ?.label || s.category}
                          </td>
                          <td className="p-2" data-oid="zc3u7qc">
                            {s.price} кр.
                          </td>
                          <td className="p-2" data-oid="pduw3kq">
                            {s.user?.name || s.user_id}
                          </td>
                          <td className="p-2" data-oid="ezlre51">
                            {s.rating?.toFixed(1) ?? "-"}
                          </td>
                          <td className="p-2 flex gap-2" data-oid="euk4dd7">
                            <button
                              className="text-green-500 hover:underline flex items-center gap-1"
                              onClick={async () => {
                                await supabase
                                  .from("services")
                                  .update({ is_active: true })
                                  .eq("id", s.id);
                                setArchivedServices(
                                  archivedServices.filter((a) => a.id !== s.id),
                                );
                                queryClient.invalidateQueries({
                                  queryKey: ["services"],
                                });
                              }}
                              data-oid="hg45x1l"
                            >
                              Восстановить
                            </button>
                            <button
                              className="text-red-500 hover:underline flex items-center gap-1"
                              onClick={async () => {
                                if (!window.confirm("Удалить навсегда?"))
                                  return;
                                const { error } = await supabase
                                  .from("services")
                                  .delete()
                                  .eq("id", s.id);
                                if (error && error.code === "409") {
                                  alert(
                                    "Нельзя удалить услугу, пока есть связанные заказы или отзывы.",
                                  );
                                } else if (!error) {
                                  setArchivedServices(
                                    archivedServices.filter(
                                      (a) => a.id !== s.id,
                                    ),
                                  );
                                }
                              }}
                              data-oid="8.lwftx"
                            >
                              Удалить навсегда
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === "payments" && (
            <PaymentsAdminPanel data-oid="bob1-ck" />
          )}
          {activeTab === "referrals" && (
            <ReferralsAdminPanel data-oid="0ohzlfg" />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardPage;
