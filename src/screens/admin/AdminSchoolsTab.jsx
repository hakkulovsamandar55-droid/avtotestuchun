import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { School, Users, GraduationCap, Trophy, Check, Ban, Trash2, X, Plus } from "lucide-react";
import { api } from "../../api";

const STATUS_META = {
  PENDING: { color: "#FBBF24", bg: "bg-amber-50", border: "border-amber-200" },
  ACTIVE: { color: "#059669", bg: "bg-emerald-50", border: "border-emerald-200" },
  DISABLED: { color: "#DC2626", bg: "bg-red-50", border: "border-red-200" },
};

function Metric({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl bg-card border border-card-border shadow-sm px-3 py-3 text-center">
      <Icon size={15} color="var(--icon-muted)" className="mx-auto mb-1.5" />
      <p className="font-extrabold text-text-main text-sm">{value}</p>
      <p className="text-text-muted text-[10px] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function SchoolCard({ school, onApprove, onDisable, onDelete, busy }) {
  const { t } = useTranslation();
  const meta = STATUS_META[school.status];
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-2xl bg-card border border-card-border shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-main text-sm truncate">{school.name}</p>
          <p className="text-text-muted text-[11px] mt-0.5">
            {t("adminSchool.teacherCount", { count: school.teacherCount })} ·{" "}
            {t("adminSchool.studentCount", { count: school.studentCount })}
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full border ${meta.bg} ${meta.border} shrink-0`}
          style={{ color: meta.color }}
        >
          {t(`adminSchool.status.${school.status}`)}
        </span>
      </div>

      <div className="flex gap-2">
        {school.status === "PENDING" && (
          <button
            onClick={() => onApprove(school.id)}
            disabled={busy === school.id}
            className="flex-1 rounded-xl py-2 text-xs font-semibold text-emerald-700 border border-emerald-300 bg-emerald-50 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check size={13} /> {t("adminSchool.approve")}
          </button>
        )}
        {school.status === "ACTIVE" && (
          <button
            onClick={() => onDisable(school.id)}
            disabled={busy === school.id}
            className="flex-1 rounded-xl py-2 text-xs font-semibold text-amber-700 border border-amber-300 bg-amber-50 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Ban size={13} /> {t("adminSchool.disable")}
          </button>
        )}
        {school.status === "DISABLED" && (
          <button
            onClick={() => onApprove(school.id)}
            disabled={busy === school.id}
            className="flex-1 rounded-xl py-2 text-xs font-semibold text-emerald-700 border border-emerald-300 bg-emerald-50 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check size={13} /> {t("adminSchool.reenable")}
          </button>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={busy === school.id}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-red-600 border border-red-300 bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={13} />
          </button>
        ) : (
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => onDelete(school.id)}
              disabled={busy === school.id}
              className="flex-1 rounded-xl py-2 text-xs font-bold text-white bg-red-600 disabled:opacity-50"
            >
              {t("adminSchool.confirmDelete")}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-300"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** CEO uchun: barcha maktablar, platforma analitikasi, tasdiqlash/o'chirish. */
export default function AdminSchoolsTab() {
  const { t } = useTranslation();
  const [schools, setSchools] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOwnerId, setNewOwnerId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [schoolsRes, analyticsRes] = await Promise.all([
        api.schoolAdminList(filter),
        api.schoolAdminAnalytics(),
      ]);
      setSchools(schoolsRes.schools || []);
      setAnalytics(analyticsRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(schoolId) {
    setBusy(schoolId);
    try {
      await api.schoolAdminSetStatus(schoolId, "ACTIVE");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleDisable(schoolId) {
    setBusy(schoolId);
    try {
      await api.schoolAdminSetStatus(schoolId, "DISABLED");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(schoolId) {
    setBusy(schoolId);
    try {
      await api.schoolAdminDelete(schoolId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateSchool() {
    const ownerUserId = Number(newOwnerId);
    if (!newName.trim()) {
      setCreateError(t("adminSchool.nameRequired"));
      return;
    }
    if (!Number.isInteger(ownerUserId) || ownerUserId <= 0) {
      setCreateError(t("school.invalidUserId"));
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      await api.schoolAdminCreate({ name: newName.trim(), ownerUserId });
      setShowCreate(false);
      setNewName("");
      setNewOwnerId("");
      await load();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="pb-4">
      <button
        onClick={() => setShowCreate(true)}
        className="w-full mb-4 rounded-2xl py-3 font-bold text-sm text-white flex items-center justify-center gap-2 bg-gray-900"
      >
        <Plus size={16} />
        {t("adminSchool.newSchool")}
      </button>
      {analytics && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <Metric icon={School} value={analytics.totalSchools} label={t("adminSchool.totalSchools")} />
            <Metric icon={GraduationCap} value={analytics.totalTeachers} label={t("adminSchool.totalTeachers")} />
            <Metric icon={Users} value={analytics.totalStudents} label={t("adminSchool.totalStudents")} />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-5">
            <Metric icon={Check} value={analytics.activeSchools} label={t("adminSchool.active")} />
            <Metric icon={Ban} value={analytics.pendingSchools} label={t("adminSchool.pending")} />
            <Metric icon={Trash2} value={analytics.disabledSchools} label={t("adminSchool.disabled")} />
          </div>

          {analytics.schoolRankings.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={15} color="#F59E0B" />
                <p className="font-bold text-text-main text-sm">{t("adminSchool.rankings")}</p>
              </div>
              <div className="space-y-2">
                {analytics.schoolRankings.slice(0, 10).map((s, i) => (
                  <div
                    key={s.schoolId}
                    className="flex items-center gap-3 rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3"
                  >
                    <span className="w-6 text-center font-extrabold text-sm text-text-muted">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text-main truncate">{s.name}</p>
                      <p className="text-text-muted text-[11px] mt-0.5">
                        {t("adminSchool.studentCount", { count: s.studentCount })}
                      </p>
                    </div>
                    <span className="font-extrabold text-sm text-text-main">{s.avgReadiness}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {[null, "PENDING", "ACTIVE", "DISABLED"].map((status) => (
          <button
            key={status || "all"}
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === status
                ? "bg-gray-900 text-white"
                : "bg-card-soft text-text-secondary border border-card-border"
            }`}
          >
            {status ? t(`adminSchool.status.${status}`) : t("adminSchool.allStatuses")}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

      {loading && (
        <div className="flex justify-center py-8">
          <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
        </div>
      )}

      {!loading && schools.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8">{t("adminSchool.noSchools")}</p>
      )}

      <div className="space-y-2.5">
        {schools.map((school) => (
          <SchoolCard
            key={school.id}
            school={school}
            onApprove={handleApprove}
            onDisable={handleDisable}
            onDelete={handleDelete}
            busy={busy}
          />
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-5 pb-8">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#161B2E] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-base text-text-main">{t("adminSchool.newSchool")}</p>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-full bg-card-soft flex items-center justify-center"
              >
                <X size={16} color="var(--icon-muted)" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">
              {t("school.nameLabel")}
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-2xl bg-card-soft border border-card-border px-4 py-3 text-sm text-text-main mb-4 focus:outline-none"
            />

            <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">
              {t("adminSchool.ownerUserId")}
            </label>
            <input
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              placeholder={t("school.userIdPlaceholder")}
              inputMode="numeric"
              className="w-full rounded-2xl bg-card-soft border border-card-border px-4 py-3 text-sm text-text-main placeholder:text-text-muted mb-2 focus:outline-none"
            />
            <p className="text-text-muted text-[11px] mb-4 leading-relaxed">
              {t("adminSchool.ownerHint")}
            </p>

            {createError && <p className="text-red-500 text-xs mb-3">{createError}</p>}

            <button
              onClick={handleCreateSchool}
              disabled={creating}
              className="w-full rounded-2xl py-3 font-bold text-sm text-white bg-gray-900 disabled:opacity-50"
            >
              {creating ? t("school.creating") : t("school.createButton")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
