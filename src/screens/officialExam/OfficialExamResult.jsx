import React from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Percent,
  Eye,
  RotateCcw,
  Home,
  EyeOff,
} from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";
import { formatDuration } from "../../components/exam/ExamTimer";

function StatBox({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-center">
      <Icon size={15} color="#9CA3AF" className="mx-auto mb-1.5" />
      <p className="font-extrabold text-sm">{value}</p>
      <p className="text-gray-500 text-[10px] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

/** Rasmiy imtihon natijasi. Baholash serverda bo'lgan, bu faqat ko'rsatadi. */
export default function OfficialExamResult({
  result,
  autoSubmitted,
  onReview,
  onRetry,
  onExit,
}) {
  const { t } = useTranslation();
  const passed = result.passed;
  const color = passed ? "#34D399" : "#F87171";
  const scorePct = result.totalQuestions
    ? (result.correctCount / result.totalQuestions) * 100
    : 0;

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white flex flex-col animate-slide-in">
      <h1 className="text-lg font-extrabold mb-6">{t("officialExam.resultTitle")}</h1>

      {autoSubmitted && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 mb-5">
          <p className="text-amber-300 text-xs leading-relaxed">
            {t("officialExam.autoSubmittedNotice")}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div
          className="w-40 h-40 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${color} ${scorePct}%, rgba(255,255,255,0.08) ${scorePct}%)`,
          }}
        >
          <div className="w-32 h-32 rounded-full bg-[#0F1424] flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold">
              {result.correctCount}
              <span className="text-lg text-gray-500">/{result.totalQuestions}</span>
            </span>
            <span className="text-gray-400 text-[11px] mt-1">
              {t("officialExam.needed", { score: result.passingScore })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          {passed ? (
            <CheckCircle2 size={22} color={color} />
          ) : (
            <XCircle size={22} color={color} />
          )}
          <h2 className="text-2xl font-extrabold" style={{ color }}>
            {passed ? t("officialExam.passed") : t("officialExam.failed")}
          </h2>
        </div>
        <p className="text-gray-400 text-sm text-center mt-2 px-6 leading-relaxed">
          {passed
            ? t("officialExam.passedSubtitle")
            : t("officialExam.failedSubtitle", { score: result.passingScore })}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-7">
        <StatBox
          icon={Target}
          value={result.correctCount}
          label={t("officialExam.correct")}
        />
        <StatBox
          icon={XCircle}
          value={result.wrongCount}
          label={t("officialExam.wrong")}
        />
        <StatBox
          icon={Percent}
          value={`${result.accuracyPct}%`}
          label={t("officialExam.accuracy")}
        />
        <StatBox
          icon={Clock}
          value={formatDuration(result.durationSec)}
          label={t("officialExam.timeUsed")}
        />
      </div>

      {result.focusLostCount > 0 && (
        <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex items-start gap-2">
          <EyeOff size={14} color="#9CA3AF" className="mt-0.5 shrink-0" />
          <p className="text-gray-400 text-xs leading-relaxed">
            {t("officialExam.focusLostNotice", { count: result.focusLostCount })}
          </p>
        </div>
      )}

      <div className="space-y-3 mt-7">
        <button
          onClick={onReview}
          className="w-full rounded-2xl py-3.5 font-bold text-sm border border-white/10 bg-white/[0.04] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Eye size={16} />
          {t("officialExam.reviewAnswers")}
        </button>
        <button
          onClick={onRetry}
          className="w-full rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          <RotateCcw size={16} />
          {t("officialExam.tryAgain")}
        </button>
        <button
          onClick={onExit}
          className="w-full rounded-2xl py-3.5 font-bold text-sm text-gray-400 flex items-center justify-center gap-2"
        >
          <Home size={15} />
          {t("officialExam.backHome")}
        </button>
      </div>
    </div>
  );
}
