import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, X, RotateCcw, Bookmark, BookmarkCheck } from "lucide-react";
import { getTicketQuestions } from "../../shared/data/ticketsData";
import { api } from "../api";
import SignIcon from "../components/SignIcon";
import TicketQuestionImage from "../components/TicketQuestionImage";
import { ACCENT_FROM, ACCENT_TO, ACCENT_WARM } from "../theme";

/**
 * Test ekrani — savol-javob oqimi, darhol fikr-mulohaza, yakuniy natija.
 *
 * QAYTA ISHLATILADI: bilet testi (ticketNumber) VA mavzuli test
 * (customQuestions). Ikkinchisi uchun alohida ekran yozish kodni
 * takrorlash bo'lardi — oqim aynan bir xil.
 *
 * @param {number} [ticketNumber] bilet raqami
 * @param {object[]} [customQuestions] tayyor savollar (mavzuli test uchun)
 * @param {string} [customTitle] sarlavha (mavzu nomi)
 */
export default function TestScreen({ ticketNumber, customQuestions, customTitle, onExit }) {
  const { t, i18n } = useTranslation();
  const questions = useMemo(
    () => (customQuestions?.length ? customQuestions : getTicketQuestions(ticketNumber, i18n.language)),
    [customQuestions, ticketNumber, i18n.language]
  );

  // Saqlangan savollar — test davomida belgilash uchun.
  // Ro'yxat bir marta yuklanadi; keyingi o'zgarishlar mahalliy holatda.
  // Test boshlanish vaqti — sarflangan vaqtni hisoblash uchun.
  // useRef: qayta render'da qiymat o'zgarmasligi kerak.
  const startedAtRef = useRef(Date.now());

  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    api
      .getSavedQuestions()
      .then((res) => setSavedIds(new Set((res.saved || []).map((x) => x.questionId))))
      .catch(() => {
        // Saqlanganlar yuklanmasa ham test ishlashda davom etadi —
        // nishonlar shunchaki bo'sh ko'rinadi.
      });
  }, []);

  const toggleSave = useCallback(
    async (questionId) => {
      if (!questionId || savingId) return;
      setSavingId(questionId);
      const wasSaved = savedIds.has(questionId);
      try {
        if (wasSaved) {
          await api.unsaveQuestion(questionId);
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(questionId);
            return next;
          });
        } else {
          await api.saveQuestion(questionId);
          setSavedIds((prev) => new Set(prev).add(questionId));
        }
      } catch {
        // Tarmoq xatosi — foydalanuvchini test o'rtasida to'xtatmaymiz
      } finally {
        setSavingId(null);
      }
    },
    [savedIds, savingId]
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]); // { qIndex, chosen, correct }
  const [finished, setFinished] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const total = questions.length;
  const question = questions[index];
  const isLast = index === total - 1;

  function handleChoose(optIdx) {
    if (selected !== null) return; // javob berilgan, o'zgartirib bo'lmaydi
    setSelected(optIdx);
  }

  function handleNext() {
    const record = {
      qIndex: index,
      chosen: selected,
      correct: question.correct,
      isCorrect: selected === question.correct,
    };
    const nextAnswers = [...answers, record];
    setAnswers(nextAnswers);

    // HAR SAVOLDAN KEYIN DARHOL yuboriladi (testning oxirigacha
    // KUTILMAYDI). Sabab: foydalanuvchi 1-savolda xato qilib, testni
    // tugatmasdan chiqib ketsa ("Orqaga" tugmasi), ilgari bu xato
    // umuman saqlanmasdi — "mening xatolarim" bo'limi bo'sh qolardi.
    // Endi xato qilingan zahoti serverga ketadi, test tugashini
    // kutmaydi.
    if (question?.id) {
      api.recordAnswers([{ questionId: question.id, isCorrect: record.isCorrect }]).catch(() => {
        // Xatolar statistikasi saqlanmasa ham test to'xtamaydi
      });
    }

    if (isLast) {
      setFinished(true);
      const correctCount = nextAnswers.filter((a) => a.isCorrect).length;
      const pct = Math.round((correctCount / total) * 100);

      // Mavzuli testda bilet raqami yo'q — umumiy urinish "PRACTICE" bo'ladi.
      api
        .recordAttempt({
          type: customQuestions?.length ? "EXAM" : "TICKET",
          ticketNumber: customQuestions?.length ? null : ticketNumber,
          correctCount,
          totalCount: total,
          passed: pct >= 70,
          // Sarflangan vaqt (soniya). Backend 2 soatdan oshganini
          // rad etadi — foydalanuvchi testni ochiq qoldirib ketgan
          // bo'lishi mumkin.
          durationSec: Math.round((Date.now() - startedAtRef.current) / 1000),
        })
        .catch(() => {
          // Statistika saqlanmasa ham, natija ekranda ko'rsatilishda davom etadi —
          // foydalanuvchi internetsiz yoki tizimga kirmagan bo'lishi mumkin.
        });
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  function handleRetry() {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
    setReviewing(false);
  }

  if (finished && !reviewing) {
    return (
      <ResultsView
        ticketNumber={ticketNumber}
        answers={answers}
        total={total}
        onRetry={handleRetry}
        onReview={() => setReviewing(true)}
        onExit={onExit}
      />
    );
  }

  if (finished && reviewing) {
    return (
      <ReviewView
        ticketNumber={ticketNumber}
        answers={answers}
        questions={questions}
        onBack={() => setReviewing(false)}
      />
    );
  }

  const progressPct = ((index + (selected !== null ? 1 : 0)) / total) * 100;

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold text-white leading-none truncate">
            {customTitle || t("test.ticketTitle", { num: ticketNumber })}
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            {t("test.questionOf", { current: index + 1, total })}
          </p>
        </div>

        {/* SAQLASH tugmasi — foydalanuvchi savolni "Saqlangan savollar"
            bo'limiga o'tkazadi. Savol matni yonida emas, sarlavhada:
            savol matni uzun bo'lishi mumkin va tugma pastga siljib ketardi. */}
        {question?.id && (
          <button
            onClick={() => toggleSave(question.id)}
            disabled={savingId === question.id}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 disabled:opacity-50"
            aria-label={savedIds.has(question.id) ? t("question.unsave") : t("question.save")}
          >
            {savedIds.has(question.id) ? (
              <BookmarkCheck size={17} color={ACCENT_FROM} />
            ) : (
              <Bookmark size={17} color="#9CA3AF" />
            )}
          </button>
        )}
      </div>

      {/* Saqlanganda qisqa tasdiq — foydalanuvchi bosgani natija berdimi
          degan savolda qolmasligi kerak */}
      {question?.id && savedIds.has(question.id) && (
        <p className="text-[11px] mb-3 -mt-2" style={{ color: ACCENT_FROM }}>
          {t("question.savedNotice")}
        </p>
      )}

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-6">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_WARM})`,
          }}
        />
      </div>

      {/* Rasm (agar bo'lsa) */}
      {question.image && (
        <div className="w-full flex justify-center mb-5">
          <div
            className="w-full max-w-[280px] rounded-3xl bg-white flex items-center justify-center shadow-lg p-2"
            style={{ boxShadow: "0 10px 30px rgba(108,92,231,0.25)" }}
          >
            {/* MUHIM: question.image endi IKKI XIL bo'lishi mumkin —
                yo'l belgisi kodi ("3.24", SignIcon uchun) yoki savol
                sahnasi rasmi (masalan "t1-1.webp", TicketQuestionImage
                uchun). Kengaytma bo'yicha ajratamiz — belgi kodlarida
                hech qachon ".png" bo'lmaydi. */}
            {question.image.endsWith(".webp") ? (
              <TicketQuestionImage questionId={question.image.replace(".webp", "")} maxHeight={260} />
            ) : (
              <SignIcon code={question.image} size={104} />
            )}
          </div>
        </div>
      )}

      {/* Savol matni */}
      <h2 className="text-[17px] font-bold leading-snug mb-5">
        {question.text}
      </h2>

      {/* Variantlar */}
      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const isChosen = selected === i;
          const isCorrectOpt = i === question.correct;
          let stateStyle =
            "border-white/10 bg-white/[0.04] text-white/90";
          let icon = null;

          if (selected !== null) {
            if (isCorrectOpt) {
              stateStyle = "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
              icon = <Check size={18} className="shrink-0" color="#34D399" />;
            } else if (isChosen && !isCorrectOpt) {
              stateStyle = "border-red-500/60 bg-red-500/10 text-red-300";
              icon = <X size={18} className="shrink-0" color="#F87171" />;
            } else {
              stateStyle = "border-white/5 bg-white/[0.02] text-white/40";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleChoose(i)}
              disabled={selected !== null}
              className={`w-full text-left rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-colors ${stateStyle}`}
            >
              <span
                className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs font-bold shrink-0"
                style={
                  selected === null
                    ? {}
                    : isCorrectOpt
                    ? { borderColor: "#34D399" }
                    : isChosen
                    ? { borderColor: "#F87171" }
                    : {}
                }
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-sm leading-snug">{opt}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Keyingi tugma */}
      <div className="mt-7">
        <button
          onClick={handleNext}
          disabled={selected === null}
          className="w-full rounded-2xl py-3.5 font-bold text-white text-sm disabled:opacity-30 transition-opacity active:scale-[0.98]"
          style={{
            background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
          }}
        >
          {isLast ? t("test.finish") : t("test.next")}
        </button>
      </div>
    </div>
  );
}

