import React from "react";
import { useTranslation } from "react-i18next";
import { Target, ListChecks, GraduationCap, Flame, Layers } from "lucide-react";
import { ACCENT_FROM } from "../theme";
import { getOverallStats } from "../utils/progressStore";
import { TOTAL_TICKETS } from "../data/ticketsData";

function StatCard({ icon: Icon, iconBg, iconFg, value, label }) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={18} color={iconFg} />
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-gray-400 text-sm mt-0.5">{label}</p>
    </div>
  );
}

function ProgressRow({ label, pct, colorClass, barClass, valueText }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className={`font-bold ${colorClass}`}>{valueText}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

// 3b-EKRAN: "Statistika" bo'limi — foydalanuvchining haqiqiy natijalariga asoslangan
// (barcha urinishlar bo'yicha jamlangan hisob-kitob, AI yoki bashorat ishlatilmaydi)
export default function StatsTab() {
  const { t } = useTranslation();
  const stats = getOverallStats(TOTAL_TICKETS);

  const hasActivity = stats.testsCompleted > 0;

  const accuracyColor =
    stats.accuracy >= 90 ? "text-emerald-500" : stats.accuracy >= 70 ? "text-amber-500" : "text-red-500";
  const accuracyBar =
    stats.accuracy >= 90 ? "bg-emerald-400" : stats.accuracy >= 70 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-4 animate-fade-in">
      <h1 className="text-xl font-extrabold text-gray-900 text-center mb-5">
        {t("stats.title")}
      </h1>

      {/* 4 ta asosiy ko'rsatkich kartochkasi */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Target}
          iconBg="#EEEBFF"
          iconFg={ACCENT_FROM}
          value={`${stats.accuracy}%`}
          label={t("stats.accuracy")}
        />
        <StatCard
          icon={Flame}
          iconBg="#FFF3DC"
          iconFg="#F59E0B"
          value={t("home.streakDays", { days: stats.streakDays })}
          label={t("stats.streak")}
        />
        <StatCard
          icon={ListChecks}
          iconBg="#E7F9EF"
          iconFg="#10B981"
          value={stats.questionsAnswered}
          label={t("stats.solved")}
        />
        <StatCard
          icon={GraduationCap}
          iconBg="#F1F2F4"
          iconFg="#6B7280"
          value={stats.masteredTickets}
          label={t("stats.completed")}
        />
      </div>

      {/* Umumiy progress bloki */}
      <div className="mt-4 rounded-3xl bg-white border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} color={ACCENT_FROM} />
            <p className="font-bold text-gray-900">{t("stats.overallProgress")}</p>
          </div>
        </div>

        <p className={`text-center text-5xl font-extrabold mt-4 ${accuracyColor}`}>
          {stats.accuracy}%
        </p>
        <p className="text-center text-gray-400 text-sm font-medium mt-1">
          {hasActivity
            ? t("stats.questionsSolvedOf", { correct: stats.questionsCorrect, total: stats.questionsAnswered })
            : t("stats.noActivityYet")}
        </p>

        <div className="mt-5 space-y-4">
          <ProgressRow
            label={t("stats.overallAccuracy")}
            pct={stats.accuracy}
            colorClass={accuracyColor}
            barClass={accuracyBar}
            valueText={`${stats.accuracy}%`}
          />
          <ProgressRow
            label={t("stats.ticketsMastered")}
            pct={stats.masteredPct}
            colorClass="text-emerald-500"
            barClass="bg-emerald-400"
            valueText={`${stats.masteredTickets}/${stats.totalTickets}`}
          />
          <ProgressRow
            label={t("stats.ticketsCovered")}
            pct={stats.coveragePct}
            colorClass="text-indigo-600"
            barClass="bg-indigo-400"
            valueText={`${stats.attemptedTickets}/${stats.totalTickets}`}
          />
        </div>
      </div>

      {/* Bilet-bo'yicha tafsilot */}
      {hasActivity && (
        <div className="mt-4 rounded-3xl bg-white border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-900 mb-4">{t("stats.byTicket")}</p>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {[...stats.ticketStats]
              .sort((a, b) => a.ticket - b.ticket)
              .map((ts) => {
                const mastered = ts.pct >= 90;
                return (
                  <div key={ts.ticket} className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                      {ts.ticket}
                    </span>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            mastered ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                          style={{ width: `${Math.max(ts.pct, 4)}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold w-10 text-right shrink-0 ${
                        mastered ? "text-emerald-500" : "text-amber-500"
                      }`}
                    >
                      {ts.pct}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {!hasActivity && (
        <div className="mt-4 rounded-3xl bg-white border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-gray-400 text-sm">{t("stats.emptyState")}</p>
        </div>
      )}
    </div>
  );
}
