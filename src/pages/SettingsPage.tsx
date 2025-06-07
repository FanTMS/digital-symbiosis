import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTelegram } from "../hooks/useTelegram";
import {
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  CreditCard,
  HelpCircle,
  ChevronRight,
  ToggleLeft as Toggle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";

interface UserSettings {
  notifications_enabled: boolean;
  dark_mode: boolean;
  language: string;
  privacy_mode: boolean;
}

type ToggleSetting = {
  icon: any;
  label: string;
  value: boolean;
  onChange: () => void;
  type: "toggle";
};
type ButtonSetting = {
  icon: any;
  label: string;
  onClick: () => void;
  type: "button";
};

type Setting = ToggleSetting | ButtonSetting;

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tg, user } = useTelegram();
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    dark_mode: false,
    language: "ru",
    privacy_mode: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tg) {
      tg.setHeaderColor("#0BBBEF");
      tg.BackButton.show();
      tg.BackButton.onClick(() => navigate("/profile"));
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(() => navigate("/profile"));
      };
    }
  }, [tg, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        if (data) setSettings(data);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user?.id]);

  useEffect(() => {
    if (settings.dark_mode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [settings.dark_mode]);

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ [key]: value })
        .eq("user_id", user.id);

      if (error) throw error;
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error("Error updating setting:", error);
    }
  };

  const settingsGroups: { title: string; settings: Setting[] }[] = [
    {
      title: "Основные",
      settings: [
        {
          icon: Bell,
          label: "Уведомления",
          value: settings.notifications_enabled,
          onChange: () =>
            updateSetting(
              "notifications_enabled",
              !settings.notifications_enabled,
            ),
          type: "toggle",
        },
      ],
    },
    {
      title: "Конфиденциальность",
      settings: [
        {
          icon: Shield,
          label: "Приватный профиль",
          value: settings.privacy_mode,
          onChange: () => updateSetting("privacy_mode", !settings.privacy_mode),
          type: "toggle",
        },
      ],
    },
    {
      title: "Другое",
      settings: [
        {
          icon: CreditCard,
          label: "Платежные данные",
          onClick: () => alert("Раздел в разработке"),
          type: "button",
        },
        {
          icon: HelpCircle,
          label: "Помощь",
          onClick: () => alert("Раздел в разработке"),
          type: "button",
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />

        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />

            <div className="space-y-3">
              {[1, 2].map((j) => (
                <div
                  key={j}
                  className="h-12 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pb-16 pt-2"
    >
      <div className="px-4">
        <h1 className="text-2xl font-bold mb-6">Настройки</h1>

        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="mb-6"
          >
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              {group.title}
            </h2>
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
              {group.settings.map((setting, settingIndex) => (
                <motion.div
                  key={setting.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIndex * 0.1 + settingIndex * 0.05 }}
                  className={`flex items-center justify-between p-4 ${
                    settingIndex !== group.settings.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    <setting.icon size={20} className="text-gray-500" />

                    <span className="ml-3 font-medium">{setting.label}</span>
                  </div>
                  {setting.type === "toggle" ? (
                    <button
                      onClick={setting.onChange}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        setting.value ? "bg-primary-500" : "bg-gray-200"
                      }`}
                    >
                      <motion.span
                        initial={false}
                        animate={{ x: setting.value ? 20 : 2 }}
                        className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg"
                      />
                    </button>
                  ) : setting.type === "button" ? (
                    <button
                      onClick={setting.onClick}
                      className="flex items-center"
                    >
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        <div className="mt-8">
          <Button
            variant="outline"
            fullWidth
            onClick={() => alert("Выход из аккаунта")}
          >
            Выйти из аккаунта
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
