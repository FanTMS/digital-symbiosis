import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  User,
  ShoppingBag,
  FileText,
  Users,
  Bell,
  MessageCircle,
  Shield,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../contexts/UserContext";

const NavigationBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const check = () =>
      setHidden(document.body.classList.contains("hide-tabbar"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  if (hidden) return null;

  const navItems = [
    { path: "/", icon: Home, label: "Главная" },
    { path: "/services", icon: ShoppingBag, label: "Услуги" },
    { path: "/orders", icon: FileText, label: "Заказы" },
    { path: "/chats", icon: MessageCircle, label: "Чаты" },
    { path: "/profile", icon: User, label: "Профиль" },
  ];

  if (user && user.role === "admin") {
    navItems.push({ path: "/admin-dashboard", icon: Shield, label: "Админ" });
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white backdrop-blur-lg shadow-lg px-0 border-t border-gray-200"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 8px)" }}
    >
      <div className="flex justify-around items-center max-w-lg mx-auto overflow-x-auto scrollbar-none min-h-[72px] py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-3 relative min-w-[64px] ${
                isActive ? "text-primary-500" : "text-gray-500"
              } text-base`}
              style={{ flex: "1 0 0", minWidth: 0 }}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <item.icon size={26} />
              </motion.div>
              <span className="text-[13px] mt-1 leading-tight font-medium">
                {item.label}
              </span>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="navigation-indicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default NavigationBar;
