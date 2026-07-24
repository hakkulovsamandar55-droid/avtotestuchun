import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Flame,
  Target,
  CalendarCheck,
  ClipboardList,
  AlertCircle,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { api } from "../../api";

/**
 * O'qituvchi uchun talabaning batafsil profili.
 *
 * Ko'rsatiladigan ma'lumot MAVJUD jadvallardan hisoblanadi (Attempt,
 * ExamAttempt, HomeworkSubmission) — yangi migratsiya talab qilinmaydi.
 *
 * ESLATMA: "test ishlash vaqti" hozircha yo'q, chunki Attempt jadvalida
 * durationSec maydoni saqlanmaydi. Rasmiy imtihonlarda esa bor — shuning
 * uchun imtihonlar bo'limida vaqt ko'rsatiladi.
 */
export default function StudentProfileScreen({ schoolId, membershipId, onBack, onOpenChat }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(14);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.schoolStudentProfile(schoolId, membershipId, days);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, membershipId, days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-gray-500 animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="px-5 py-6">
        <BackButton onBack={onBack} label={t("school.back")} />
        <p className="text-red-400 text-sm mt-6">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { student, period, allTime, daily, recentExams, recentMistakes, homework } = data;

  return (
    <div className="pb-8">
      <div className="px-5 pt-4">
        <BackButton onBack={onBack} label={t("school.back")} />
      </div>

      {/* Sarlavha */}
      <div className="px-5 mt-4 flex items-center gap-3">
        {student.avatarUrl ? (
          <img src={student.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {(student.name || "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-white font-bold text-lg truncate">{student.name}</p>
          {student.username && (
            <p className="text-gray-400 text-xs truncate">@{student.username}</p>
          )}
          <p className="text-gray-500 text-[11px] mt-0.5">
            {t("school.lastSeen")}: {formatRelative(student.lastOnlineAt, t)}
          </p>
        </div>
      </div>

      {/* Yozishuv tugmasi */}
      {onOpenChat && (
        <div className="px-5 mt-4">
          <button
            onClick={() => onOpenChat(membershipId)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
          >
            <MessageCircle size={16} />
            {t("school.writeMessage")}
          </button>
        </div>
      )}

      {/* Davr tanlash */}
      <div className="px-5 mt-5 flex gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              days === d ? "bg-white/15 text-white" : "bg-white/5 text-gray-400"
            }`}
          >
            {d} {t("school.daysShort")}
          </button>
        ))}
        {loading && <Loader2 size={14} className="text-gray-500 animate-spin self-center" />}
      </div>

      {/* Asosiy ko'rsatkichlar */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={<ClipboardList size={16} className="text-blue-400" />}
          label={t("school.testsInPeriod")}
          value={period.tests}
        />
        <StatCard
          icon={<Target size={16} className="text-emerald-400" />}
          label={t("school.accuracy")}
          value={period.accuracyPct == null ? "—" : `${period.accuracyPct}%`}
        />
        <StatCard
          icon={<CalendarCheck size={16} className="text-purple-400" />}
          label={t("school.activeDays")}
          value={`${period.activeDays}/${period.days}`}
        />
        <StatCard
          icon={<Flame size={16} className="text-orange-400" />}
          label={t("school.streak")}
          value={period.streak}
        />
      </div>

      {/* Kunlik faollik grafigi */}
      <Section title={t("school.dailyActivity")}>
        <DailyChart data={daily} t={t} />
        <p className="text-gray-500 text-[11px] mt-3">
          {t("school.answeredInPeriod", { count: period.questionsAnswered })} ·{" "}
          {t("school.allTimeTotal")}: {allTime.questionsAnswered}
        </p>
      </Section>

      {/* Oxirgi xatolar */}
      <Section title={t("school.recentMistakes")}>
        {recentMistakes.length === 0 ? (
          <EmptyNote text={t("school.noMistakesYet")} />
        ) : (
          <div className="space-y-2.5">
            {recentMistakes.map((m, i) => (
              <div key={`${m.questionId}-${i}`} className="rounded-xl bg-white/[0.04] p-3">
                <p className="text-white text-xs leading-relaxed">{m.text}</p>
                {m.chosenAnswer && (
                  <p className="text-red-400 text-[11px] mt-2">
                    {t("school.chose")}: {m.chosenAnswer}
                  </p>
                )}
                {m.correctAnswer && (
                  <p className="text-emerald-400 text-[11px] mt-0.5">
                    {t("school.correct")}: {m.correctAnswer}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Rasmiy imtihonlar */}
      <Section title={t("school.recentExams")}>
        {recentExams.length === 0 ? (
          <EmptyNote text={t("school.noExamsYet")} />
        ) : (
          <div className="space-y-2">
            {recentExams.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5"
              >
                <div>
                  <p className="text-white text-xs font-semibold">
                    {e.correctCount}/{(e.correctCount || 0) + (e.wrongCount || 0)} ·{" "}
                    {e.accuracyPct ?? 0}%
                  </p>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    {formatDate(e.finishedAt)}
                    {e.durationSec ? ` · ${Math.round(e.durationSec / 60)} ${t("school.min")}` : ""}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
                    e.passed
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {e.passed ? t("school.passed") : t("school.failed")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Topshiriqlar */}
      <Section title={t("school.homework")}>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MiniStat label={t("school.done")} value={homework.completed} color="#34D399" />
          <MiniStat label={t("school.pending")} value={homework.pending} color="#FBBF24" />
          <MiniStat label={t("school.expiredShort")} value={homework.expired} color="#F87171" />
        </div>
        {homework.recent.length === 0 && <EmptyNote text={t("school.noHomeworkYet")} />}
      </Section>
    </div>
  );
}

function BackButton({ onBack, label }) {
  return (
    <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 text-sm">
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="px-5 mt-6">
      <p className="text-white font-bold text-sm mb-3">{title}</p>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">{icon}</div>
      <p className="text-white text-xl font-bold leading-none">{value}</p>
      <p className="text-gray-500 text-[11px] mt-1.5">{label}</p>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-2 py-2.5 text-center">
      <p className="text-lg font-bold leading-none" style={{ color }}>
        {value}
      </p>
      <p className="text-gray-500 text-[10px] mt-1">{label}</p>
    </div>
  );
}

function EmptyNote({ text }) {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-xs py-3">
      <AlertCircle size={14} />
      {text}
    </div>
  );
}

/**
 * Oddiy ustunli grafik — tashqi kutubxonasiz.
 * Recharts bundle'ni og'irlashtiradi, bu yerda esa oddiy vizual yetarli.
 */
function DailyChart({ data, t }) {
  const max = Math.max(...data.map((d) => d.tests), 1);

  return (
    <div>
      <div className="flex items-end gap-[3px] h-24">
        {data.map((d) => {
          const heightPct = d.tests > 0 ? Math.max((d.tests / max) * 100, 8) : 3;
          return (
            <div key={d.date} className="flex-1 flex flex-col justify-end h-full group relative">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${heightPct}%`,
                  background:
                    d.tests > 0
                      ? "linear-gradient(180deg, var(--accent-from), var(--accent-to))"
                      : "rgba(255,255,255,0.06)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-gray-600 text-[10px]">{shortDate(data[0]?.date)}</span>
        <span className="text-gray-600 text-[10px]">{t("school.today")}</span>
      </div>
    </div>
  );
}

function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
}

function formatRelative(iso, t) {
  if (!iso) return t("school.never");
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return t("school.minsAgo", { count: Math.max(mins, 1) });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("school.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("school.daysAgo", { count: days });
}
