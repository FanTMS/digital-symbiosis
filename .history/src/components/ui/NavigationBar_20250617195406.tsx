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
    { path: "/chats", icon: MessageCircle, label: "Чаты" },
    { path: "/challenges", icon: Star, label: "Челленджи" },
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
      className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[98vw] max-w-lg z-50 bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl px-2 border border-gray-200 navigation-bar-fixed"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 8px)" }}
    >
      <div className="flex justify-between items-center w-full min-h-[68px] py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center px-3 py-1 relative min-w-[64px] transition-all duration-200 ${isActive ? "text-primary-600" : "text-gray-400 hover:text-primary-400"}`}
              style={{ flex: "1 0 0", minWidth: 0 }}
            >
              <motion.div
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="flex items-center justify-center"
              >
                <item.icon size={28} />
              </motion.div>
              <span className="text-[13px] mt-1 leading-tight font-semibold tracking-wide">
                {item.label}
              </span>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="navigation-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-primary-100 rounded-full shadow-md"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
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
