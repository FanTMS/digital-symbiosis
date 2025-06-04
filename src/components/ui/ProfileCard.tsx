import React from "react";
import { Star, Award, Check } from "lucide-react";
import { User } from "../../types";
import { motion } from "framer-motion";

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
      data-oid="7dzd7::"
    >
      <div
        className="bg-gradient-to-r from-primary-500 to-primary-600 p-4"
        data-oid="hnayq.d"
      >
        <div className="flex items-center" data-oid="5giu.cq">
          <div className="relative" data-oid="1h:wki-">
            <img
              src={
                user.avatarUrl ||
                "https://images.pexels.com/photos/4926674/pexels-photo-4926674.jpeg?auto=compress&cs=tinysrgb&w=150"
              }
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white"
              data-oid="tvc5:-:"
            />

            <div
              className={`absolute -bottom-1 -right-1 rounded-full p-1 bg-white`}
              data-oid="751_mpf"
            >
              <span
                className={`flex items-center justify-center w-5 h-5 ${getLevelColor(user.level)} text-xs font-bold rounded-full`}
                data-oid="_feke0f"
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
          <div className="ml-4 text-white" data-oid="8mfd-9v">
            <h3 className="font-semibold text-lg" data-oid="x01w7hy">
              {user.name}
            </h3>
            <div className="flex items-center" data-oid="1qv_hrk">
              <Star
                size={16}
                className="fill-yellow-400 stroke-yellow-400"
                data-oid="s4biwi:"
              />

              <span className="ml-1 text-sm" data-oid="kk3.:25">
                {user.rating.toFixed(1)}
              </span>
              <span className="mx-2 text-white/70" data-oid="o0c5h0i">
                •
              </span>
              <span className="text-sm" data-oid="hq4tx8f">
                {user.completedTasks} заданий
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4" data-oid="_c1qm75">
        <div
          className="flex justify-between items-center mb-4"
          data-oid="8w_u8dj"
        >
          <div data-oid="b3a-hn0">
            <span className="text-sm text-gray-500" data-oid="t:v9n81">
              Баланс
            </span>
            <h4
              className="font-semibold text-lg text-accent-500"
              data-oid="g-v1cos"
            >
              {user.credits} кредитов
            </h4>
          </div>
          <div className="flex items-center" data-oid="vy7.dc1">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getLevelColor(user.level)}`}
              data-oid="l5r.-ls"
            >
              {user.level}
            </span>
          </div>
        </div>

        {detailed && (
          <>
            <div className="mb-4" data-oid="o1d:03c">
              <h4 className="font-medium text-gray-900 mb-2" data-oid="m.xc-.0">
                Навыки
              </h4>
              <div className="flex flex-wrap gap-2" data-oid="ufva-mw">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs"
                    data-oid="qbnx.4-"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div data-oid="a11gyc5">
              <h4
                className="font-medium text-gray-900 mb-2 flex items-center"
                data-oid="1c:9eos"
              >
                <Award size={16} className="mr-1" data-oid="6sf-nq7" />{" "}
                Достижения
              </h4>
              <div className="flex flex-wrap gap-2" data-oid="7rt4xgd">
                {user.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs"
                    data-oid="8.x0kk8"
                  >
                    <Check size={12} className="mr-1" data-oid="efke3pt" />
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
