import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, X, MinusCircle } from "lucide-react";
import { api } from "../../api";
import QuestionCard from "../../components/exam/QuestionCard";

const FILTERS = ["all", "wrong", "skipped"];

/**
 * Imtihon yakunlangandan keyingi tahlil.
 *
 * Bu yerda to'g'ri javoblar ko'rsatiladi — imtihon allaqachon baholangani
 * uchun xavf yo'q (server review'ni faqat yakunlangan imtihon uchun beradi).
 */
export default function OfficialExamReview({ examId, onBack }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    api
      .examReview(examId)
      .then((res) => {
        if (!cancelled) setData(res);
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
  }, [examId]);

  const questions = data?.questions || [];
  const visible = questions.filter((q) => {
    if (filter === "wrong") return !q.isCorrect && !q.isSkipped;
    if (filter === "skipped") return q.isSkipped;
    return true;
  });

  const counts = {
    all: questions.length,
    wrong: questions.filter((q) => !q.isCorrect && !q.isSkipped).length,
    skipped: questions.filter((q) => q.isSkipped).length,
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <h1 className="text-lg font-extrabold">{t("officialExam.reviewTitle")}</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center py-6">{error}</p>}

      {!loading && !error && (
        <>
          <div className="flex gap-2 mb-5">
            {FILTERS.map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors ${
                  filter === key
                    ? "bg-white text-[#0F1424]"
                    : "bg-white/[0.05] text-gray-400 border border-white/10"
                }`}
              >
                {t(`officialExam.filter.${key}`)} ({counts[key]})
              </button>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-10">
              {t("officialExam.noQuestionsInFilter")}
            </p>
          )}

          <div className="space-y-6">
            {visible.map((q) => (
              <div
                key={q.id}
                className={`rounded-3xl border p-4 ${
                  q.isSkipped
                    ? "border-white/10 bg-white/[0.02]"
                    : q.isCorrect
                    ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                    : "border-red-500/25 bg-red-500/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  {q.isSkipped ? (
                    <MinusCircle size={15} color="#9CA3AF" />
                  ) : q.isCorrect ? (
                    <Check size={15} color="#34D399" />
                  ) : (
                    <X size={15} color="#F87171" />
                  )}
                  <span className="text-xs font-bold text-gray-400">
                    {t("officialExam.questionNumber", { number: q.index + 1 })}
                  </span>
                </div>

                <QuestionCard
                  question={q}
                  mode="review"
                  chosenIndex={q.chosenIndex}
                  explanationLabel={t("officialExam.explanation")}
                  skippedLabel={t("officialExam.skippedNotice")}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
