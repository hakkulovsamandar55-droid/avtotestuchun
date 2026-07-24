import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, UserX, UserCheck, X, Users } from "lucide-react";
import { api } from "../../../api";
import UserSearchPicker from "../UserSearchPicker";

function statusMeta(status) {
  if (status === "SUSPENDED") return { label: "school.suspended", color: "#F87171" };
  if (status === "REMOVED") return { label: "school.removed", color: "#6B7280" };
  return { label: "school.active", color: "#34D399" };
}

/** Owner: o'qituvchilarni boshqarish. */
export default function OwnerTeachersTab({ schoolId, onChanged }) {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Guruhlar ham kerak — o'qituvchini tayinlash uchun ro'yxat
      // ko'rsatiladi. Ikkalasi parallel yuklanadi.
      const [res, groupRes] = await Promise.all([
        api.schoolTeachers(schoolId),
        api.schoolGroups(schoolId),
      ]);
      setTeachers(res.teachers || []);
      setGroups(groupRes.groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  async function handleAssignGroup(membershipId, groupId) {
    setBusy(membershipId);
    setError("");
    try {
      await api.schoolAssignTeacherGroup(schoolId, membershipId, groupId);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    // Endi ID qo'lda kiritilmaydi — foydalanuvchi qidiruvdan tanlanadi.
    // Shu sababli noto'g'ri/Telegram ID kiritish holati umuman yuz bermaydi.
    if (!selectedUser) {
      setError(t("school.selectUserFirst"));
      return;
    }
    setBusy("add");
    setError("");
    try {
      await api.schoolAddTeacher(schoolId, selectedUser.id);
      setShowAdd(false);
      setSelectedUser(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleSuspend(membershipId) {
    setBusy(membershipId);
    try {
      await api.schoolSuspendTeacher(schoolId, membershipId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleReactivate(membershipId) {
    setBusy(membershipId);
    try {
      await api.schoolReactivateTeacher(schoolId, membershipId);
      await load();
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

  return (
    <div className="pb-4">
      <button
        onClick={() => setShowAdd(true)}
        className="w-full mb-4 rounded-2xl py-3 font-bold text-sm text-white flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
      >
        <Plus size={16} />
        {t("school.addTeacher")}
      </button>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {loading && (
        <div className="flex justify-center py-8">
          <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {!loading && teachers.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">{t("school.noTeachers")}</p>
      )}

      <div className="space-y-2.5">
        {teachers.map((m) => {
          const meta = statusMeta(m.status);
          return (
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
                  <p className="text-[11px] mt-0.5 font-semibold" style={{ color: meta.color }}>
                    {t(meta.label)}
                  </p>
                </div>
              </div>

              {/* Guruh tayinlash — o'qituvchi paneli SHU YERDAN ochiladi.
                  Guruh tayinlanmasa, o'qituvchi hech narsa ko'ra olmaydi. */}
              {m.status === "ACTIVE" && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Users size={12} className="text-gray-500" />
                    <span className="text-[11px] text-gray-500">{t("school.assignedGroup")}</span>
                  </div>
                  <select
                    value={m.groupId ?? ""}
                    onChange={(e) =>
                      handleAssignGroup(m.id, e.target.value === "" ? null : Number(e.target.value))
                    }
                    disabled={busy === m.id}
                    className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-white/25 disabled:opacity-50"
                  >
                    <option value="">{t("school.noGroupOption")}</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  {m.groupId == null && (
                    <p className="text-amber-400/80 text-[10px] mt-1.5 leading-relaxed">
                      {t("school.noGroupWarning")}
                    </p>
                  )}
                </div>
              )}

              {m.status !== "REMOVED" && (
                <div className="flex gap-2">
                  {m.status === "SUSPENDED" ? (
                    <button
                      onClick={() => handleReactivate(m.id)}
                      disabled={busy === m.id}
                      className="flex-1 rounded-xl py-2 text-xs font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <UserCheck size={13} /> {t("school.reactivate")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspend(m.id)}
                      disabled={busy === m.id}
                      className="flex-1 rounded-xl py-2 text-xs font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <UserX size={13} /> {t("school.suspend")}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(m.id)}
                    disabled={busy === m.id}
                    className="flex-1 rounded-xl py-2 text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 disabled:opacity-50"
                  >
                    {t("school.remove")}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-5 pb-8">
          <div className="w-full max-w-sm rounded-3xl bg-[#161B2E] border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-base">{t("school.addTeacher")}</p>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setSelectedUser(null);
                  setError("");
                }}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X size={16} color="#E5E7EB" />
              </button>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              {t("school.addTeacherHintSearch")}
            </p>
            <UserSearchPicker
              schoolId={schoolId}
              selectedUser={selectedUser}
              onSelect={(user) => {
                setSelectedUser(user);
                setError("");
              }}
              autoFocus
            />
            {selectedUser && (
              <button
                onClick={() => setSelectedUser(null)}
                className="mt-2 text-xs text-gray-400 underline"
              >
                {t("school.changeSelection")}
              </button>
            )}
            {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
            <button
              onClick={handleAdd}
              disabled={busy === "add" || !selectedUser}
              className="w-full rounded-2xl py-3 font-bold text-sm text-white disabled:opacity-50 mt-4"
              style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
            >
              {busy === "add" ? t("school.adding") : t("school.addButton")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
