import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Trophy } from "lucide-react";
import { api } from "../../api";

const MEDALS = ["🥇", "🥈", "🥉"];

function Row({ entry, isMe }) {
  const { t } = useTranslation();
  const medal = entry.rank <= 3 ? MEDALS[entry.rank - 1] : null;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${
        isMe ? "border-white/30 bg-white/[0.08]" : "border-white/[0.06] bg-white/[0.03]"
      }`}
    >
      <span className="w-7 text-center font-extrabold text-sm shrink-0">
        {medal || entry.rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {entry.name}
          {isMe && (
            <span className="ml-1.5 text-[10px] font-bold text-gray-400">
              {t("officialExam.you")}
            </span>
          )}
        </p>
        <p className="text-gray-500 text-[11px] mt-0.5">
          {t("school.readiness")}: {entry.examReadiness}% · {entry.accuracyPct}%{" "}
          {t("officialExam.accuracy").toLowerCase()}
        </p>
      </div>
      {!entry.isActiveRecently && (
        <span className="text-[10px] text-gray-600 shrink-0">{t("school.inactive")}</span>
      )}
    </div>
  );
}

/** Guruh reytingi — talaba, o'qituvchi va owner bir xil ekranni ko'radi. */
export default function GroupLeaderboardScreen({ schoolId, groupId, currentUserId, onBack }) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .schoolGroupLeaderboard(schoolId, groupId)
      .then((res) => {
        if (!cancelled) setEntries(res.entries || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolId, groupId]);

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
          <h1 className="text-lg font-extrabold">{t("school.groupLeaderboard")}</h1>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center py-6">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-12">{t("school.emptyGroup")}</p>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <Row key={entry.membershipId} entry={entry} isMe={entry.userId === currentUserId} />
        ))}
      </div>
    </div>
  );
}
