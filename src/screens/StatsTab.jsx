import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Zap, ListChecks, Trophy, Flame, Clock } from "lucide-react";
import { ACCENT_FROM } from "../theme";
import { api } from "../api";

function StatCard({ icon: Icon, iconBg, iconFg, value, label }) {
  return (
    <div className="rounded-3xl bg-card border border-card-border shadow-sm p-5">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={18} color={iconFg} />
      </div>
      <p className="text-2xl font-extrabold text-text-main">{value}</p>
      <p className="text-text-muted text-sm mt-0.5">{label}</p>
    </div>
  );
}

// 3b-EKRAN: "Statistika" bo'limi
export default function StatsTab() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .getMyStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const s = stats || {
    accuracy: 0,
    solved: 0,
    completedTickets: 0,
    streakDays: 0,
    examReadiness: 0,
    passChance: 0,
    learnedQuestionsPct: 0,
    masteryQualityPct: 0,
    examResultsPct: 0,
    studyPlan: null,
  };

  const readinessColor =
    s.examReadiness >= 70 ? "text-emerald-500" : s.examReadiness >= 40 ? "text-amber-500" : "text-red-500";
  const readinessBar =
    s.examReadiness >= 70 ? "bg-emerald-400" : s.examReadiness >= 40 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-4 animate-fade-in">
      <h1 className="text-xl font-extrabold text-text-main text-center mb-5">
        {t("stats.title")}
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Zap}
          iconBg="#EEEBFF"
          iconFg={ACCENT_FROM}
          value={`${s.accuracy}%`}
          label={t("stats.accuracy")}
        />
        <StatCard
          icon={Flame}
          iconBg="#FFF3DC"
          iconFg="#F59E0B"
          value={t("home.streakDays", { days: s.streakDays })}
          label={t("stats.streak")}
        />
        <StatCard
          icon={ListChecks}
          iconBg="#E7F9EF"
          iconFg="#10B981"
          value={String(s.solved)}
          label={t("stats.solved")}
        />
        <StatCard
          icon={Trophy}
          iconBg="#F1F2F4"
          iconFg="#6B7280"
          value={String(s.completedTickets)}
          label={t("stats.completed")}
        />
      </div>

      <div className="mt-4 rounded-3xl bg-card border border-card-border shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} color={ACCENT_FROM} />
            <p className="font-bold text-text-main">
              {t("stats.examReadiness")}
            </p>
          </div>
        </div>
        <p className={`text-center text-5xl font-extrabold mt-4 ${readinessColor}`}>
          {s.examReadiness}%
        </p>
        <p className={`text-center text-sm font-medium mt-1 ${readinessColor}`}>
          {s.examReadiness >= 70
            ? t("stats.readyLabel")
            : t("stats.needsPreparation")}
        </p>

        <div className="mt-5 space-y-4">
          {[
            [t("stats.passChance"), s.passChance],
            [t("stats.learnedQuestions"), s.learnedQuestionsPct],
            [t("stats.masteryQuality"), s.masteryQualityPct],
            [t("stats.examResults"), s.examResultsPct],
          ].map(([label, pct]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{label}</span>
                <span className="font-bold text-text-main">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-card-soft mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${readinessBar}`}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {s.studyPlan && (
        <div className="mt-4 rounded-3xl bg-card border border-card-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} color={ACCENT_FROM} />
            <p className="font-bold text-text-main">{t("stats.studyPlanTitle")}</p>
          </div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-text-muted">
              {t("stats.studyPlanCompare", {
                actual: s.studyPlan.avgDailyMinutes,
                planned: s.studyPlan.dailyStudyMinutes,
              })}
            </span>
            <span className="font-bold text-text-main">{s.studyPlan.planProgressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-card-soft overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(s.studyPlan.planProgressPct, 4)}%`,
                backgroundColor: ACCENT_FROM,
              }}
            />
          </div>
          <p className="text-text-muted text-xs mt-2">
            {t("stats.studyPlanActiveDays", { days: s.studyPlan.activeDaysLast7 })}
          </p>
        </div>
      )}
    </div>
  );
}
