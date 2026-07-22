import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ClipboardCheck,
  Clock,
  Target,
  Ban,
  Save,
  Crown,
  History,
  Trophy,
} from "lucide-react";
import { api } from "../../api";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";

function RuleRow({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
        <Icon size={15} color="#D1D5DB" />
      </div>
      <p className="text-sm text-gray-300 leading-snug pt-1.5">{text}</p>
    </div>
  );
}

/**
 * Rasmiy imtihon boshlanishidan oldingi ekran.
 *
 * Uch holatni boshqaradi:
 *  1) Tugallanmagan imtihon bor -> "Davom etish" / "Bekor qilish"
 *  2) Imtihon boshlash mumkin -> qoidalar + "Boshlash"
 *  3) Kunlik limit tugagan -> Premium taklifi
 */
export default function OfficialExamIntro({
  onBack,
  onExamReady,
  onOpenHistory,
  onOpenLeaderboard,
  onOpenPremium,
}) {
  const { t } = useTranslation();
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setEligibility(await api.examEligibility());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStart() {
    if (starting) return;
    setStarting(true);
    setError("");
    try {
      const { exam } = await api.examStart();
      onExamReady(exam);
    } catch (err) {
      // 402 = kunlik limit tugagan; eligibility'ni yangilaymiz
      if (err.code === "daily_limit_reached") {
        await load();
      }
      setError(err.message);
      setStarting(false);
    }
  }

  async function handleAbandon() {
    if (!eligibility?.activeExamId) return;
    setStarting(true);
    try {
      await api.examAbandon(eligibility.activeExamId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  const canStart = eligibility?.canStart;
  const hasActive = eligibility?.hasActiveExam;
  const limitReached = eligibility && !eligibility.isPremium && eligibility.remaining === 0 && !hasActive;

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <h1 className="text-xl font-extrabold">{t("officialExam.title")}</h1>
      </div>

      <div className="flex flex-col items-center text-center mb-7">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
          style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          <ClipboardCheck size={34} color="white" />
        </div>
        <p className="text-gray-400 text-sm leading-relaxed px-4">
          {t("officialExam.introSubtitle")}
        </p>
      </div>

      <div className="rounded-3xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4 mb-6">
        <RuleRow icon={ClipboardCheck} text={t("officialExam.rule.questions")} />
        <RuleRow icon={Clock} text={t("officialExam.rule.duration")} />
        <RuleRow icon={Target} text={t("officialExam.rule.passing")} />
        <RuleRow icon={Ban} text={t("officialExam.rule.noPause")} />
        <RuleRow icon={Save} text={t("officialExam.rule.autoSave")} />
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {!loading && eligibility && !eligibility.isPremium && !hasActive && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 mb-4 text-center">
          <p className="text-xs text-gray-400">
            {t("officialExam.dailyLimitInfo", {
              used: eligibility.usedToday,
              limit: eligibility.dailyLimit,
            })}
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs text-center mb-4 leading-relaxed">{error}</p>
      )}

      {/* 1-holat: tugallanmagan imtihon */}
      {!loading && hasActive && (
        <div className="space-y-3 mb-4">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
            <p className="text-amber-300 text-xs leading-relaxed">
              {t("officialExam.resumeNotice")}
            </p>
          </div>
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {t("officialExam.continueExam")}
          </button>
          <button
            onClick={handleAbandon}
            disabled={starting}
            className="w-full rounded-2xl py-3 font-semibold text-sm text-gray-400 border border-white/10 disabled:opacity-50"
          >
            {t("officialExam.cancelExam")}
          </button>
        </div>
      )}

      {/* 2-holat: boshlash mumkin */}
      {!loading && !hasActive && canStart && (
        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full rounded-2xl py-4 font-extrabold text-white text-base active:scale-[0.98] transition-transform disabled:opacity-50 mb-4"
          style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          {starting ? t("officialExam.starting") : t("officialExam.startExam")}
        </button>
      )}

      {/* 3-holat: limit tugagan */}
      {!loading && limitReached && (
        <div className="rounded-3xl p-5 mb-4 text-center"
          style={{ background: "linear-gradient(160deg, rgba(245,197,66,0.14), rgba(201,152,43,0.05))", boxShadow: "0 0 0 1px rgba(245,197,66,0.3) inset" }}
        >
          <Crown size={28} color="#F5C542" className="mx-auto mb-3" />
          <p className="font-bold text-sm mb-1">{t("officialExam.limitTitle")}</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-4">
            {t("officialExam.limitBody")}
          </p>
          <button
            onClick={onOpenPremium}
            className="w-full rounded-2xl py-3 font-bold text-sm"
            style={{ background: "linear-gradient(90deg, #F5C542, #C9982B)", color: "#3B2C00" }}
          >
            {t("officialExam.seePremium")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpenHistory}
          className="rounded-2xl border border-white/10 bg-white/[0.03] py-3 flex flex-col items-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <History size={17} color="#9CA3AF" />
          <span className="text-xs font-semibold text-gray-300">
            {t("officialExam.history")}
          </span>
        </button>
        <button
          onClick={onOpenLeaderboard}
          className="rounded-2xl border border-white/10 bg-white/[0.03] py-3 flex flex-col items-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <Trophy size={17} color="#F5C542" />
          <span className="text-xs font-semibold text-gray-300">
            {t("officialExam.leaderboard")}
          </span>
        </button>
      </div>
    </div>
  );
}
