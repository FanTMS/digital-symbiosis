import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTelegram } from "../hooks/useTelegram";
import { X, Plus, Check, Loader2 } from "lucide-react";
import Button from "../components/ui/Button";
import { useCreateService } from "../hooks/useServices";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../lib/supabase";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);

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

  useEffect(() => {
    if (!user?.id) return;
    setQuizLoading(true);
    supabase.from('quizzes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setQuizzes(data || []))
      .finally(() => setQuizLoading(false));
  }, [user?.id]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    let imageUrl = null;
    try {
      setUploading(true);
      if (imageFile) {
        const filePath = `services/${user.id}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("service-images")
          .upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("service-images")
          .getPublicUrl(filePath);
        imageUrl = publicUrlData?.publicUrl;
      }
      await createService.mutateAsync({
        title,
        description,
        category,
        price: Number(price),
        user_id: user.id,
        skills,
        is_active: true,
        image_url: imageUrl,
        quiz_id: quizId || null,
      });
      navigate("/services?tab=all");
    } catch (err: any) {
      alert("Ошибка при создании услуги: " + err.message);
    }
    setUploading(false);
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
    <div className="pb-20 pt-2 min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white flex justify-center items-start overflow-auto">
      <div className="w-full max-w-md mx-auto px-2 sm:px-0">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-5 mt-4 mb-8 border border-blue-100"
        >
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-700">Создание услуги</h1>

          {/* Фото услуги */}
          <div className="mb-6">
            <label className="block font-semibold mb-2 text-gray-700">Фото услуги</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="w-20 h-20 object-cover rounded-lg border shadow" />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow text-red-500 hover:text-red-700 text-lg"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    disabled={uploading}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-5">
            <label htmlFor="title" className="block font-semibold mb-1 text-gray-700">
              Название услуги
            </label>
            <input
              type="text"
              id="title"
              placeholder="Например: Уроки английского языка"
              className={`w-full p-3 rounded-xl border ${errors.title ? "border-red-400" : "border-gray-200"} bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={uploading}
            />
            {errors.title && (
              <div className="text-red-500 text-xs mt-1">{errors.title}</div>
            )}
          </div>

          {/* Description */}
          <div className="mb-5">
            <label htmlFor="description" className="block font-semibold mb-1 text-gray-700">
              Описание услуги
            </label>
            <textarea
              id="description"
              placeholder="Опишите, что включает ваша услуга..."
              className={`w-full p-3 rounded-xl border ${errors.description ? "border-red-400" : "border-gray-200"} bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none min-h-[100px] text-base transition`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={uploading}
            />
            {errors.description && (
              <div className="text-red-500 text-xs mt-1">{errors.description}</div>
            )}
          </div>

          {/* Category */}
          <div className="mb-5">
            <label className="block font-semibold mb-1 text-gray-700">Категория</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium border transition ${category === cat.id ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-blue-50"}`}
                  disabled={uploading}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            {errors.category && (
              <div className="text-red-500 text-xs mt-1">{errors.category}</div>
            )}
          </div>

          {/* Price */}
          <div className="mb-5">
            <label htmlFor="price" className="block font-semibold mb-1 text-gray-700">
              Стоимость (в кредитах)
            </label>
            <input
              type="number"
              id="price"
              min="1"
              max="10000"
              className={`w-full p-3 rounded-xl border ${errors.price ? "border-red-400" : "border-gray-200"} bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={uploading}
            />
            {errors.price && (
              <div className="text-red-500 text-xs mt-1">{errors.price}</div>
            )}
          </div>

          {/* Skills */}
          <div className="mb-6">
            <label className="block font-semibold mb-1 text-gray-700">Навыки</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                >
                  {skill}
                  <button
                    type="button"
                    className="ml-1 text-red-400 hover:text-red-600"
                    onClick={() => handleRemoveSkill(skill)}
                    disabled={uploading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-sm"
                placeholder="Добавить навык..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                disabled={uploading}
              />
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition disabled:bg-blue-200"
                onClick={handleAddSkill}
                disabled={uploading || !newSkill.trim()}
              >
                <Plus size={16} />
              </button>
            </div>
            {errors.skills && (
              <div className="text-red-500 text-xs mt-1">{errors.skills}</div>
            )}
          </div>

          {/* Quiz select */}
          <div className="mb-6">
            <label className="block font-semibold mb-1 text-gray-700">Квиз для клиента</label>
            <div className="flex flex-col gap-2">
              {quizLoading ? (
                <div>Загрузка квизов...</div>
              ) : (
                <select className="w-full border rounded-xl px-3 py-2 text-base focus:ring-2 focus:ring-primary-400" value={quizId || ''} onChange={e => setQuizId(e.target.value || null)}>
                  <option value="">Без квиза</option>
                  {quizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>
              )}
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-2 rounded-xl" onClick={() => navigate('/quizzes/new')}>
                <Plus size={20} /> <span>Создать новый квиз</span>
              </Button>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full py-3 rounded-xl text-lg font-bold shadow-md bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 flex items-center justify-center gap-2"
            disabled={!isFormValid || uploading}
          >
            {uploading ? <Loader2 className="animate-spin" size={22} /> : <Check size={22} />}
            {uploading ? "Создание..." : "Создать услугу"}
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default CreateServicePage;
