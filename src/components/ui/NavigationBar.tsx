import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, ShoppingBag, FileText, Users, Bell, MessageCircle, Shield, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';

const NavigationBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const check = () => setHidden(document.body.classList.contains('hide-tabbar'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (hidden) return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/services', icon: ShoppingBag, label: 'Услуги' },
    { path: '/orders', icon: FileText, label: 'Заказы' },
    { path: '/chats', icon: MessageCircle, label: 'Чаты' },
    { path: '/referrals', icon: Users, label: 'Рефералы' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];
  if (user && user.role === 'admin') {
    navItems.push({ path: '/admin-dashboard', icon: Shield, label: 'Админ' });
  }

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg z-10 px-2 py-1 border-t border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-3 relative ${
                isActive ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <item.icon size={20} />
              </motion.div>
              <span className="text-xs mt-1">{item.label}</span>
              
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