import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users, X, ChevronRight } from "lucide-react";
import { api } from "../../../api";

/** Owner: guruhlarni boshqarish. */
export default function OwnerGroupsTab({ schoolId, onChanged, onOpenGroup }) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.schoolGroups(schoolId);
      setGroups(res.groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    setError("");
    try {
      await api.schoolCreateGroup(schoolId, name.trim());
      setName("");
      setShowCreate(false);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="pb-4">
      <button
        onClick={() => setShowCreate(true)}
        className="w-full mb-4 rounded-2xl py-3 font-bold text-sm text-white flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
      >
        <Plus size={16} />
        {t("school.newGroup")}
      </button>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {loading && (
        <div className="flex justify-center py-8">
          <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {!loading && groups.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">{t("school.noGroups")}</p>
      )}

      <div className="space-y-2.5">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => onOpenGroup?.(g.id)}
            disabled={!onOpenGroup}
            className="w-full text-left flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3.5 hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors disabled:hover:bg-white/[0.03]"
          >
            <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
              <Users size={15} color="#9CA3AF" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{g.name}</p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                {t("school.studentsCount", { count: g.studentCount })}
              </p>
            </div>
            {onOpenGroup && <ChevronRight size={16} className="text-gray-600 shrink-0" />}
          </button>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-5 pb-8">
          <div className="w-full max-w-sm rounded-3xl bg-[#161B2E] border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-base">{t("school.newGroup")}</p>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X size={16} color="#E5E7EB" />
              </button>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder={t("school.groupNamePlaceholder")}
              className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 mb-4"
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="w-full rounded-2xl py-3 font-bold text-sm text-white disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
            >
              {creating ? t("school.creating") : t("school.createButton")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
