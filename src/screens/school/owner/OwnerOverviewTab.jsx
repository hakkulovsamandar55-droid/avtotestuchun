import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, GraduationCap, Layers, TrendingUp, ClipboardCheck, Edit2, Check } from "lucide-react";
import { api } from "../../../api";

function StatBox({ icon: Icon, value, label, color }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-center">
      <Icon size={15} color={color || "#9CA3AF"} className="mx-auto mb-1.5" />
      <p className="font-extrabold text-sm text-white">{value}</p>
      <p className="text-gray-500 text-[10px] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

/** Maktab umumiy ko'rsatkichlari + profil tahrirlash (nom, manzil, telefon, rang). */
export default function OwnerOverviewTab({ schoolId, school, onSchoolUpdated }) {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: school.name,
    address: school.address || "",
    phone: school.phone || "",
    brandColor: school.brandColor || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .schoolAnalytics(schoolId)
      .then((res) => {
        if (!cancelled) setAnalytics(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await api.schoolUpdate(schoolId, form);
      onSchoolUpdated(res.school);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-4">
      {loading && (
        <div className="flex justify-center py-8">
          <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {analytics && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <StatBox icon={GraduationCap} value={analytics.teacherCount} label={t("school.teachers")} />
            <StatBox icon={Users} value={analytics.studentCount} label={t("school.students")} />
            <StatBox icon={Layers} value={analytics.groupCount} label={t("school.groups")} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <StatBox
              icon={TrendingUp}
              value={`${analytics.avgReadiness}%`}
              label={t("school.avgReadiness")}
              color="var(--accent-from)"
            />
            <StatBox
              icon={ClipboardCheck}
              value={`${analytics.homeworkCompletionPct}%`}
              label={t("school.hwCompletion")}
              color="#34D399"
            />
          </div>

          {analytics.teacherPerformance.length > 0 && (
            <div className="mb-6">
              <p className="font-bold text-sm mb-3">{t("school.teacherPerformance")}</p>
              <div className="space-y-2">
                {analytics.teacherPerformance.map((tp) => (
                  <div
                    key={tp.membershipId}
                    className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{tp.name}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        {t("school.studentsCount", { count: tp.studentCount })}
                      </p>
                    </div>
                    <span className="font-extrabold text-sm shrink-0">{tp.avgReadiness}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Profil */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-sm">{t("school.profile")}</p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400"
          >
            <Edit2 size={12} /> {t("school.edit")}
          </button>
        )}
      </div>

      {!editing ? (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2 text-sm">
          <p><span className="text-gray-500">{t("school.nameLabel")}:</span> {school.name}</p>
          <p><span className="text-gray-500">{t("school.addressLabel")}:</span> {school.address || "—"}</p>
          <p><span className="text-gray-500">{t("school.phoneLabel")}:</span> {school.phone || "—"}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
              {t("school.nameLabel")}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
              {t("school.addressLabel")}
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
              {t("school.phoneLabel")}
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 rounded-xl py-2.5 font-bold text-sm text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
            >
              <Check size={14} /> {t("school.save")}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 rounded-xl py-2.5 font-semibold text-sm text-gray-400 border border-white/10"
            >
              {t("officialExam.back")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
