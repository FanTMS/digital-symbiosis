import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  // Блокировка скролла body при открытии модалки
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Затемнение фона с fade и blur */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Контент модалки с анимацией scale, opacity и смещением по Y */}
          <motion.div
            className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 z-10"
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            {children}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold transition-transform duration-200 hover:scale-125 hover:rotate-12"
              onClick={onClose}
              aria-label="Закрыть"
              type="button"
            >
              ×
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
