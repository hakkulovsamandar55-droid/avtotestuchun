import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, X, RotateCcw, Timer, AlertTriangle } from "lucide-react";
import { getRandomExamQuestions, EXAM_TIME_SECONDS, EXAM_MAX_MISTAKES } from "../data/ticketsData";
import { api } from "../api";
import SignIcon from "../components/SignIcon";
import { ACCENT_FROM, ACCENT_TO, ACCENT_WARM } from "../theme";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Imtihon rejimi — barcha biletlardan tasodifiy 20 ta savol, 25 daqiqa vaqt,
// 2 marta xato qilinsa imtihon avtomatik yakunlanadi (yiqilish)
export default function ExamScreen({ onExit }) {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  const questions = useMemo(() => getRandomExamQuestions(), [attempt]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME_SECONDS);
  const [status, setStatus] = useState("playing"); // playing | passed | failed_mistakes | failed_timeout
  const [reviewing, setReviewing] = useState(false);
  const advanceTimer = useRef(null);

  const total = questions.length;
  const question = questions[index];

  // Vaqt hisoblagich
  useEffect(() => {
    if (status !== "playing") return;
    if (timeLeft <= 0) {
      setStatus("failed_timeout");
      return;
    }
    const id = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, status]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // Imtihon tugaganda (o'tdi/yiqildi/vaqt tugadi) natijani bir marta serverga yuboradi
  useEffect(() => {
    if (status === "playing") return;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    api
      .recordAttempt({
        type: "EXAM",
        correctCount,
        totalCount: total,
        passed: status === "passed",
      })
      .catch(() => {
        // Statistika saqlanmasa ham natija ekranda ko'rsatiladi
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function commitAnswer(optIdx) {
    if (selected !== null || status !== "playing") return;
    setSelected(optIdx);

    const isCorrect = optIdx === question.correct;
    const record = { qIndex: index, chosen: optIdx, correct: question.correct, isCorrect };
    const newMistakes = isCorrect ? mistakes : mistakes + 1;

    advanceTimer.current = setTimeout(() => {
      setAnswers((prev) => [...prev, record]);
      if (!isCorrect) setMistakes(newMistakes);

      if (!isCorrect && newMistakes >= EXAM_MAX_MISTAKES) {
        setStatus("failed_mistakes");
      } else if (index + 1 >= total) {
        setStatus("passed");
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
      }
    }, 700);
  }

  function handleRetry() {
    clearTimeout(advanceTimer.current);
    setAttempt((a) => a + 1);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setMistakes(0);
    setTimeLeft(EXAM_TIME_SECONDS);
    setStatus("playing");
    setReviewing(false);
  }

  if (status !== "playing" && !reviewing) {
    return (
      <ExamResults
        status={status}
        answers={answers}
        total={total}
        timeLeft={timeLeft}
        onRetry={handleRetry}
        onReview={() => setReviewing(true)}
        onExit={onExit}
      />
    );
  }

  if (status !== "playing" && reviewing) {
    return (
      <ExamReview
        answers={answers}
        questions={questions}
        onBack={() => setReviewing(false)}
      />
    );
  }

  const isLowTime = timeLeft <= 120;

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
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-white leading-none">
            {t("exam.title")}
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            {t("test.questionOf", { current: index + 1, total })}
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${
            isLowTime ? "bg-red-500/15 text-red-400" : "bg-white/5 text-white/80"
          }`}
        >
          <Timer size={14} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress + mistakes */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${(index / total) * 100}%`,
              background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_WARM})`,
            }}
          />
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-red-400 shrink-0">
          <AlertTriangle size={13} />
          {t("exam.mistakes", { count: mistakes, max: EXAM_MAX_MISTAKES })}
        </div>
      </div>

      {/* Rasm */}
      {question.image && (
        <div className="w-full flex justify-center mb-5">
          <div
            className="w-32 h-32 rounded-3xl bg-white flex items-center justify-center shadow-lg"
            style={{ boxShadow: "0 10px 30px rgba(108,92,231,0.25)" }}
          >
            <SignIcon code={question.image} size={104} />
          </div>
        </div>
      )}

      {/* Savol */}
      <h2 className="text-[17px] font-bold leading-snug mb-5">{question.text}</h2>

      {/* Variantlar */}
      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const isChosen = selected === i;
          const isCorrectOpt = i === question.correct;
          let stateStyle = "border-white/10 bg-white/[0.04] text-white/90";
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
              onClick={() => commitAnswer(i)}
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
    </div>
  );
}

function ExamResults({ status, answers, total, timeLeft, onRetry, onReview, onExit }) {
  const { t } = useTranslation();
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const answeredCount = answers.length;

  const config = {
    passed: {
      color: "#34D399",
      titleKey: "exam.result.passedTitle",
      subtitleKey: "exam.result.passedSubtitle",
    },
    failed_mistakes: {
      color: "#F87171",
      titleKey: "exam.result.failedTitle",
      subtitleKey: "exam.result.failedSubtitle",
    },
    failed_timeout: {
      color: ACCENT_WARM,
      titleKey: "exam.result.timeoutTitle",
      subtitleKey: "exam.result.timeoutSubtitle",
    },
  }[status];

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white flex flex-col animate-slide-in">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <h1 className="text-lg font-extrabold text-white">{t("exam.title")}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div
          className="w-40 h-40 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${config.color} ${(correctCount / total) * 100}%, rgba(255,255,255,0.08) 0)`,
          }}
        >
          <div className="w-32 h-32 rounded-full bg-[#0F1424] flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold">
              {correctCount}/{total}
            </span>
            <span className="text-gray-400 text-[11px] mt-1">
              {t("exam.answeredCount", { count: answeredCount })}
            </span>
          </div>
        </div>

        <h2 className="text-xl font-extrabold mt-6 text-center px-4" style={{ color: config.color }}>
          {t(config.titleKey)}
        </h2>
        <p className="text-gray-400 text-sm text-center mt-2 px-6 leading-relaxed">
          {t(config.subtitleKey)}
        </p>
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
          {t("exam.retry")}
        </button>
        <button onClick={onExit} className="w-full rounded-2xl py-3.5 font-bold text-sm text-gray-400">
          {t("exam.backHome")}
        </button>
      </div>
    </div>
  );
}

function ExamReview({ answers, questions, onBack }) {
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
        <h1 className="text-lg font-extrabold text-white">{t("test.reviewTitle")}</h1>
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
                  <SignIcon code={q.image} size={52} />
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
