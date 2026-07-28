import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Play,
  Layers,
  TrafficCone,
  Swords,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  Bookmark,
  Shuffle,
  ClipboardCheck,
  Flame,
  NotebookText,
} from "lucide-react";
import { api } from "../api";

/**
 * BOSH SAHIFA — frosted glass uslubi.
 *
 * TUZILMA (yuqoridan pastga, muhimlik tartibida):
 *   1) Salomlashish + ketma-ket kunlar
 *   2) HAFTALIK RITM — qaysi kun ishlangani. Bo'sh kunlar ko'zga tashlanadi,
 *      bu qaytib kelishga undaydi. Ostida uchta asosiy ko'rsatkich.
 *   3) Rasmiy imtihon — yagona to'q rangli tugma, eng muhim harakat
 *   4) 2 ustunli kafellar — barcha bo'limlarga tez kirish
 *
 * NIMA UCHUN SHUNDAY: avvalgi variantlar (gradient hero + 2x2 grid, keyin
 * "yo'l" metaforasi) yoki shablon edi, yoki mazmundan uzoq. Bu tuzilma
 * foydalanuvchining haqiqiy savoliga javob beradi: "qanchalik tayyorman va
 * bugun nima qildim?"
 *
 * Barcha panellar `bg-card` klassini ishlatadi — shisha ko'rinishi
 * index.css da bir marta berilgan, shuning uchun bu yerda faqat tuzilma.
 */
