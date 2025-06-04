import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const AdminComplaintsPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || user.role !== "admin") return;
    const fetchComplaints = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setComplaints(data || []);
      setLoading(false);
    };
    fetchComplaints();
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="p-6 text-center text-red-500" data-oid="5oclpqq">
        Доступ запрещён
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto" data-oid="81_-lmx">
      <h1 className="text-2xl font-bold mb-6" data-oid="qwrioah">
        Жалобы пользователей
      </h1>
      {loading ? (
        <div data-oid=":9-h7y4">Загрузка...</div>
      ) : complaints.length === 0 ? (
        <div className="text-gray-500" data-oid="rowi.iy">
          Жалоб нет
        </div>
      ) : (
        <div className="space-y-4" data-oid="cqkxjos">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow"
              data-oid="jgfyjz6"
            >
              <div className="mb-2 text-sm text-gray-500" data-oid=".a7nxdw">
                {new Date(c.created_at).toLocaleString()}
              </div>
              <div className="mb-2" data-oid="vh9nphu">
                <span className="font-semibold" data-oid="wors50d">
                  От:
                </span>{" "}
                {c.from_user_id}{" "}
                <span className="ml-2 font-semibold" data-oid="sa.4.:y">
                  На:
                </span>{" "}
                {c.to_user_id}
              </div>
              <div className="mb-2" data-oid="m5jwt0h">
                <span className="font-semibold" data-oid="_tst0-p">
                  Чат:
                </span>{" "}
                {c.chat_id}
              </div>
              <div className="mb-2" data-oid="udb83jc">
                <span className="font-semibold" data-oid="rzp6ri8">
                  Текст жалобы:
                </span>
              </div>
              <div
                className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-sm"
                data-oid=".qvlk_z"
              >
                {c.message}
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        className="mt-6 px-4 py-2 bg-primary-500 text-white rounded"
        onClick={() => navigate(-1)}
        data-oid="jfx_n9q"
      >
        Назад
      </button>
    </div>
  );
};

export default AdminComplaintsPage;
