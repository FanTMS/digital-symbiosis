import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTelegram } from "../hooks/useTelegram";
import { X, Plus, Check } from "lucide-react";
import Button from "../components/ui/Button";
import { useCreateService } from "../hooks/useServices";
import { useUser } from "../contexts/UserContext";

type ServiceCategory =
  | "education"
  | "it"
  | "design"
  | "languages"
  | "business"
  | "lifestyle"
  | "writing"
  | "music"
  | "other";

const CreateServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("education");
  const [price, setPrice] = useState("20");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const createService = useCreateService();

  useEffect(() => {
    if (tg) {
      tg.setHeaderColor("#0BBBEF");
      tg.BackButton.show();
      const handleBack = () => navigate("/services");
      tg.BackButton.onClick(handleBack);

      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [tg, navigate]);

  useEffect(() => {
    const newErrors: { [key: string]: string } = {};
    if (title.trim().length < 5)
      newErrors.title = "Название должно быть не короче 5 символов";
    if (title.trim().length > 100) newErrors.title = "Название слишком длинное";
    if (description.trim().length < 20)
      newErrors.description = "Описание должно быть не короче 20 символов";
    if (description.trim().length > 1000)
      newErrors.description = "Описание слишком длинное";
    if (!category) newErrors.category = "Выберите категорию";
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum < 1 || priceNum > 10000)
      newErrors.price = "Цена должна быть от 1 до 10 000 кредитов";
    if (skills.length === 0) newErrors.skills = "Добавьте хотя бы один навык";
    if (skills.some((s) => s.length < 2 || s.length > 30))
      newErrors.skills = "Навыки должны быть от 2 до 30 символов";
    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [title, description, category, price, skills]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createService.mutateAsync({
        title,
        description,
        category,
        price: Number(price),
        user_id: user.id,
        skills,
        is_active: true,
      });
      navigate("/services?tab=all");
    } catch (err: any) {
      alert("Ошибка при создании услуги: " + err.message);
    }
  };

  const categories: { id: ServiceCategory; label: string; emoji: string }[] = [
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

  return (
    <div
      className="pb-20 pt-2 min-h-screen bg-white overflow-auto"
      data-oid="l53rp48"
    >
      <div className="px-4" data-oid="abicfgb">
        <h1 className="text-2xl font-bold mb-4" data-oid=":3xkoia">
          Создание услуги
        </h1>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit}
          data-oid="uafumpk"
        >
          {/* Title */}
          <div className="mb-4" data-oid="q3hf6oq">
            <label
              htmlFor="title"
              className="block font-medium mb-1"
              data-oid="hpldj24"
            >
              Название услуги
            </label>
            <input
              type="text"
              id="title"
              placeholder="Например: Уроки английского языка"
              className={`w-full p-3 rounded-lg border ${errors.title ? "border-red-400" : "border-gray-300"} bg-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-oid="934m7hg"
            />

            {errors.title && (
              <div className="text-red-500 text-xs mt-1" data-oid=".5resh_">
                {errors.title}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4" data-oid="up909le">
            <label
              htmlFor="description"
              className="block font-medium mb-1"
              data-oid="i.::aa0"
            >
              Описание услуги
            </label>
            <textarea
              id="description"
              placeholder="Опишите, что включает ваша услуга..."
              className={`w-full p-3 rounded-lg border ${errors.description ? "border-red-400" : "border-gray-300"} bg-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none min-h-[100px]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              data-oid="8see73t"
            />

            {errors.description && (
              <div className="text-red-500 text-xs mt-1" data-oid="u-kme_x">
                {errors.description}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="mb-4" data-oid="p_:4t35">
            <label className="block font-medium mb-1" data-oid="cp-rhxy">
              Категория
            </label>
            <div className="flex flex-wrap gap-2" data-oid="q_k-al5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm ${
                    category === cat.id
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  data-oid="h.3b6z:"
                >
                  <span data-oid="rkqn8pe">{cat.emoji}</span>
                  <span data-oid="h:43r65">{cat.label}</span>
                </button>
              ))}
            </div>
            {errors.category && (
              <div className="text-red-500 text-xs mt-1" data-oid="c28jp8z">
                {errors.category}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mb-4" data-oid="athm5.7">
            <label
              htmlFor="price"
              className="block font-medium mb-1"
              data-oid="669gi:c"
            >
              Стоимость (в кредитах)
            </label>
            <input
              type="number"
              id="price"
              min="1"
              max="10000"
              className={`w-full p-3 rounded-lg border ${errors.price ? "border-red-400" : "border-gray-300"} bg-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              data-oid="3vsm:5k"
            />

            {errors.price && (
              <div className="text-red-500 text-xs mt-1" data-oid="_63frwf">
                {errors.price}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="mb-6" data-oid="gallwmn">
            <label className="block font-medium mb-1" data-oid="ed:ohrx">
              Навыки
            </label>
            <div className="flex flex-wrap gap-2 mb-2" data-oid="wnnjzty">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  data-oid="fib3uk0"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-gray-500 hover:text-error-500"
                    data-oid="mju6qks"
                  >
                    <X size={14} data-oid="a4ste3d" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex" data-oid="yrr5ail">
              <input
                type="text"
                placeholder="Добавьте навык (например, JavaScript)"
                className="flex-1 p-3 rounded-l-lg border border-gray-300 bg-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddSkill())
                }
                data-oid="c.mbxxu"
              />

              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-primary-500 text-white p-3 rounded-r-lg"
                disabled={!newSkill.trim()}
                data-oid=".zmaq_x"
              >
                <Plus size={18} data-oid="t2g-qwa" />
              </button>
            </div>
            {errors.skills && (
              <div className="text-red-500 text-xs mt-1" data-oid="u7.9wtz">
                {errors.skills}
              </div>
            )}
          </div>

          {/* Submit button */}
          <div
            className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200"
            style={{ zIndex: 20 }}
            data-oid="oyoc.y:"
          >
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={!isFormValid}
              leftIcon={
                isFormValid ? <Check size={18} data-oid="ymeh-2l" /> : undefined
              }
              data-oid="y-lo3bv"
            >
              Опубликовать услугу
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default CreateServicePage;