export default function HomeTab({
  user,
  onOpenTickets,
  onOpenSigns,
  onOpenExam,
  onOpenOfficialExam,
  onOpenStats,
  onOpenDuel,
  onOpenSchool,
  onOpenTopics,
  onOpenMistakes,
  onOpenSaved,
  onOpenTricky,
  onOpenCheatSheet,
}) {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .getMyStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const s = stats || {};
  const readiness = clampPct(s.examReadiness);
  const passChance = clampPct(s.passChance);
  const learned = clampPct(s.learnedQuestionsPct);
  const streak = s.streakDays || 0;
  const weekly = s.weeklyActivity || [];

  const tiles = [
    {
      key: "practice",
      icon: Play,
      title: t("home.dailyPractice"),
      sub: t("home.chooseQuestionCount"),
      onClick: onOpenExam,
    },
    {
      key: "tickets",
      icon: Layers,
      title: t("home.tickets"),
      sub: `${learned}%`,
      onClick: onOpenTickets,
    },
    {
      key: "signs",
      icon: TrafficCone,
      title: t("home.roadSigns"),
      sub: t("home.roadSignsSubtitle"),
      onClick: onOpenSigns,
    },
    {
      key: "topics",
      icon: BookOpen,
      title: t("home.topicTests"),
      sub: t("home.topicTestsSubtitle"),
      onClick: onOpenTopics,
    },
    {
      key: "mistakes",
      icon: AlertTriangle,
      title: t("home.mistakes"),
      sub: t("home.mistakesSubtitle"),
      onClick: onOpenMistakes,
    },
    {
      key: "saved",
      icon: Bookmark,
      title: t("home.savedQuestions"),
      sub: t("home.savedQuestionsSubtitle"),
      onClick: onOpenSaved,
    },
    {
      key: "tricky",
      icon: Shuffle,
      title: t("home.trickyTests"),
      sub: t("home.trickyTestsSubtitle"),
      onClick: onOpenTricky,
    },
    {
      key: "cheatSheet",
      icon: NotebookText,
      title: t("home.cheatSheet"),
      sub: t("home.cheatSheetSubtitle"),
      onClick: onOpenCheatSheet,
    },
    {
      key: "duel",
      icon: Swords,
      title: t("home.duel"),
      sub: t("home.duelSubtitle"),
      onClick: onOpenDuel,
    },
    {
      key: "school",
      icon: GraduationCap,
      title: t("home.school"),
      sub: t("home.schoolSubtitle"),
      onClick: onOpenSchool,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-4 animate-fade-in">
      {/* Sarlavha */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {t("home.welcome")}
          </p>
          <h1
            className="text-[23px] font-extrabold truncate tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {user?.name || t("home.guest")}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-card border border-card-border px-3 py-2 shrink-0">
          <Flame size={13} color="#FDBA74" />
          <span className="text-xs font-bold" style={{ color: "#FDBA74" }}>
            {t("home.streakDays", { days: streak })}
          </span>
        </div>
      </div>

      {/* HAFTALIK RITM + ko'rsatkichlar */}
      <button
        onClick={onOpenStats}
        className="w-full text-left mt-5 rounded-[26px] bg-card border border-card-border p-[19px] active:scale-[0.995] transition-transform"
      >
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.11em]"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("home.thisWeek")}
          </span>
          <span
            className="text-[11px] font-extrabold"
            style={{ color: "var(--accent-from)" }}
          >
            {t("home.daysOfSeven", { count: weekly.filter((d) => d.active).length })}
          </span>
        </div>

        <WeekStrip days={weekly} t={t} />

        <div
          className="flex gap-2.5 mt-[17px] pt-[15px] border-t"
          style={{ borderColor: "var(--border-card)" }}
        >
          <Metric value={`${readiness}%`} label={t("home.readinessShort")} />
          <Metric value={`${passChance}%`} label={t("home.passChanceShort")} />
          <Metric value={formatCount(s.totalAnswered)} label={t("home.totalQuestions")} />
        </div>
      </button>

      {/* RASMIY IMTIHON — yagona to'q rangli harakat */}
      <button
        onClick={onOpenOfficialExam}
        className="w-full mt-[13px] rounded-[19px] py-4 px-4 font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        style={{
          background: "linear-gradient(135deg, var(--exam-from), var(--exam-to))",
          boxShadow:
            "0 14px 34px color-mix(in srgb, var(--exam-from) 42%, transparent), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        <ClipboardCheck size={17} />
        {t("home.startOfficialExam")}
      </button>

      {/* KAFELLAR */}
      <div className="grid grid-cols-2 gap-[11px] mt-[13px]">
        {tiles.map((tile) => (
          <Tile key={tile.key} {...tile} />
        ))}
      </div>
    </div>
  );
}

/**
 * Haftalik ritm chizig'i.
 *
 * Backend `weeklyActivity` bermasa ham yiqilmasligi kerak — bo'sh massivda
 * hafta kunlari faolsiz holatda ko'rsatiladi.
 */
function WeekStrip({ days, t }) {
  const labels = t("home.weekdayLetters", { returnObjects: true });
  const letters = Array.isArray(labels) ? labels : ["D", "S", "C", "P", "J", "S", "Y"];

  // Har doim 7 kun — ma'lumot yetmasa bo'sh kun sifatida to'ldiramiz
  const cells = Array.from({ length: 7 }, (_, i) => days[i] || { active: false, isToday: false });

  return (
    <div className="flex gap-1.5">
      {cells.map((d, i) => {
        const state = d.isToday ? "today" : d.active ? "done" : "empty";
        return (
          <div key={i} className="flex-1 text-center">
            <div
              className="h-[35px] rounded-[10px] flex items-end justify-center pb-[5px]"
              style={
                state === "today"
                  ? {
                      background:
                        "linear-gradient(180deg, var(--accent-from), var(--accent-to))",
                      boxShadow:
                        "0 6px 18px color-mix(in srgb, var(--accent-from) 45%, transparent), inset 0 1px 0 rgba(255,255,255,0.45)",
                    }
                  : state === "done"
                    ? {
                        background:
                          "color-mix(in srgb, var(--accent-from) 18%, transparent)",
                        boxShadow: "inset 0 1px 0 var(--glass-hi)",
                      }
                    : { background: "var(--track)" }
              }
            >
              {state !== "empty" && (
                <span
                  className="w-[5px] h-[5px] rounded-full block"
                  style={{
                    background: state === "today" ? "#FFFFFF" : "var(--accent-from)",
                  }}
                />
              )}
            </div>
            <div
              className="text-[9.5px] mt-[5px]"
              style={{
                color: state === "today" ? "var(--accent-from)" : "var(--text-secondary)",
                fontWeight: state === "today" ? 800 : 500,
              }}
            >
              {letters[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="flex-1 min-w-0">
      <div
        className="text-[15.5px] font-extrabold tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </div>
      <div
        className="text-[9.5px] mt-0.5 truncate"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </div>
    </div>
  );
}

function Tile({ icon: Icon, title, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-[19px] bg-card border border-card-border p-[15px] text-left active:scale-[0.985] transition-transform"
    >
      <Icon size={18} color="var(--accent-from)" />
      <div
        className="text-[12.5px] font-bold mt-2.5"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
        {sub}
      </div>
    </button>
  );
}

function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(Math.round(n), 0), 100);
}

/** 1240 -> "1 240" — uzun raqamlar kafelga sig'ishi uchun */
function formatCount(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "0";
  return n.toLocaleString("ru-RU").replace(/\u00A0/g, " ");
}
