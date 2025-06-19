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
  Gift,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import type { Database } from "../types/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import PaymentsAdminPanel from "../components/admin/PaymentsAdminPanel";
import ReferralsAdminPanel from "../components/admin/ReferralsAdminPanel";
import UserGrowthChart from "../components/admin/UserGrowthChart";
import Modal from "../components/ui/Modal";
import ChallengesAdminPanel from "../components/admin/ChallengesAdminPanel";
import AdminDisputesPage from "./AdminDisputesPage";

const TABS = [
  { key: "stats", label: "Статистика", icon: BarChart2 },
  { key: "users", label: "Пользователи", icon: Users },
  { key: "complaints", label: "Жалобы", icon: AlertTriangle },
  { key: "services", label: "Услуги", icon: Briefcase },
  { key: "archive", label: "Архив", icon: Archive },
  { key: "payments", label: "Платежи", icon: Coins },
  { key: "referrals", label: "Рефералы", icon: Award },
  { key: "promo_banner", label: "Промо-баннер", icon: Gift },
  { key: "promo_codes", label: "Промокоды", icon: Award },
  { key: "challenges", label: "Челленджи", icon: Gift },
  { key: "disputes", label: "Споры", icon: AlertTriangle },
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
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [userProfileError, setUserProfileError] = useState("");
  const [complaintsPage, setComplaintsPage] = useState(1);
  const complaintsPerPage = 10;
  const paginatedComplaints = complaints.slice((complaintsPage - 1) * complaintsPerPage, complaintsPage * complaintsPerPage);
  const [complaintStatus, setComplaintStatus] = useState<string>('all');
  const [verdictModal, setVerdictModal] = useState<{ open: boolean, complaint: any | null }>({ open: false, complaint: null });
  const [verdictBlock, setVerdictBlock] = useState(false);
  const [verdictBalance, setVerdictBalance] = useState(false);
  const [verdictRating, setVerdictRating] = useState('none');
  const [verdictText, setVerdictText] = useState("");
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [balanceModal, setBalanceModal] = useState<{ open: boolean, user: any | null }>({ open: false, user: null });
  const [balanceDelta, setBalanceDelta] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");

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
        .select("*, user:users!services_user_id_fkey(*)")
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
        .select("*, user:users!services_user_id_fkey(*)")
        .eq("is_active", false)
        .then(({ data }) => {
          setArchivedServices(data || []);
          setArchivedLoading(false);
        });
    }
  }, [activeTab, user]);

  useEffect(() => {
    setComplaintsPage(1);
  }, [complaints]);

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
    <div className="p-2 md:p-6 max-w-6xl mx-auto pb-20 sm:pb-24">
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
              <div className="bg-white rounded-xl shadow p-6 mt-4">
                <UserGrowthChart />
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
                            <button
                              className="ml-2 text-amber-500 hover:underline flex items-center gap-1"
                              onClick={() => setBalanceModal({ open: true, user: u })}
                            >
                              <Coins size={16} /> Баланс
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
                    <div className="flex flex-col gap-2 mt-4">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (window.confirm("Сбросить рейтинг пользователя?")) {
                            await supabase.from("users").update({ rating: 0 }).eq("id", selectedUser.id);
                            setSelectedUser({ ...selectedUser, rating: 0 });
                            setUsers(users.map((u) => u.id === selectedUser.id ? { ...u, rating: 0 } : u));
                            setFilteredUsers(filteredUsers.map((u) => u.id === selectedUser.id ? { ...u, rating: 0 } : u));
                          }
                        }}
                      >
                        Сбросить рейтинг
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          if (window.confirm("Удалить профиль пользователя? Это действие необратимо!")) {
                            await supabase.from("users").delete().eq("id", selectedUser.id);
                            setShowUserModal(false);
                            setUsers(users.filter((u) => u.id !== selectedUser.id));
                            setFilteredUsers(filteredUsers.filter((u) => u.id !== selectedUser.id));
                            setComplaints(complaints.filter((c) => c.to_user_id !== selectedUser.id));
                          }
                        }}
                      >
                        Удалить профиль
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
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <AlertTriangle size={28} className="text-red-500" /> Жалобы
              </h2>
              <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center">
                <span className="font-medium">Статус:</span>
                <select
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-base"
                  value={complaintStatus}
                  onChange={e => setComplaintStatus(e.target.value)}
                >
                  <option value="all">Все</option>
                  <option value="new">Новые</option>
                  <option value="reviewed">Рассмотренные</option>
                  <option value="rejected">Отклонённые</option>
                </select>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl shadow-sm">
                  <table className="min-w-full text-base border">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Пользователь</th>
                        <th className="p-2 text-left">Тип</th>
                        <th className="p-2 text-left">Текст</th>
                        <th className="p-2 text-left">Дата</th>
                        <th className="p-2 text-left">Статус</th>
                        <th className="p-2 text-left">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedComplaints
                        .filter(c => complaintStatus === 'all' || c.status === complaintStatus)
                        .map((c) => (
                          <tr key={c.id} className="border-b hover:bg-primary-50/30 transition">
                            <td className="p-2">{c.id}</td>
                            <td className="p-2">{c.user_id}</td>
                            <td className="p-2">{c.type}</td>
                            <td className="p-2 max-w-xs truncate">{c.text}</td>
                            <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
                            <td className="p-2">
                              {c.status === 'new' && <span className="text-orange-500 font-semibold">Новая</span>}
                              {c.status === 'reviewed' && <span className="text-green-600 font-semibold">Рассмотрена</span>}
                              {c.status === 'rejected' && <span className="text-gray-400">Отклонена</span>}
                            </td>
                            <td className="p-2">
                              <button
                                className="text-primary-500 hover:underline flex items-center gap-1"
                                onClick={() => setVerdictModal({ open: true, complaint: c })}
                              >
                                <Eye size={16} /> Подробнее
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Пагинация */}
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" variant="outline" disabled={complaintsPage === 1} onClick={() => setComplaintsPage(p => Math.max(1, p - 1))}>Назад</Button>
                <span className="px-2 py-1 text-base">Стр. {complaintsPage}</span>
                <Button size="sm" variant="outline" disabled={paginatedComplaints.length < complaintsPerPage} onClick={() => setComplaintsPage(p => p + 1)}>Вперёд</Button>
              </div>
              {/* Модалка подробностей и принятия решения */}
              {verdictModal.open && verdictModal.complaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
                      onClick={() => setVerdictModal({ open: false, complaint: null })}
                      aria-label="Закрыть"
                    >
                      ×
                    </button>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <AlertTriangle size={20} className="text-red-500" /> Жалоба #{verdictModal.complaint.id}
                    </h3>
                    <div className="mb-2"><b>Пользователь:</b> {verdictModal.complaint.user_id}</div>
                    <div className="mb-2"><b>Тип:</b> {verdictModal.complaint.type}</div>
                    <div className="mb-2"><b>Текст:</b> {verdictModal.complaint.text}</div>
                    <div className="mb-2"><b>Дата:</b> {new Date(verdictModal.complaint.created_at).toLocaleString()}</div>
                    <div className="mb-4"><b>Статус:</b> {verdictModal.complaint.status}</div>
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        setVerdictLoading(true);
                        // Здесь логика принятия решения (например, обновить статус в Supabase)
                        // ...
                        setVerdictModal({ open: false, complaint: null });
                        setVerdictLoading(false);
                      }}
                      className="space-y-4"
                    >
                      <div className="flex gap-2">
                        <Button type="submit" variant="primary" size="md" disabled={verdictLoading}>
                          {verdictLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} Рассмотреть
                        </Button>
                        <Button type="button" variant="danger" size="md" onClick={() => setVerdictModal({ open: false, complaint: null })}>
                          <XCircle size={20} /> Отклонить
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "services" && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Briefcase size={28} className="text-accent-500" /> Услуги
              </h2>
              <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center">
                <select
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-base"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  {serviceCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="w-full sm:w-72 rounded-xl border border-gray-200 px-4 py-2 text-base bg-gray-50"
                  placeholder="Поиск по названию, описанию или навыкам..."
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                />
              </div>
              {serviceLoading ? (
                <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl shadow-sm">
                  <table className="min-w-full text-base border">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Название</th>
                        <th className="p-2 text-left">Категория</th>
                        <th className="p-2 text-left">Цена</th>
                        <th className="p-2 text-left">Владелец</th>
                        <th className="p-2 text-left">Навыки</th>
                        <th className="p-2 text-left">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServices.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-primary-50/30 transition">
                          <td className="p-2">{s.id}</td>
                          <td className="p-2">{s.title}</td>
                          <td className="p-2">{serviceCategories.find(c => c.id === s.category)?.label || s.category}</td>
                          <td className="p-2">{s.price} кр.</td>
                          <td className="p-2">{s.user?.name || s.user_id}</td>
                          <td className="p-2">{(s.skills || []).join(", ")}</td>
                          <td className="p-2 flex gap-2">
                            <button className="text-primary-500 hover:underline flex items-center gap-1" onClick={() => { setSelectedService(s); setShowServiceModal(true); }}>
                              <Eye size={16} /> Просмотр
                            </button>
                            <button className="text-amber-500 hover:underline flex items-center gap-1" onClick={() => handleDeleteService(s.id)}>
                              <Archive size={16} /> Архивировать
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
          {activeTab === "archive" && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Archive size={28} className="text-gray-500" /> Архив услуг
              </h2>
              {archivedLoading ? (
                <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>
              ) : archivedServices.length === 0 ? (
                <div className="text-gray-400 text-center py-12">Архив пуст</div>
              ) : (
                <div className="overflow-x-auto rounded-xl shadow-sm">
                  <table className="min-w-full text-base border">
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
                        <tr key={s.id} className="border-b hover:bg-primary-50/30 transition">
                          <td className="p-2">{s.id}</td>
                          <td className="p-2">{s.title}</td>
                          <td className="p-2">{serviceCategories.find(c => c.id === s.category)?.label || s.category}</td>
                          <td className="p-2">{s.price} кр.</td>
                          <td className="p-2">{s.user?.name || s.user_id}</td>
                          <td className="p-2">{s.rating ?? '-'}</td>
                          <td className="p-2 flex gap-2">
                            <button className="text-primary-500 hover:underline flex items-center gap-1" onClick={() => { setSelectedService(s); setShowServiceModal(true); }}>
                              <Eye size={16} /> Просмотр
                            </button>
                            <button className="text-red-500 hover:underline flex items-center gap-1" onClick={async () => {
                              if (!window.confirm("Удалить навсегда?")) return;
                              const { error } = await supabase.from("services").delete().eq("id", s.id);
                              if (error && error.code === "409") {
                                alert("Нельзя удалить услугу, пока есть связанные заказы или отзывы.");
                              } else if (!error) {
                                setArchivedServices(archivedServices.filter(a => a.id !== s.id));
                              }
                            }}>
                              <Trash2 size={16} /> Удалить
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
          {activeTab === "promo_banner" && (
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Промо-баннер</h2>
              <PromoBannerAdminForm />
            </div>
          )}
          {activeTab === "promo_codes" && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Промокоды</h2>
              <PromoCodesAdminPanel />
            </div>
          )}
          {activeTab === "challenges" && (
            <ChallengesAdminPanel />
          )}
          {activeTab === "disputes" && (
            <AdminDisputesPage />
          )}
        </motion.div>
      </AnimatePresence>
      {showUserModal && userProfileLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative text-center">
            <div className="text-lg font-semibold mb-2">Загрузка профиля...</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        </div>
      )}
      {/* Модалка управления балансом */}
      {balanceModal.open && balanceModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setBalanceModal({ open: false, user: null })}
              aria-label="Закрыть"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Coins size={20} /> Управление балансом
            </h3>
            <div className="mb-2">
              <b>ID:</b> {balanceModal.user.id}
            </div>
            <div className="mb-2">
              <b>Имя:</b> {balanceModal.user.name}
            </div>
            <div className="mb-4">
              <b>Текущий баланс:</b> <span className="font-mono text-lg text-amber-600">{balanceModal.user.credits ?? 0} кр.</span>
            </div>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setBalanceLoading(true);
                setBalanceError("");
                const newBalance = (balanceModal.user.credits ?? 0) + Number(balanceDelta);
                if (isNaN(newBalance) || newBalance < 0) {
                  setBalanceError("Баланс не может быть отрицательным");
                  setBalanceLoading(false);
                  return;
                }
                const { error } = await supabase.from("users").update({ credits: newBalance }).eq("id", balanceModal.user.id);
                if (error) {
                  setBalanceError(error.message);
                  setBalanceLoading(false);
                  return;
                }
                setBalanceModal({ open: false, user: null });
                setBalanceDelta(0);
                // Обновить список пользователей
                if (activeTab === "users") {
                  supabase.from("users").select("*").then(({ data }) => {
                    setUsers(data || []);
                    setFilteredUsers(data || []);
                  });
                }
                setBalanceLoading(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block font-medium mb-1">Изменить баланс (± кредиты)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={balanceDelta}
                  onChange={e => setBalanceDelta(Number(e.target.value))}
                  placeholder="Например, 10 или -5"
                  required
                />
              </div>
              {balanceError && <div className="text-red-500 text-sm">{balanceError}</div>}
              <Button type="submit" variant="primary" size="md" disabled={balanceLoading}>
                {balanceLoading ? "Сохранение..." : "Сохранить"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function PromoBannerAdminForm() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<any[]>([]); // история баннеров
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    text: "",
    image_url: "",
    link: "",
    color: "#f0fdfa",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Загрузка истории баннеров
  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("promo_banners")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setBanners(data);
      if (data.length > 0) {
        setSelectedBanner(data[0]);
        setForm({
          title: data[0].title || "",
          text: data[0].text || "",
          image_url: data[0].image_url || "",
          link: data[0].link || "",
          color: data[0].color || "#f0fdfa",
        });
        setImagePreview(data[0].image_url || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Выбор баннера из истории
  const handleSelectBanner = (banner: any) => {
    setSelectedBanner(banner);
    setForm({
      title: banner.title || "",
      text: banner.text || "",
      image_url: banner.image_url || "",
      link: banner.link || "",
      color: banner.color || "#f0fdfa",
    });
    setImagePreview(banner.image_url || null);
    setError(null);
  };

  // Функция для очистки имени файла
  function sanitizeFileName(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
  }

  // Загрузка картинки в Storage
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2 МБ
        setError("Размер изображения не должен превышать 2 МБ");
        return;
      }
      setImageFile(file);
      setUploading(true);
      // Очистка имени файла
      const safeName = sanitizeFileName(file.name);
      const filePath = `${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("promo-banners")
        .upload(filePath, file, { upsert: true });
      if (uploadError) {
        setError("Ошибка загрузки изображения: " + uploadError.message);
        setUploading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from("promo-banners")
        .getPublicUrl(filePath);
      setImagePreview(publicUrlData?.publicUrl || null);
      setForm((f) => ({ ...f, image_url: publicUrlData?.publicUrl || "" }));
      setUploading(false);
      setError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Сохранение (создание или обновление)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      let saveError = null;
      if (selectedBanner) {
        const { error } = await supabase
          .from("promo_banners")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", selectedBanner.id);
        if (error) saveError = error;
      } else {
        const { error } = await supabase
          .from("promo_banners")
          .insert({ ...form, updated_at: new Date().toISOString() });
        if (error) saveError = error;
      }
      if (saveError) {
        setError("Ошибка сохранения: " + saveError.message);
        setSaving(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      fetchBanners();
      window.dispatchEvent(new Event('promoBannerUpdated'));
    } catch (e: any) {
      setError("Ошибка сохранения: " + (e.message || e));
    }
    setSaving(false);
  };

  // Удаление баннера
  const handleDelete = async (id: string) => {
    if (!window.confirm("Удалить этот баннер?")) return;
    setSaving(true);
    // Найти баннер по id
    const bannerToDelete = banners.find(b => b.id === id);
    // Если есть картинка в Storage — удалить её
    if (bannerToDelete && bannerToDelete.image_url) {
      try {
        // Парсим путь из публичного URL
        const url = bannerToDelete.image_url;
        const match = url.match(/public\\([^?]+)/) || url.match(/public\/([^?]+)/) || url.match(/public%2F([^?]+)/);
        let filePath = null;
        if (match && match[1]) {
          filePath = decodeURIComponent(match[1]);
        } else if (url.includes('/promo-banners/')) {
          filePath = url.split('/promo-banners/')[1].split('?')[0];
          filePath = 'promo-banners/' + filePath;
        }
        if (filePath) {
          await supabase.storage.from("public").remove([filePath]);
        }
      } catch (e) {
        // ignore
      }
    }
    await supabase.from("promo_banners").delete().eq("id", id);
    setSaving(false);
    setSuccess(false);
    setForm({ title: "", text: "", image_url: "", link: "", color: "#f0fdfa" });
    setImagePreview(null);
    setSelectedBanner(null);
    fetchBanners();
    window.dispatchEvent(new Event('promoBannerUpdated'));
  };

  // Добавляю функцию для установки активного баннера
  const handleSetActive = async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      // Сбросить is_active у всех
      await supabase.from("promo_banners").update({ is_active: false }).neq("id", id);
      // Установить is_active у выбранного
      await supabase.from("promo_banners").update({ is_active: true }).eq("id", id);
      fetchBanners();
      window.dispatchEvent(new Event('promoBannerUpdated'));
    } catch (e: any) {
      setError("Ошибка установки активного баннера: " + (e.message || e));
    }
    setSaving(false);
  };

  if (loading) return <div>Загрузка...</div>;
  return (
    <div>
      {/* История баннеров */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">История баннеров</h3>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {banners.map((b) => (
            <div key={b.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedBanner?.id === b.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => handleSelectBanner(b)}>
              {b.image_url && <img src={b.image_url} alt="" className="w-10 h-10 object-cover rounded" />}
              <div className="flex-1">
                <div className="font-bold text-sm">{b.title}</div>
                <div className="text-xs text-gray-500">{new Date(b.updated_at).toLocaleString()}</div>
                {b.is_active && <span className="text-green-600 text-xs font-bold">Активный</span>}
              </div>
              <button className="text-blue-500 hover:text-blue-700 text-xs mr-2" onClick={e => { e.stopPropagation(); handleSetActive(b.id); }} disabled={b.is_active}>Сделать активным</button>
              <button className="text-red-500 hover:text-red-700 text-xs" onClick={e => { e.stopPropagation(); handleDelete(b.id); }}>Удалить</button>
            </div>
          ))}
        </div>
      </div>
      {/* Форма редактирования/создания */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Заголовок</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Текст</label>
          <textarea name="text" value={form.text} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Картинка баннера</label>
          <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
          {imagePreview && <img src={imagePreview} alt="Баннер" style={{ maxWidth: 200, borderRadius: 12, marginTop: 8 }} />}
        </div>
        <div>
          <label className="block font-medium mb-1">Цвет фона</label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              name="color"
              value={form.color}
              onChange={handleChange}
              className="w-12 h-12 p-0 border-none rounded-full shadow"
              style={{ background: form.color }}
            />
            <span style={{ background: form.color, display: 'inline-block', width: 32, height: 32, borderRadius: 8, border: '1px solid #eee' }} />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Ссылка (не используется, баннер открывает модалку)</label>
          <input name="link" value={form.link} onChange={handleChange} className="w-full border rounded px-3 py-2" disabled />
        </div>
        <Button type="submit" variant="primary" size="md" disabled={saving || uploading}>{saving ? "Сохранение..." : "Сохранить"}</Button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">Сохранено!</div>}
      </form>
    </div>
  );
}

function PromoCodesAdminPanel() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    amount: 10,
    expires_at: "",
    description: "",
    max_activations: 1,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchCodes();
  }, []);
  async function fetchCodes() {
    setLoading(true);
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setCodes(data || []);
    setLoading(false);
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    if (!form.code.trim() || !form.amount) {
      setError("Введите код и сумму");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("promo_codes").insert({
      code: form.code.trim(),
      amount: Number(form.amount),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      description: form.description,
      max_activations: Number(form.max_activations) || 1,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    setForm({ code: "", amount: 10, expires_at: "", description: "", max_activations: 1 });
    setSuccess(true);
    fetchCodes();
    setSaving(false);
    setTimeout(() => setSuccess(false), 2000);
  };
  const handleDeactivate = async (id: number) => {
    if (!window.confirm("Деактивировать промокод?")) return;
    await supabase.from("promo_codes").update({ is_active: false }).eq("id", id);
    fetchCodes();
  };
  // Заглушка: подсчёт активаций (реализовать через отдельную таблицу promo_code_activations)
  const getActivationsCount = (code: any) => code.activations_count || 0;
  return (
    <>
      <form onSubmit={handleCreate} className="space-y-4 mb-8">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block font-medium mb-1">Код</label>
            <input name="code" value={form.code} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div style={{ minWidth: 100 }}>
            <label className="block font-medium mb-1">Сумма</label>
            <input name="amount" type="number" min={1} value={form.amount} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div style={{ minWidth: 120 }}>
            <label className="block font-medium mb-1">Макс. активаций</label>
            <input name="max_activations" type="number" min={1} value={form.max_activations} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Срок действия (до)</label>
          <input name="expires_at" type="date" value={form.expires_at} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-medium mb-1">Описание (необязательно)</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <Button type="submit" variant="primary" size="md" disabled={saving}>{saving ? "Создание..." : "Создать промокод"}</Button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">Промокод создан!</div>}
      </form>
      <h3 className="text-lg font-semibold mb-2">Все промокоды</h3>
      {loading ? (
        <div>Загрузка...</div>
      ) : codes.length === 0 ? (
        <div className="text-gray-400">Нет промокодов</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr>
                <th className="p-2 border">Код</th>
                <th className="p-2 border">Сумма</th>
                <th className="p-2 border">Активаций / Лимит</th>
                <th className="p-2 border">Статус</th>
                <th className="p-2 border">Кто активировал</th>
                <th className="p-2 border">Когда</th>
                <th className="p-2 border">Срок</th>
                <th className="p-2 border">Описание</th>
                <th className="p-2 border">Действия</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className={c.is_active ? "" : "bg-gray-100 text-gray-400"}>
                  <td className="p-2 border font-mono font-bold">{c.code}</td>
                  <td className="p-2 border">{c.amount}</td>
                  <td className="p-2 border">{getActivationsCount(c)} / {c.max_activations || 1}</td>
                  <td className="p-2 border">{c.is_active ? (c.activated_by ? "Использован" : "Активен") : "Деактивирован"}</td>
                  <td className="p-2 border">{c.activated_by || "-"}</td>
                  <td className="p-2 border">{c.activated_at ? new Date(c.activated_at).toLocaleString() : "-"}</td>
                  <td className="p-2 border">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "-"}</td>
                  <td className="p-2 border">{c.description || "-"}</td>
                  <td className="p-2 border">
                    {c.is_active && !c.activated_by && (
                      <Button size="sm" variant="danger" onClick={() => handleDeactivate(c.id)}>
                        Деактивировать
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default AdminDashboardPage;
