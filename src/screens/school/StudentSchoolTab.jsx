import React, { useCallback, useEffect, useState } from "react";
import SchoolChatListScreen from "./SchoolChatListScreen";
import { useTranslation } from "react-i18next";
import {
  School,
  MessageCircle,
  ClipboardList,
  Trophy,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import { api } from "../../api";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";

const STATUS_META = {
  PENDING: { icon: Clock, color: "#9CA3AF", bg: "bg-white/[0.04]", border: "border-white/10" },
  COMPLETED: {
    icon: CheckCircle2,
    color: "#34D399",
    bg: "bg-emerald-500/[0.06]",
    border: "border-emerald-500/25",
  },
  LATE: {
    icon: AlertCircle,
    color: "#FBBF24",
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-500/25",
  },
  MISSED: {
    icon: XCircle,
    color: "#F87171",
    bg: "bg-red-500/[0.06]",
    border: "border-red-500/25",
  },
};

const HOMEWORK_TYPE_ICON = {
  PRACTICE: "📝",
  OFFICIAL_EXAM: "📋",
  TICKETS: "🎫",
  SIGNS: "🚸",
};

function HomeworkRow({ submission }) {
  const { t } = useTranslation();
  const meta = STATUS_META[submission.status];
  const Icon = meta.icon;
  const hw = submission.homework;

  return (
    <div className={`rounded-2xl border ${meta.bg} ${meta.border} p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0">{HOMEWORK_TYPE_ICON[hw.type] || "📌"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white leading-snug">{hw.title}</p>
          <p className="text-gray-500 text-[11px] mt-1">
            {t("school.deadline")}: {new Date(hw.deadline).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Icon size={14} color={meta.color} />
          <span className="text-[11px] font-bold" style={{ color: meta.color }}>
            {t(`school.homeworkStatus.${submission.status}`)}
          </span>
        </div>
      </div>
      {submission.score != null && (
        <p className="text-gray-400 text-xs mt-2">
          {t("school.score")}: <span className="font-bold text-white">{submission.score}%</span>
        </p>
      )}
    </div>
  );
}

/** Talabaning maktab bo'limi — a'zo bo'lsa shu ko'rinadi. */
export default function StudentSchoolTab({ onBack, onOpenJoin, onOpenLeaderboard }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [me, hw] = await Promise.all([api.schoolMe(), api.schoolMyHomework()]);
      setData(me);
      setHomework(hw.homework || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnread = useCallback(async (schoolId) => {
    if (!schoolId) return;
    try {
      const res = await api.schoolChatUnread(schoolId);
      setUnread(res.unread || 0);
    } catch {
      /* o'qilmaganlar soni muhim emas */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (data?.membership?.schoolId) loadUnread(data.membership.schoolId);
  }, [data, loadUnread]);

  async function handleLeave() {
    setLeaving(true);
    try {
      await api.schoolLeave();
      setConfirmLeave(false);
      onOpenJoin();
    } catch (err) {
      setError(err.message);
      setLeaving(false);
    }
  }

  // Talaba o'z o'qituvchisi bilan yozisha oladi — bu chat tizimining
  // ikkinchi yarmi. O'qituvchi tomonidan TeacherDashboard'da ochiladi.
  if (showChats && data?.membership) {
    return (
      <SchoolChatListScreen
        schoolId={data.membership.schoolId}
        myMembershipId={data.membership.id}
        onBack={() => {
          setShowChats(false);
          loadUnread(data.membership.schoolId);
        }}
      />
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
        <h1 className="text-lg font-extrabold">{t("school.title")}</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {!loading && error && <p className="text-red-400 text-sm text-center py-10">{error}</p>}

      {!loading && !error && !data?.membership && (
        <div className="flex flex-col items-center text-center px-2 py-8">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            <School size={28} color="white" />
          </div>
          <p className="font-bold text-white text-base mb-1.5">{t("school.notMemberTitle")}</p>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {t("school.notMemberSubtitle")}
          </p>
          <button
            onClick={onOpenJoin}
            className="rounded-2xl px-6 py-3 font-bold text-white text-sm"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {t("school.joinButton")}
          </button>
        </div>
      )}

      {!loading && !error && data?.membership && (
        <StudentSchoolContent
          data={data}
          homework={homework}
          unread={unread}
          onOpenChats={() => setShowChats(true)}
          onOpenLeaderboard={onOpenLeaderboard}
          onRequestLeave={() => setConfirmLeave(true)}
        />
      )}

      {confirmLeave && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-5 pb-8">
          <div className="w-full max-w-sm rounded-3xl bg-[#161B2E] border border-white/10 p-5">
            <p className="font-bold text-base mb-2">{t("school.leaveConfirmTitle")}</p>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              {t("school.leaveConfirmBody")}
            </p>
            <div className="space-y-2.5">
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="w-full rounded-2xl py-3.5 font-bold text-white text-sm bg-red-500/80 disabled:opacity-50"
              >
                {t("school.leaveConfirmYes")}
              </button>
              <button
                onClick={() => setConfirmLeave(false)}
                className="w-full rounded-2xl py-3 font-semibold text-sm text-gray-400 border border-white/10"
              >
                {t("officialExam.back")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Maktab + guruh + homework kontenti — a'zo bo'lgan talaba uchun. */
function StudentSchoolContent({
  data,
  homework,
  unread,
  onOpenChats,
  onOpenLeaderboard,
  onRequestLeave,
}) {
  const { t } = useTranslation();
  const { school, group } = data;
  const pending = homework.filter((h) => h.status === "PENDING");
  const others = homework.filter((h) => h.status !== "PENDING");

  return (
    <div>
      {/* Maktab kartasi */}
      <div
        className="rounded-3xl p-5 text-white mb-5"
        style={{
          background: school.brandColor
            ? `linear-gradient(135deg, ${school.brandColor}, ${school.brandColor}CC)`
            : `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <School size={22} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold leading-tight truncate">{school.name}</p>
            {group && <p className="text-white/75 text-xs mt-0.5">{group.name}</p>}
          </div>
        </div>
      </div>

      {/* Tezkor havolalar */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => onOpenLeaderboard(school.id, group?.id)}
          disabled={!group}
          className="rounded-2xl bg-white/[0.04] border border-white/10 py-3.5 flex flex-col items-center gap-1.5 disabled:opacity-40"
        >
          <Trophy size={17} color="#F5C542" />
          <span className="text-xs font-semibold text-gray-300">
            {t("school.groupLeaderboard")}
          </span>
        </button>
        <button
          onClick={onOpenChats}
          className="relative rounded-2xl bg-white/[0.04] border border-white/10 py-3.5 flex flex-col items-center gap-1.5"
        >
          <MessageCircle size={17} color="#9CA3AF" />
          <span className="text-xs font-semibold text-gray-300">{t("school.messages")}</span>
          {unread > 0 && (
            <span
              className="absolute top-2 right-3 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
              }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>

      {/* Uy vazifalari */}
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList size={16} color="#9CA3AF" />
        <p className="font-bold text-white text-sm">{t("school.myHomework")}</p>
      </div>

      {homework.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">{t("school.noHomework")}</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-2.5 mb-4">
          {pending.map((s) => (
            <HomeworkRow key={s.id} submission={s} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-2.5">
          {others.map((s) => (
            <HomeworkRow key={s.id} submission={s} />
          ))}
        </div>
      )}

      {/* Chiqish */}
      <button
        onClick={onRequestLeave}
        className="w-full mt-6 rounded-2xl py-3 font-semibold text-sm text-red-400/80 flex items-center justify-center gap-2"
      >
        <LogOut size={14} />
        {t("school.leaveSchool")}
      </button>
    </div>
  );
}
