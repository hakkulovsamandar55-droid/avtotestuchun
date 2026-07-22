import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, AlertTriangle, Send } from "lucide-react";
import { api } from "../../api";
import { ACCENT_FROM, ACCENT_TO, ACCENT_WARM } from "../../theme";
import QuestionCard from "../../components/exam/QuestionCard";
import QuestionNavigator from "../../components/exam/QuestionNavigator";
import ExamTimer from "../../components/exam/ExamTimer";

/**
 * Rasmiy imtihon — asosiy ekran.
 *
 * Farqlari (mashq imtihonidan):
 *  - to'g'ri javob KO'RSATILMAYDI (server ham yubormaydi)
 *  - savollar orasida erkin harakat, o'tkazib yuborish mumkin
 *  - har bir javob DARHOL serverga saqlanadi (ilova yopilsa yo'qolmaydi)
 *  - vaqt tugaganda avtomatik yuboriladi
 */
export default function OfficialExamScreen({ exam, onFinished, onExit }) {
  const { t } = useTranslation();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(exam.answers || {});
  const [secondsLeft, setSecondsLeft] = useState(exam.secondsLeft);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(null);

  const submittedRef = useRef(false);
  const questions = exam.questions;
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;

  const submit = useCallback(
    async ({ auto = false } = {}) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const { result } = await api.examSubmit(exam.id);
        onFinished(result, { auto });
      } catch (err) {
        // Vaqt tugagan bo'lsa server allaqachon yopgan bo'lishi mumkin —
        // bu holatda ham natija ekraniga o'tamiz.
        if (err.code === "expired" || err.code === "not_active") {
          try {
            const { result } = await api.examSubmit(exam.id);
            onFinished(result, { auto: true });
            return;
          } catch {
            /* pastdagi xato ko'rsatiladi */
          }
        }
        submittedRef.current = false;
        setSubmitting(false);
        setError(err.message);
      }
    },
    [exam.id, onFinished]
  );

  // --- Anti-cheat: ilovadan chiqib ketishni qayd qilish ---
  //
  // ESLATMA: bu ISHONCHLI himoya emas. Foydalanuvchi tarmoq so'rovini
  // to'sib qo'yishi mumkin. Bu faqat adminlar uchun ko'rsatkich va shu
  // tarzda hujjatlashtirilgan.
  useEffect(() => {
    function handleHidden() {
      if (document.visibilityState === "hidden" && !submittedRef.current) {
        api.examFocusLost(exam.id).catch(() => {
          // Qayd etilmasa ham imtihon davom etadi — bu asosiy oqim emas
        });
      }
    }
    document.addEventListener("visibilitychange", handleHidden);
    return () => document.removeEventListener("visibilitychange", handleHidden);
  }, [exam.id]);

  // Javobni saqlash — darhol serverga
  async function choose(optionIndex) {
    if (submitting || submittedRef.current) return;

    const key = String(index);
    const previous = answers[key];
    // Xuddi shu variant qayta bosilsa — javobni bekor qiladi
    const next = previous === optionIndex ? null : optionIndex;

    // Optimistik yangilash: interfeys darhol javob beradi
    setAnswers((prev) => {
      const copy = { ...prev };
      if (next === null) delete copy[key];
      else copy[key] = next;
      return copy;
    });
    setError("");

    try {
      const res = await api.examAnswer(exam.id, index, next);
      if (typeof res.secondsLeft === "number") setSecondsLeft(res.secondsLeft);
    } catch (err) {
      // Saqlanmadi — optimistik o'zgarishni qaytaramiz, aks holda
      // foydalanuvchi javobi saqlangan deb o'ylab qoladi.
      setAnswers((prev) => {
        const copy = { ...prev };
        if (previous === undefined) delete copy[key];
        else copy[key] = previous;
        return copy;
      });

      if (err.code === "expired") {
        submit({ auto: true });
        return;
      }
      setError(t("officialExam.answerNotSaved"));
    }
  }

  function handleWarning(level) {
    setWarning(level);
    // Ogohlantirish 6 soniyadan keyin yo'qoladi
    setTimeout(() => setWarning(null), 6000);
  }

  const question = questions[index];
  const chosen = answers[String(index)];
  const isLast = index === total - 1;

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      {/* Sarlavha + taymer */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowConfirm("exit")}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
          aria-label={t("officialExam.title")}
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold leading-none truncate">
            {t("officialExam.title")}
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            {t("officialExam.questionOf", { current: index + 1, total })}
          </p>
        </div>
        <ExamTimer
          serverSecondsLeft={secondsLeft}
          onExpire={() => submit({ auto: true })}
          onWarning={handleWarning}
        />
      </div>

      {warning && (
        <div
          className={`rounded-2xl px-4 py-2.5 mb-4 flex items-center gap-2 ${
            warning === "danger"
              ? "bg-red-500/15 border border-red-500/30"
              : warning === "warning"
              ? "bg-amber-500/15 border border-amber-500/30"
              : "bg-sky-500/15 border border-sky-500/30"
          }`}
        >
          <AlertTriangle size={14} color={warning === "danger" ? "#F87171" : ACCENT_WARM} />
          <p className="text-xs font-semibold">
            {t(`officialExam.warning.${warning}`)}
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${(answeredCount / total) * 100}%`,
              background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_WARM})`,
            }}
          />
        </div>
        <button
          onClick={() => setShowNavigator((v) => !v)}
          className="text-xs font-semibold text-gray-300 shrink-0 underline decoration-dotted"
        >
          {t("officialExam.answeredOf", { answered: answeredCount, total })}
        </button>
      </div>

      {showNavigator && (
        <div className="mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
          <QuestionNavigator
            total={total}
            currentIndex={index}
            answers={answers}
            onSelect={(i) => {
              setIndex(i);
              setShowNavigator(false);
            }}
          />
        </div>
      )}

      <QuestionCard
        question={question}
        mode="answering"
        chosenIndex={chosen ?? null}
        onChoose={choose}
      />

      {error && (
        <p className="text-red-400 text-xs text-center mt-4">{error}</p>
      )}

      {/* Navigatsiya */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center disabled:opacity-30 shrink-0"
          aria-label={t("officialExam.previous")}
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>

        {isLast ? (
          <button
            onClick={() => setShowConfirm("submit")}
            disabled={submitting}
            className="flex-1 rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            <Send size={16} />
            {t("officialExam.finish")}
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            className="flex-1 rounded-2xl py-3.5 font-bold text-sm bg-white/[0.06] border border-white/10 active:scale-[0.98] transition-transform"
          >
            {chosen === undefined ? t("officialExam.skip") : t("officialExam.next")}
          </button>
        )}

        <button
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={isLast}
          className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center disabled:opacity-30 shrink-0"
          aria-label={t("officialExam.next")}
        >
          <ChevronRight size={20} color="#E5E7EB" />
        </button>
      </div>

      {/* Tasdiqlash oynasi */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-5 pb-8">
          <div className="w-full max-w-sm rounded-3xl bg-[#161B2E] border border-white/10 p-5">
            <p className="font-bold text-base mb-2">
              {showConfirm === "submit"
                ? t("officialExam.confirmSubmitTitle")
                : t("officialExam.confirmExitTitle")}
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              {showConfirm === "submit"
                ? t("officialExam.confirmSubmitBody", {
                    unanswered: total - answeredCount,
                  })
                : t("officialExam.confirmExitBody")}
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  if (showConfirm === "submit") submit();
                  else onExit();
                }}
                disabled={submitting}
                className="w-full rounded-2xl py-3.5 font-bold text-white text-sm disabled:opacity-50"
                style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
              >
                {showConfirm === "submit"
                  ? t("officialExam.confirmSubmitYes")
                  : t("officialExam.confirmExitYes")}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-2xl py-3 font-semibold text-sm text-gray-400 border border-white/10"
              >
                {t("officialExam.back")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
