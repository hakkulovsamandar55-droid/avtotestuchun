import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Trophy, Clock, Percent, Target, EyeOff } from "lucide-react";
import { api } from "../../api";
import { formatDuration } from "../../components/exam/ExamTimer";

// Davrlar — backend PERIODS bilan mos. Haftalik backend'da allaqachon bor,
// kerak bo'lganda shu ro'yxatga qo'shiladi (boshqa o'zgarish shart emas).
const PERIODS = ["all_time", "this_month"];
const SORTS = [
  { key: "score", icon: Target },
  { key: "speed", icon: Clock },
  { key: "accuracy", icon: Percent },
];

const MEDALS = ["🥇", "🥈", "🥉"];

function Row({ entry, sort }) {
  const { t } = useTranslation();
  const medal = entry.rank <= 3 ? MEDALS[entry.rank - 1] : null;

  const primary =
    sort === "speed"
      ? formatDuration(entry.durationSec)
      : sort === "accuracy"
      ? `${entry.accuracyPct}%`
      : `${entry.correctCount}/20`;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${
        entry.isCurrentUser
          ? "border-white/30 bg-white/[0.08]"
          : "border-white/[0.06] bg-white/[0.03]"
      }`}
    >
      <span className="w-7 text-center font-extrabold text-sm shrink-0">
        {medal || entry.rank}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {entry.displayName}
          {entry.isCurrentUser && (
            <span className="ml-1.5 text-[10px] font-bold text-gray-400">
              {t("officialExam.you")}
            </span>
          )}
        </p>
        <p className="text-gray-500 text-[11px] mt-0.5">
          {sort !== "score" && `${entry.correctCount}/20 · `}
          {sort !== "accuracy" && `${entry.accuracyPct}% · `}
          {sort !== "speed" && formatDuration(entry.durationSec)}
        </p>
      </div>

      <span className="font-extrabold text-sm shrink-0 tabular-nums">{primary}</span>
    </div>
  );
}

/** Rasmiy imtihon reytingi. Faqat o'tgan imtihonlar qatnashadi. */
export default function LeaderboardScreen({ onBack, onOpenSettings }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("all_time");
  const [sort, setSort] = useState("score");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api.examLeaderboard(period, sort));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const entries = data?.entries || [];

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <div className="flex items-center gap-2">
          <Trophy size={18} color="#F5C542" />
          <h1 className="text-lg font-extrabold">{t("officialExam.leaderboardTitle")}</h1>
        </div>
      </div>

      {/* Davr */}
      <div className="flex gap-2 mb-3">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors ${
              period === p
                ? "bg-white text-[#0F1424]"
                : "bg-white/[0.05] text-gray-400 border border-white/10"
            }`}
          >
            {t(`officialExam.period.${p}`)}
          </button>
        ))}
      </div>

      {/* Tartiblash */}
      <div className="flex gap-2 mb-5">
        {SORTS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`flex-1 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              sort === key
                ? "bg-white/[0.14] text-white border border-white/25"
                : "bg-white/[0.03] text-gray-500 border border-white/[0.06]"
            }`}
          >
            <Icon size={12} />
            {t(`officialExam.sort.${key}`)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center py-6">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-12 px-6 leading-relaxed">
          {t("officialExam.emptyLeaderboard")}
        </p>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <Row key={`${entry.rank}-${entry.displayName}`} entry={entry} sort={sort} />
        ))}
      </div>

      {/* Ro'yxatga kirmagan foydalanuvchi o'z o'rnini ko'radi */}
      {data?.currentUser && (
        <>
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-[10px]">···</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <Row entry={data.currentUser} sort={sort} />
        </>
      )}

      <div className="mt-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex items-start gap-2">
        <EyeOff size={14} color="#9CA3AF" className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-gray-400 text-xs leading-relaxed">
            {t("officialExam.privacyNotice")}
          </p>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-xs font-semibold text-gray-300 underline mt-1.5"
            >
              {t("officialExam.openSettings")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
