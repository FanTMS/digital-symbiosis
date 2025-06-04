import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import { Home } from "lucide-react";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 text-center"
      data-oid="0iwk90f"
    >
      <div className="mb-6" data-oid="nyp9_mc">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
          className="text-8xl mb-4"
          data-oid="reun9hw"
        >
          🔍
        </motion.div>
        <h1 className="text-3xl font-bold mb-2" data-oid="bzhlo:b">
          Страница не найдена
        </h1>
        <p
          className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto"
          data-oid="9:uhkt-"
        >
          Запрашиваемая страница не существует или была перемещена
        </p>
        <Button
          variant="primary"
          leftIcon={<Home size={18} data-oid="u07.pn8" />}
          onClick={() => navigate("/")}
          data-oid="wrsc_7l"
        >
          Вернуться на главную
        </Button>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;
