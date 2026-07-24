import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Users,
  TrendingDown,
  TrendingUp,
  ClipboardList,
  Trophy,
  Plus,
  Activity,
  ChevronRight,
} from "lucide-react";
import { api } from "../../api";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";
import CreateHomeworkSheet from "./CreateHomeworkSheet";
import StudentProfileScreen from "./StudentProfileScreen";

function StatBox({ icon: Icon, value, label, color }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-center">
      <Icon size={15} color={color || "#9CA3AF"} className="mx-auto mb-1.5" />
      <p className="font-extrabold text-sm text-white">{value}</p>
      <p className="text-gray-500 text-[10px] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function StudentRow({ student, onOpen }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => onOpen?.(student.membershipId)}
      className="w-full text-left flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
        {student.avatarUrl ? (
          <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-gray-400">
            {student.name?.[0]?.toUpperCase() || "?"}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white truncate">{student.name}</p>
        <p className="text-gray-500 text-[11px] mt-0.5">
          {t("school.readiness")}: {student.examReadiness}% · {student.accuracyPct}%
        </p>
      </div>
      {!student.isActiveRecently && (
        <span className="text-[10px] text-gray-600 shrink-0">{t("school.inactive")}</span>
      )}
      <ChevronRight size={16} className="text-gray-600 shrink-0" />
    </button>
  );
}

/** O'qituvchi dashboardi — o'z guruhi haqida hammasi. */
export default function TeacherDashboard({ schoolId, groupId, onBack, onOpenLeaderboard }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateHomework, setShowCreateHomework] = useState(false);
  const [openStudentId, setOpenStudentId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, hw] = await Promise.all([
        api.schoolTeacherDashboard(schoolId, groupId),
        api.schoolGroupHomework(schoolId, groupId),
      ]);
      setData(dashboard);
      setHomework(hw.homework || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, groupId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-[#0F1424] min-h-full">
        <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-[#0F1424] min-h-full px-5 tp-safe-top text-white">
        <p className="text-red-400 text-sm text-center py-10">{error}</p>
      </div>
    );
  }

  // Talaba profili ochilganda uni to'liq ekran sifatida ko'rsatamiz.
  // Alohida route qo'shilmadi — dashboard state'i yetarli va orqaga
  // qaytganda ro'yxat qayta yuklanmaydi (tezroq).
  if (openStudentId != null) {
    return (
      <div className="flex-1 overflow-y-auto tp-safe-top bg-[#0F1424] min-h-full text-white animate-slide-in">
        <StudentProfileScreen
          schoolId={schoolId}
          membershipId={openStudentId}
          onBack={() => setOpenStudentId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold leading-none">{data.group.name}</h1>
          <p className="text-gray-400 text-xs mt-1">
            {t("school.studentsCount", { count: data.studentCount })}
          </p>
        </div>
      </div>

      {/* Kunlik ko'rsatkichlar */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <StatBox icon={Users} value={data.studentCount} label={t("school.students")} />
        <StatBox
          icon={Activity}
          value={data.activeCount}
          label={t("school.activeThisWeek")}
          color="#34D399"
        />
        <StatBox
          icon={ClipboardList}
          value={data.homeworkDueToday}
          label={t("school.dueToday")}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <StatBox
          icon={TrendingUp}
          value={`${data.avgReadiness}%`}
          label={t("school.avgReadiness")}
          color={ACCENT_FROM}
        />
        <StatBox
          icon={Trophy}
          value={data.examsToday}
          label={t("school.examsToday")}
          color="#F5C542"
        />
      </div>

      {/* Tezkor havolalar */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setShowCreateHomework(true)}
          className="rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          <Plus size={16} />
          {t("school.newHomework")}
        </button>
        <button
          onClick={onOpenLeaderboard}
          className="rounded-2xl py-3.5 font-bold text-sm border border-white/10 bg-white/[0.04] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Trophy size={16} color="#F5C542" />
          {t("school.leaderboard")}
        </button>
      </div>

      {/* Kuchsiz talabalar */}
      {data.weakStudents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={15} color="#F87171" />
            <p className="font-bold text-sm">{t("school.weakStudents")}</p>
          </div>
          <div className="space-y-2">
            {data.weakStudents.map((s) => (
              <StudentRow key={s.membershipId} student={s} onOpen={setOpenStudentId} />
            ))}
          </div>
        </div>
      )}

      {/* Kuchli talabalar */}
      {data.strongStudents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} color="#34D399" />
            <p className="font-bold text-sm">{t("school.strongStudents")}</p>
          </div>
          <div className="space-y-2">
            {data.strongStudents.map((s) => (
              <StudentRow key={s.membershipId} student={s} onOpen={setOpenStudentId} />
            ))}
          </div>
        </div>
      )}

      {/* Uy vazifalari */}
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList size={15} color="#9CA3AF" />
        <p className="font-bold text-sm">{t("school.groupHomeworks")}</p>
      </div>

      {homework.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6">{t("school.noHomeworkYet")}</p>
      )}

      <div className="space-y-2.5">
        {homework.map((hw) => (
          <div
            key={hw.id}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold text-sm text-white leading-snug flex-1 pr-2">
                {hw.title}
              </p>
              <span className="text-[10px] text-gray-500 shrink-0">
                {new Date(hw.deadline).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              <span className="text-emerald-400 font-semibold">
                {hw.stats.completed} {t("school.homeworkStatus.COMPLETED").toLowerCase()}
              </span>
              {hw.stats.late > 0 && (
                <span className="text-amber-400 font-semibold">
                  {hw.stats.late} {t("school.homeworkStatus.LATE").toLowerCase()}
                </span>
              )}
              <span className="ml-auto">
                {hw.stats.completed + hw.stats.late}/{hw.stats.total}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showCreateHomework && (
        <CreateHomeworkSheet
          schoolId={schoolId}
          groupId={groupId}
          onClose={() => setShowCreateHomework(false)}
          onCreated={() => {
            setShowCreateHomework(false);
            load();
          }}
        />
      )}
    </div>
  );
}
