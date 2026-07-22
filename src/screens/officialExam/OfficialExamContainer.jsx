import React, { useState } from "react";
import OfficialExamIntro from "./OfficialExamIntro";
import OfficialExamScreen from "./OfficialExamScreen";
import OfficialExamResult from "./OfficialExamResult";
import OfficialExamReview from "./OfficialExamReview";
import ExamHistoryScreen from "./ExamHistoryScreen";
import LeaderboardScreen from "./LeaderboardScreen";

/**
 * Rasmiy imtihon oqimini boshqaruvchi konteyner.
 *
 *   intro -> exam -> result -> review
 *     |-> history -> review
 *     |-> leaderboard
 *
 * Holat shu yerda saqlanadi, ekranlar esa "toza" (faqat ko'rsatish bilan
 * shug'ullanadi) — shunda har bir ekranni alohida sinash oson bo'ladi.
 */
export default function OfficialExamContainer({ onExit, onOpenPremium }) {
  const [stage, setStage] = useState("intro");
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  // Review qaysi ekrandan ochilganini eslab qolamiz — "Orqaga" to'g'ri joyga
  // qaytishi uchun (natijadan yoki tarixdan)
  const [reviewExamId, setReviewExamId] = useState(null);
  const [reviewOrigin, setReviewOrigin] = useState("result");

  function handleExamReady(activeExam) {
    setExam(activeExam);
    setResult(null);
    setAutoSubmitted(false);
    setStage("exam");
  }

  function handleFinished(examResult, { auto } = {}) {
    setResult(examResult);
    setAutoSubmitted(Boolean(auto));
    setStage("result");
  }

  function openReview(examId, origin) {
    setReviewExamId(examId);
    setReviewOrigin(origin);
    setStage("review");
  }

  if (stage === "exam" && exam) {
    return (
      <OfficialExamScreen
        exam={exam}
        onFinished={handleFinished}
        onExit={() => setStage("intro")}
      />
    );
  }

  if (stage === "result" && result) {
    return (
      <OfficialExamResult
        result={result}
        autoSubmitted={autoSubmitted}
        onReview={() => openReview(result.id, "result")}
        onRetry={() => setStage("intro")}
        onExit={onExit}
      />
    );
  }

  if (stage === "review" && reviewExamId) {
    return (
      <OfficialExamReview
        examId={reviewExamId}
        onBack={() => setStage(reviewOrigin)}
      />
    );
  }

  if (stage === "history") {
    return (
      <ExamHistoryScreen
        onBack={() => setStage("intro")}
        onOpenReview={(id) => openReview(id, "history")}
      />
    );
  }

  if (stage === "leaderboard") {
    return <LeaderboardScreen onBack={() => setStage("intro")} />;
  }

  return (
    <OfficialExamIntro
      onBack={onExit}
      onExamReady={handleExamReady}
      onOpenHistory={() => setStage("history")}
      onOpenLeaderboard={() => setStage("leaderboard")}
      onOpenPremium={onOpenPremium}
    />
  );
}
