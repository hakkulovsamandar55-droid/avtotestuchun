import React from "react";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Play,
  Layers,
  Bookmark,
  ListChecks,
  ChevronRight,
  Bell,
  Trophy,
  Flame,
  TrafficCone,
} from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../theme";

// 3a-EKRAN: "O'rganish" bo'limi — bosh sahifa
export default function HomeTab({ onOpenTickets, onOpenSigns, onOpenExam, onOpenStats }) {
  const { t } = useTranslation();

  const menuItems = [
    {
      icon: Layers,
      title: t("home.tickets"),
      subtitle: t("home.ticketsSubtitle"),
      bg: "#EEEBFF",
      fg: ACCENT_FROM,
      onClick: onOpenTickets,
    },
    {
      icon: TrafficCone,
      title: t("home.roadSigns"),
      subtitle: t("home.roadSignsSubtitle"),
      bg: "#FFE8E8",
      fg: "#E4231C",
      onClick: onOpenSigns,
    },
    {
      icon: Bookmark,
      title: t("home.savedQuestions"),
      subtitle: t("home.savedQuestionsSubtitle"),
      bg: "#FFF3DC",
      fg: "#F59E0B",
    },
    {
      icon: ListChecks,
      title: t("home.topicTests"),
      subtitle: t("home.topicTestsSubtitle"),
      bg: "#FFE8DC",
      fg: "#FB7A3C",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm">{t("home.welcome")}</p>
          <h1 className="text-2xl font-extrabold text-text-main">
            Samandar 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-card-soft flex items-center justify-center">
            <Trophy size={16} color="#D97706" />
          </div>
          <div className="w-9 h-9 rounded-full bg-card-soft flex items-center justify-center">
            <Bell size={16} color="var(--icon-muted)" />
          </div>
          <div className="flex items-center gap-1 rounded-full bg-card-soft px-3 py-2">
            <Flame size={14} color="#F97316" />
            <span className="text-xs font-semibold text-orange-500">
              {t("home.streakDays", { days: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* AI ko'rsatgich card */}
      <button
        onClick={onOpenStats}
        className="w-full text-left mt-6 rounded-3xl p-5 text-white relative overflow-hidden active:scale-[0.98] transition-transform"
        style={{
          background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase text-white/80">
          <Zap size={13} /> {t("home.aiHint")}
        </div>
        <p className="mt-1.5 text-sm font-semibold">
          {t("home.readiness", { percent: 0 })}
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            ["10%", t("home.passChance")],
            ["0%", t("home.learningProgress")],
            ["0%", t("home.examPassLevel")],
            ["0%", t("home.ready")],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="font-bold text-sm">{val}</p>
              <p className="text-[9px] text-white/70 leading-tight mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </button>

      {/* Two action cards */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <div
          className="rounded-3xl p-5 text-white flex flex-col justify-between h-36"
          style={{ backgroundColor: ACCENT_FROM }}
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Zap size={16} />
          </div>
          <div>
            <p className="font-bold leading-tight">
              {t("home.dailyPractice")}
            </p>
            <p className="text-white/70 text-xs mt-0.5">
              {t("home.chooseQuestionCount")}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenExam}
          className="rounded-3xl p-5 bg-card border border-card-border flex flex-col justify-between h-36 shadow-sm text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-card-soft flex items-center justify-center">
            <Play size={15} color="#F59E0B" fill="#F59E0B" />
          </div>
          <div>
            <p className="font-bold text-text-main leading-tight">
              {t("home.examMode")}
            </p>
            <p className="text-text-muted text-xs mt-0.5">
              {t("home.examModeSubtitle")}
            </p>
          </div>
        </button>
      </div>

      {/* Menu list */}
      <div className="mt-5 space-y-3">
        {menuItems.map(({ icon: Icon, title, subtitle, bg, fg, onClick }) => (
          <button
            key={title}
            onClick={onClick}
            className="w-full flex items-center gap-3 rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5 text-left"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: bg }}
            >
              <Icon size={18} color={fg} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-main text-sm">{title}</p>
              <p className="text-text-muted text-xs truncate">{subtitle}</p>
            </div>
            <ChevronRight size={18} color="var(--chevron)" />
          </button>
        ))}
      </div>
    </div>
  );
}
