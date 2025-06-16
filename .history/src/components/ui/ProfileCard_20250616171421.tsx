import React from "react";
import { Star, Award, Check } from "lucide-react";
import { User } from "../../types";
import { motion } from "framer-motion";
import { Avatar } from "./Avatar";

interface ProfileCardProps {
  user: User;
  detailed?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  detailed = false,
}) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Новичок":
        return "bg-green-100 text-green-800";
      case "Специалист":
        return "bg-blue-100 text-blue-800";
      case "Эксперт":
        return "bg-purple-100 text-purple-800";
      case "Мастер":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-card overflow-hidden"
    >
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
        <div className="flex items-center">
          <div className="relative">
            <Avatar src={user.avatarUrl} name={user.name} size={64} />
            <div
              className={`absolute -bottom-1 -right-1 rounded-full p-1 bg-white`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 ${getLevelColor(user.level)} text-xs font-bold rounded-full`}
              >
                {user.level === "Новичок"
                  ? "Н"
                  : user.level === "Специалист"
                    ? "С"
                    : user.level === "Эксперт"
                      ? "Э"
                      : "М"}
              </span>
            </div>
          </div>
          <div className="ml-4 text-white">
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <div className="flex items-center">
              <Star size={16} className="fill-yellow-400 stroke-yellow-400" />

              <span className="ml-1 text-sm">{user.rating.toFixed(1)}</span>
              <span className="mx-2 text-white/70">•</span>
              <span className="text-sm">{user.completedTasks} заданий</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-sm text-gray-500">Баланс</span>
            <h4 className="font-semibold text-lg text-accent-500">
              {user.credits} кредитов
            </h4>
          </div>
          <div className="flex items-center">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getLevelColor(user.level)}`}
            >
              {user.level}
            </span>
          </div>
        </div>

        {detailed && (
          <>
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Навыки</h4>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Award size={16} className="mr-1" /> Достижения
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs"
                  >
                    <Check size={12} className="mr-1" />
                    {badge.name}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileCard;
