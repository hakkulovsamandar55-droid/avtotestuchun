import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, CheckCircle2, XCircle, Clock, Percent } from "lucide-react";
import { api } from "../../api";
import { formatDuration } from "../../components/exam/ExamTimer";

const PAGE_SIZE = 20;

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Foydalanuvchining rasmiy imtihon tarixi. */
export default function ExamHistoryScreen({ onBack, onOpenReview }) {
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (offset = 0) => {
    try {
      const res = await api.examHistory({ limit: PAGE_SIZE, offset });
      setTotal(res.total);
      setExams((prev) => (offset === 0 ? res.exams : [...prev, ...res.exams]));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load(0).finally(() => setLoading(false));
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    await load(exams.length);
    setLoadingMore(false);
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold leading-none">
            {t("officialExam.historyTitle")}
          </h1>
          {total > 0 && (
            <p className="text-gray-400 text-xs mt-1">
              {t("officialExam.historyCount", { count: total })}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center py-6">{error}</p>}

      {!loading && !error && exams.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-12 leading-relaxed px-6">
          {t("officialExam.noHistory")}
        </p>
      )}

      <div className="space-y-3">
        {exams.map((exam) => (
          <button
            key={exam.id}
            onClick={() => onOpenReview(exam.id)}
            className={`w-full text-left rounded-2xl border p-4 active:scale-[0.99] transition-transform ${
              exam.passed
                ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                : "border-red-500/25 bg-red-500/[0.04]"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {exam.passed ? (
                  <CheckCircle2 size={16} color="#34D399" />
                ) : (
                  <XCircle size={16} color="#F87171" />
                )}
                <span
                  className="font-extrabold text-sm"
                  style={{ color: exam.passed ? "#34D399" : "#F87171" }}
                >
                  {exam.passed ? t("officialExam.passed") : t("officialExam.failed")}
                </span>
              </div>
              <span className="font-extrabold text-sm">
                {exam.correctCount}
                <span className="text-gray-500 text-xs">/{exam.totalQuestions}</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-gray-400 text-xs">
              <span className="flex items-center gap-1">
                <Percent size={12} /> {exam.accuracyPct}%
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatDuration(exam.durationSec)}
              </span>
              <span className="ml-auto text-[11px]">{formatDate(exam.finishedAt)}</span>
            </div>
          </button>
        ))}
      </div>

      {exams.length < total && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full mt-4 rounded-2xl py-3 font-semibold text-sm border border-white/10 bg-white/[0.03] text-gray-300 disabled:opacity-50"
        >
          {loadingMore ? t("officialExam.loading") : t("officialExam.loadMore")}
        </button>
      )}
    </div>
  );
}
