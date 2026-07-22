import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { api } from "../../../api";

/** Owner: barcha talabalar (guruh bo'yicha filtrlanadigan), guruhga ko'chirish. */
export default function OwnerStudentsTab({ schoolId, onChanged }) {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filterGroupId, setFilterGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [movingStudent, setMovingStudent] = useState(null); // membership obyekti
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, groupsRes] = await Promise.all([
        api.schoolStudents(schoolId, filterGroupId),
        api.schoolGroups(schoolId),
      ]);
      setStudents(studentsRes.students || []);
      setGroups(groupsRes.groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, filterGroupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMove(membershipId, groupId) {
    setBusy(membershipId);
    try {
      await api.schoolMoveStudent(schoolId, membershipId, groupId);
      setMovingStudent(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(membershipId) {
    setBusy(membershipId);
    try {
      await api.schoolRemoveMember(schoolId, membershipId);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const groupName = (id) => groups.find((g) => g.id === id)?.name || t("school.noGroup");

  return (
    <div className="pb-4">
      {/* Guruh filtri */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setFilterGroupId(null)}
          className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
            filterGroupId === null
              ? "bg-white text-[#0F1424]"
              : "bg-white/[0.05] text-gray-400 border border-white/10"
          }`}
        >
          {t("school.allGroups")}
        </button>
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setFilterGroupId(g.id)}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              filterGroupId === g.id
                ? "bg-white text-[#0F1424]"
                : "bg-white/[0.05] text-gray-400 border border-white/10"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {loading && (
        <div className="flex justify-center py-8">
          <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {!loading && students.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">{t("school.noStudents")}</p>
      )}

      <div className="space-y-2.5">
        {students.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                {m.user?.avatarUrl ? (
                  <img src={m.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-400">
                    {m.user?.name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{m.user?.name}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  {groupName(m.groupId)} · {t("school.readiness")}: {m.user?.examReadiness ?? 0}%
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMovingStudent(m)}
                disabled={busy === m.id}
                className="flex-1 rounded-xl py-2 text-xs font-semibold text-gray-300 border border-white/10 bg-white/[0.03] disabled:opacity-50"
              >
                {t("school.moveGroup")}
              </button>
              <button
                onClick={() => handleRemove(m.id)}
                disabled={busy === m.id}
                className="flex-1 rounded-xl py-2 text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 disabled:opacity-50"
              >
                {t("school.remove")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {movingStudent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-5 pb-8">
          <div className="w-full max-w-sm rounded-3xl bg-[#161B2E] border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-base">{t("school.moveGroup")}</p>
              <button
                onClick={() => setMovingStudent(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X size={16} color="#E5E7EB" />
              </button>
            </div>
            <div className="space-y-2">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleMove(movingStudent.id, g.id)}
                  disabled={busy === movingStudent.id || g.id === movingStudent.groupId}
                  className="w-full rounded-2xl py-3 text-sm font-semibold text-left px-4 border border-white/10 bg-white/[0.03] disabled:opacity-40"
                >
                  {g.name}
                  {g.id === movingStudent.groupId && (
                    <span className="text-gray-500 text-xs ml-2">
                      ({t("school.currentGroup")})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
