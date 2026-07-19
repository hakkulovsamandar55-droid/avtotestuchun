import React from "react";
import { useTranslation } from "react-i18next";
import { Zap, ListChecks, Trophy, Flame } from "lucide-react";
import { ACCENT_FROM } from "../theme";

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

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
      <h1 className="text-xl font-extrabold text-text-main text-center mb-5">
        {t("stats.title")}
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Zap}
          iconBg="#EEEBFF"
          iconFg={ACCENT_FROM}
          value="0%"
          label={t("stats.accuracy")}
        />
        <StatCard
          icon={Flame}
          iconBg="#FFF3DC"
          iconFg="#F59E0B"
          value={t("home.streakDays", { days: 0 })}
          label={t("stats.streak")}
        />
        <StatCard
          icon={ListChecks}
          iconBg="#E7F9EF"
          iconFg="#10B981"
          value="0"
          label={t("stats.solved")}
        />
        <StatCard
          icon={Trophy}
          iconBg="#F1F2F4"
          iconFg="#6B7280"
          value="0"
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
        <p className="text-center text-5xl font-extrabold text-red-500 mt-4">
          0%
        </p>
        <p className="text-center text-red-500 text-sm font-medium mt-1">
          {t("stats.needsPreparation")}
        </p>

        <div className="mt-5 space-y-4">
          {[
            [t("stats.passChance"), "10%", "text-red-500", 10],
            [t("stats.learnedQuestions"), "0%", "text-indigo-600", 0],
            [t("stats.masteryQuality"), "0%", "text-amber-500", 0],
            [t("stats.examResults"), "0%", "text-emerald-500", 0],
          ].map(([label, val, color, pct]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{label}</span>
                <span className={`font-bold ${color}`}>{val}</span>
              </div>
              <div className="h-1.5 rounded-full bg-card-soft mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
