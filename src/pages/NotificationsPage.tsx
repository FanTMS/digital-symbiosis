import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { notificationsApi } from "../lib/api/notifications";
import type { Notification } from "../types/models";
import Button from "../components/ui/Button";
import { motion } from "framer-motion";

export default function NotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNotifications = () => {
    if (user?.id) {
      setLoading(true);
      notificationsApi
        .listUserNotifications(user.id)
        .then(setNotifications)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await notificationsApi.deleteNotification(id);
      fetchNotifications();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkRead = async (id: string) => {
    setActionLoading(id);
    try {
      await notificationsApi.markAsRead(id);
      fetchNotifications();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading)
    return (
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Уведомления</h1>
        <ul className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <li
              key={i}
              className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            >
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2" />

              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </li>
          ))}
        </ul>
      </div>
    );

  if (error) return <div className="p-4 text-red-500">Ошибка: {error}</div>;

  if (!notifications.length)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-4 max-w-xl mx-auto flex flex-col items-center justify-center py-8 text-center"
      >
        <h1 className="text-2xl font-bold mb-4">Уведомления</h1>
        <div className="text-4xl mb-2">🔔</div>
        <h3 className="text-lg font-medium mb-1">Нет уведомлений</h3>
        <p className="text-gray-500 mb-4 max-w-xs">
          У вас пока нет уведомлений.
        </p>
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 max-w-xl mx-auto"
    >
      <h1 className="text-2xl font-bold mb-4">Уведомления</h1>
      <ul className="space-y-3">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`p-3 rounded-lg border flex flex-col gap-2 ${n.read ? "opacity-60 bg-gray-100" : "bg-white shadow"}`}
          >
            <div className="font-medium">{n.message}</div>
            <div className="text-xs text-gray-400">
              {new Date(n.created_at).toLocaleString()}
            </div>
            <div className="flex gap-2 mt-1">
              {!n.read && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading === n.id}
                  onClick={() => handleMarkRead(n.id)}
                >
                  Прочитано
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                disabled={actionLoading === n.id}
                onClick={() => handleDelete(n.id)}
              >
                Удалить
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
