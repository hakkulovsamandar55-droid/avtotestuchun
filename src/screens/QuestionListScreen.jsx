import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Bookmark, BookmarkCheck, Loader2, Check, X } from "lucide-react";
import { getAllQuestions } from "../../shared/data/ticketsData";
import { api } from "../api";

/**
 * SAVOLLAR RO'YXATI — uch bo'lim uchun umumiy komponent:
 *   - Saqlangan savollar
 *   - Mening xatolarim
 *   - Ko'pchilik xato qiladigan savollar
 *
 * NIMA UCHUN BITTA KOMPONENT: uchalasi ham "savol ID lari ro'yxati" ni
 * ko'rsatadi, faqat manba va qo'shimcha ma'lumot farq qiladi. Uchta alohida
 * ekran yozish kodni uch marta takrorlash bo'lardi.
 *
 * SAVOL MATNI SERVERDAN KELMAYDI — faqat ID keladi, matn mahalliy
 * ticketsData dan olinadi. Sabab: 1220 savol matni allaqachon ilova ichida,
 * ularni tarmoq orqali qayta yuklash ma'nosiz trafik.
 */
export default function QuestionListScreen({ mode, onBack }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // ID -> savol xaritasi. useMemo: 1220 savoldan Map yasash arzon emas,
  // har render'da qayta qurmaslik kerak.
  const questionById = useMemo(() => {
    const map = new Map();
    for (const q of getAllQuestions(i18n.language)) map.set(q.id, q);
    return map;
  }, [i18n.language]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Saqlanganlar ro'yxati har uch rejimda kerak — "saqlangan" nishonini
      // to'g'ri ko'rsatish uchun.
      const savedRes = await api.getSavedQuestions();
      const saved = new Set((savedRes.saved || []).map((s) => s.questionId));
      setSavedIds(saved);

      if (mode === "saved") {
        setItems((savedRes.saved || []).map((s) => ({ questionId: s.questionId })));
      } else if (mode === "mistakes") {
        const res = await api.getMyMistakes();
        setItems(res.mistakes || []);
      } else if (mode === "hardest") {
        const res = await api.getHardestQuestions();
        setItems(res.questions || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSave = useCallback(
    async (questionId) => {
      setBusyId(questionId);
      const wasSaved = savedIds.has(questionId);
      try {
        if (wasSaved) {
          await api.unsaveQuestion(questionId);
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(questionId);
            return next;
          });
          // Saqlanganlar ro'yxatida turgan savol olib tashlansa, ro'yxatdan
          // ham chiqadi — aks holda foydalanuvchi "o'chirdim, lekin turibdi"
          // holatini ko'radi.
          if (mode === "saved") {
            setItems((prev) => prev.filter((i) => i.questionId !== questionId));
          }
        } else {
          await api.saveQuestion(questionId);
          setSavedIds((prev) => new Set(prev).add(questionId));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setBusyId(null);
      }
    },
    [savedIds, mode]
  );

  const title =
    mode === "saved"
      ? t("home.savedQuestions")
      : mode === "mistakes"
        ? t("mistakes.myMistakes")
        : t("mistakes.commonMistakes");

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 animate-slide-in">
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card-soft border border-card-border flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={17} color="var(--icon-muted)" />
        </button>
        <h1 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin" color="var(--icon-muted)" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : items.length === 0 ? (
        <EmptyState mode={mode} t={t} />
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const q = questionById.get(item.questionId);
            // Savol topilmasa (baza yangilanib, ID o'zgargan bo'lsa) —
            // ekranni buzmasdan o'tkazamiz.
            if (!q) return null;
            return (
              <QuestionCard
                key={item.questionId}
                question={q}
                meta={item}
                mode={mode}
                isSaved={savedIds.has(item.questionId)}
                busy={busyId === item.questionId}
                onToggleSave={() => toggleSave(item.questionId)}
                t={t}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ mode, t }) {
  const text =
    mode === "saved"
      ? t("home.noSavedYet")
      : mode === "mistakes"
        ? t("mistakes.noMistakesYet")
        : t("mistakes.noDataYet");
  return (
    <div className="text-center py-16 px-6">
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {text}
      </p>
    </div>
  );
}

function QuestionCard({ question, meta, mode, isSaved, busy, onToggleSave, t }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-2xl bg-card border border-card-border p-4">
      <div className="flex items-start gap-3">
        <p
          className="flex-1 text-[12.5px] leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {question.text}
        </p>
        <button
          onClick={onToggleSave}
          disabled={busy}
          className="shrink-0 w-8 h-8 rounded-full bg-card-soft flex items-center justify-center disabled:opacity-50"
          aria-label={isSaved ? t("question.unsave") : t("question.save")}
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" color="var(--icon-muted)" />
          ) : isSaved ? (
            <BookmarkCheck size={15} color="var(--accent-from)" />
          ) : (
            <Bookmark size={15} color="var(--icon-muted)" />
          )}
        </button>
      </div>

      {/* Qo'shimcha ma'lumot — rejimga qarab */}
      <div className="flex items-center gap-3 mt-2.5">
        {mode === "mistakes" && meta.wrongCount > 0 && (
          <span className="text-[10px]" style={{ color: "#F87171" }}>
            {t("mistakes.wrongTimes", { count: meta.wrongCount })}
          </span>
        )}
        {mode === "hardest" && meta.wrongPct != null && (
          <span className="text-[10px]" style={{ color: "#F87171" }}>
            {t("mistakes.wrongPctLine", { pct: meta.wrongPct })}
          </span>
        )}
        <button
          onClick={() => setRevealed((v) => !v)}
          className="text-[10px] font-semibold underline"
          style={{ color: "var(--accent-from)" }}
        >
          {revealed ? t("question.hideAnswer") : t("question.showAnswer")}
        </button>
      </div>

      {revealed && (
        <div className="mt-3 space-y-1.5">
          {question.options.map((opt, i) => {
            const ok = i === question.correct;
            return (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl px-3 py-2"
                style={{
                  background: ok ? "rgba(16,185,129,0.14)" : "var(--bg-card-soft)",
                  border: ok ? "1px solid rgba(16,185,129,0.4)" : "1px solid transparent",
                }}
              >
                {ok ? (
                  <Check size={13} color="#34D399" className="shrink-0 mt-0.5" />
                ) : (
                  <X size={13} color="var(--chevron)" className="shrink-0 mt-0.5" />
                )}
                <span
                  className="text-[11.5px] leading-snug"
                  style={{ color: ok ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  {opt}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
