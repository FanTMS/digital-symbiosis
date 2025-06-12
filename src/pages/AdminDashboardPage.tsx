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
    return <div className="p-6 text-center text-red-500">Доступ запрещён</div>;
  }

  return (
    <div className="p-2 md:p-6 max-w-6xl mx-auto">
      {/* Шапка */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="text-primary-500" /> Админ-панель
        </h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Назад
        </Button>
      </div>
      {/* Вкладки */}
      <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium whitespace-nowrap ${activeTab === tab.key ? "bg-primary-500 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-primary-100"}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon size={20} /> {tab.label}
          </button>
        ))}
      </div>
      {/* Контент вкладок с анимацией */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, type: "tween" }}
        >
          {activeTab === "stats" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Общая статистика</h2>
              {loading || !stats ? (
                <div>Загрузка...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow p-6 text-center flex flex-col items-center">
                    <Users className="text-primary-500 mb-2" size={32} />

                    <div className="text-2xl font-bold">{stats.usersCount}</div>
                    <div className="text-gray-500">Пользователей</div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6 text-center flex flex-col items-center">
                    <Briefcase className="text-accent-500 mb-2" size={32} />

                    <div className="text-2xl font-bold">
                      {stats.servicesCount}
                    </div>
                    <div className="text-gray-500">Услуг</div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6 text-center flex flex-col items-center">
                    <BarChart2 className="text-green-500 mb-2" size={32} />

                    <div className="text-2xl font-bold">
                      {stats.ordersCount}
                    </div>
                    <div className="text-gray-500">Заказов</div>
                  </div>
                  <div className="bg-white rounded-xl shadow p-6 text-center flex flex-col items-center">
                    <AlertTriangle className="text-red-500 mb-2" size={32} />

                    <div className="text-2xl font-bold">
                      {stats.complaintsCount}
                    </div>
                    <div className="text-gray-500">Жалоб</div>
                  </div>
                </div>
              )}
              {/* Заготовка для графика */}
              <div className="bg-white rounded-xl shadow p-6 mt-4 min-h-[220px] flex items-center justify-center text-gray-400">
                {/* Здесь будет график (например, Chart.js/ApexCharts) */}
                <span>График активности пользователей (скоро)</span>
              </div>
            </div>
          )}
          {activeTab === "users" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold">Пользователи</h2>
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Поиск по имени, username или ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />

                  {search && (
                    <button
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500"
                      onClick={() => setSearch("")}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
              {loading ? (
                <div>Загрузка...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl shadow">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Имя</th>
                        <th className="p-2 text-left">Username</th>
                        <th className="p-2 text-left">Роль</th>
                        <th className="p-2 text-left">Уровень</th>
                        <th className="p-2 text-left">Статус</th>
                        <th className="p-2 text-left">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b hover:bg-primary-50/30 transition"
                        >
                          <td className="p-2">{u.id}</td>
                          <td className="p-2">{u.name}</td>
                          <td className="p-2">{u.username}</td>
                          <td className="p-2">{u.role || "user"}</td>
                          <td className="p-2">{u.level || "-"}</td>
                          <td className="p-2">
                            {u.blocked ? "Заблокирован" : "Активен"}
                          </td>
                          <td className="p-2">
                            <button
                              className="text-primary-500 hover:underline flex items-center gap-1"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowUserModal(true);
                              }}
                            >
                              <Eye size={16} /> Просмотр
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
                      onClick={() => setShowUserModal(false)}
                      aria-label="Закрыть"
                    >
                      ×
                    </button>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <User size={20} />
                      Профиль пользователя
                    </h3>
                    <div className="mb-2">
                      <b>ID:</b> {selectedUser.id}
                    </div>
                    <div className="mb-2">
                      <b>Имя:</b> {selectedUser.name}
                    </div>
                    <div className="mb-2">
                      <b>Username:</b> {selectedUser.username}
                    </div>
                    <div className="mb-2">
                      <b>Роль:</b> {selectedUser.role || "user"}
                    </div>
                    <div className="mb-2">
                      <b>Статус:</b> {selectedUser.blocked ? "Заблокирован" : "Активен"}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant={selectedUser.blocked ? "primary" : "danger"}
                        onClick={async () => {
                          await supabase
                            .from("users")
                            .update({ blocked: !selectedUser.blocked })
                            .eq("id", selectedUser.id);
                          setSelectedUser({ ...selectedUser, blocked: !selectedUser.blocked });
                          setUsers(users.map((u) => u.id === selectedUser.id ? { ...u, blocked: !selectedUser.blocked } : u));
                          setFilteredUsers(filteredUsers.map((u) => u.id === selectedUser.id ? { ...u, blocked: !selectedUser.blocked } : u));
                        }}
                      >
                        {selectedUser.blocked ? "Разблокировать" : "Заблокировать"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowUserModal(false)}>
                        Закрыть
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "complaints" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Жалобы</h2>
              {loading ? (
                <div>Загрузка...</div>
              ) : complaints.length === 0 ? (
                <div className="text-gray-500">Жалоб нет</div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((c) => (
                    <div
                      key={c.id}
                      className="border rounded-lg p-4 bg-white shadow"
                    >
                      <div className="mb-2 text-sm text-gray-500">
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">От:</span> {c.from_user_id} <span className="ml-2 font-semibold">На:</span> {c.to_user_id}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Чат:</span> {c.chat_id}
                        <Button size="sm" variant="outline" className="ml-2" onClick={() => navigate(`/chat/${c.chat_id}`)}>
                          Открыть чат
                        </Button>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Текст жалобы:</span>
                      </div>
                      <div className="bg-gray-100 rounded p-2 text-sm mb-2">
                        {c.message}
                      </div>
                      <Button size="sm" variant="danger" onClick={() => {
                        setSelectedUser({ id: c.to_user_id });
                        setShowUserModal(true);
                      }}>
                        Действия с пользователем
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "services" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold">Услуги</h2>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-72">
                    <input
                      type="text"
                      className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Поиск по названию, описанию, навыкам..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                    />

                    <Search
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />

                    {serviceSearch && (
                      <button
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500"
                        onClick={() => setServiceSearch("")}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <select
                    className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {serviceCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {serviceLoading ? (
                <div>Загрузка...</div>
              ) : filteredServices.length === 0 ? (
                <div className="text-gray-400 text-center py-12">Нет услуг</div>
              ) : (
                <div className="overflow-x-auto rounded-xl shadow">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Название</th>
                        <th className="p-2 text-left">Категория</th>
                        <th className="p-2 text-left">Цена</th>
                        <th className="p-2 text-left">Владелец</th>
                        <th className="p-2 text-left">Рейтинг</th>
                        <th className="p-2 text-left">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServices.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b hover:bg-primary-50/30 transition"
                        >
                          <td className="p-2">{s.id}</td>
                          <td className="p-2">{s.title}</td>
                          <td className="p-2">
                            {serviceCategories.find((c) => c.id === s.category)
                              ?.label || s.category}
                          </td>
                          <td className="p-2">{s.price} кр.</td>
                          <td className="p-2">{s.user?.name || s.user_id}</td>
                          <td className="p-2">{s.rating?.toFixed(1) ?? "-"}</td>
                          <td className="p-2 flex gap-2">
                            <button
                              className="text-primary-500 hover:underline flex items-center gap-1"
                              onClick={() => {
                                setSelectedService(s);
                                setShowServiceModal(true);
                              }}
                            >
                              <Eye size={16} />
                              Просмотр
                            </button>
                            <button
                              className="text-red-500 hover:underline flex items-center gap-1"
                              onClick={() => handleDeleteService(s.id)}
                            >
                              <Trash2 size={16} />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
                      onClick={() => setShowServiceModal(false)}
                      aria-label="Закрыть"
                    >
                      ×
                    </button>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <Briefcase size={20} />
                      Услуга
                    </h3>
                    <div className="mb-2">
                      <b>ID:</b> {selectedService.id}
                    </div>
                    <div className="mb-2">
                      <b>Название:</b> {selectedService.title}
                    </div>
                    <div className="mb-2">
                      <b>Описание:</b> {selectedService.description}
                    </div>
                    <div className="mb-2">
                      <b>Категория:</b>{" "}
                      {serviceCategories.find(
                        (c) => c.id === selectedService.category,
                      )?.label || selectedService.category}
                    </div>
                    <div className="mb-2">
                      <b>Цена:</b> {selectedService.price} кр.
                    </div>
                    <div className="mb-2">
                      <b>Владелец:</b>{" "}
                      {selectedService.user?.name || selectedService.user_id}
                    </div>
                    <div className="mb-2">
                      <b>Навыки:</b> {(selectedService.skills || []).join(", ")}
                    </div>
                    <div className="mb-2">
                      <b>Рейтинг:</b>{" "}
                      {selectedService.rating?.toFixed(1) ?? "-"}
                    </div>
                    <div className="mb-2">
                      <b>Создана:</b>{" "}
                      {new Date(selectedService.created_at).toLocaleString()}
                    </div>
                    <div className="mb-2">
                      <b>Обновлена:</b>{" "}
                      {new Date(selectedService.updated_at).toLocaleString()}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowServiceModal(false)}
                      >
                        Закрыть
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteService(selectedService.id)}
                      >
                        <Trash2 size={16} />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "archive" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Архив услуг</h2>
              {archivedLoading ? (
                <div>Загрузка...</div>
              ) : archivedServices.length === 0 ? (
                <div className="text-gray-400 text-center py-12">
                  Архив пуст
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl shadow">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Название</th>
                        <th className="p-2 text-left">Категория</th>
                        <th className="p-2 text-left">Цена</th>
                        <th className="p-2 text-left">Владелец</th>
                        <th className="p-2 text-left">Рейтинг</th>
                        <th className="p-2 text-left">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedServices.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b hover:bg-primary-50/30 transition"
                        >
                          <td className="p-2">{s.id}</td>
                          <td className="p-2">{s.title}</td>
                          <td className="p-2">
                            {serviceCategories.find((c) => c.id === s.category)
                              ?.label || s.category}
                          </td>
                          <td className="p-2">{s.price} кр.</td>
                          <td className="p-2">{s.user?.name || s.user_id}</td>
                          <td className="p-2">{s.rating?.toFixed(1) ?? "-"}</td>
                          <td className="p-2 flex gap-2">
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
          {activeTab === "payments" && <PaymentsAdminPanel />}
          {activeTab === "referrals" && <ReferralsAdminPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardPage;