function ResultsView({ ticketNumber, answers, total, onRetry, onReview, onExit }) {
  const { t } = useTranslation();
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const pct = Math.round((correctCount / total) * 100);

  let tier = "weak";
  if (pct >= 90) tier = "excellent";
  else if (pct >= 70) tier = "good";

  const ringColor = tier === "excellent" ? "#34D399" : tier === "good" ? ACCENT_WARM : "#F87171";

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white flex flex-col animate-slide-in">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <h1 className="text-lg font-extrabold text-white">
          {t("test.ticketTitle", { num: ticketNumber })}
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div
          className="w-40 h-40 rounded-full flex items-center justify-center relative"
          style={{
            background: `conic-gradient(${ringColor} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
          }}
        >
          <div className="w-32 h-32 rounded-full bg-[#0F1424] flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold">{pct}%</span>
            <span className="text-gray-400 text-xs mt-1">
              {t("test.correctAnswers", { correct: correctCount, total })}
            </span>
          </div>
        </div>

        <h2 className="text-xl font-extrabold mt-6 text-center px-4">
          {t(`test.tier.${tier}`)}
        </h2>
      </div>

      <div className="space-y-3 mt-6">
        <button
          onClick={onReview}
          className="w-full rounded-2xl py-3.5 font-bold text-sm border border-white/10 bg-white/[0.04] active:scale-[0.98] transition-transform"
        >
          {t("test.reviewTitle")}
        </button>
        <button
          onClick={onRetry}
          className="w-full rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          <RotateCcw size={16} />
          {t("test.retry")}
        </button>
        <button
          onClick={onExit}
          className="w-full rounded-2xl py-3.5 font-bold text-sm text-gray-400"
        >
          {t("test.backToTickets")}
        </button>
      </div>
    </div>
  );
}

function ReviewView({ ticketNumber, answers, questions, onBack }) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <h1 className="text-lg font-extrabold text-white">
          {t("test.reviewTitle")}
        </h1>
      </div>

      <div className="space-y-4">
        {answers.map((a) => {
          const q = questions[a.qIndex];
          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-4 ${
                a.isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-start gap-2 mb-3">
                {a.isCorrect ? (
                  <Check size={16} color="#34D399" className="mt-0.5 shrink-0" />
                ) : (
                  <X size={16} color="#F87171" className="mt-0.5 shrink-0" />
                )}
                <p className="text-sm font-semibold leading-snug">{q.text}</p>
              </div>

              {q.image && (
                <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center mb-3">
                  {q.image.endsWith(".webp") ? (
                    <TicketQuestionImage questionId={q.image.replace(".webp", "")} maxHeight={80} />
                  ) : (
                    <SignIcon code={q.image} size={52} />
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mb-1">
                {t("test.correctAnswer")}:{" "}
                <span className="text-emerald-300 font-medium">{q.options[q.correct]}</span>
              </p>
              {!a.isCorrect && (
                <p className="text-xs text-gray-400">
                  {t("test.yourAnswer")}:{" "}
                  <span className="text-red-300 font-medium">{q.options[a.chosen]}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
