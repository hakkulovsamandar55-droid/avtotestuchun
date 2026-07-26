import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, X, RotateCcw, Trophy } from "lucide-react";
import { generateSignsQuiz } from "../../shared/data/signsQuiz";
import SignIcon from "../components/SignIcon";
import { api } from "../api";

/**
 * YO'L BELGILARI TESTI.
 *
 * PEDAGOGIK QARORLAR:
 *
 * 1) DARHOL FIKR-MULOHAZA. Javob tanlangach natija shu zahoti ko'rsatiladi
 *    (to'g'ri yashil, xato qizil + to'g'risi belgilanadi). Sabab: belgilarni
 *    o'rganishda xatoni DARHOL bilish eng samarali — imtihon oxirida
 *    ko'rsatilsa, foydalanuvchi qaysi belgi ekanini eslamaydi.
 *    Bu rasmiy imtihondan farq qiladi (u yerda natija oxirida chiqadi,
 *    chunki maqsad — haqiqiy sharoitni takrorlash).
 *
 * 2) XATO QILINGANLAR ESLAB QOLINADI. Test oxirida "faqat xatolarni qayta
 *    ishlash" tugmasi chiqadi — bu takrorlash orqali o'rganish (spaced
 *    repetition) ning sodda ko'rinishi.
 *
 * 3) ORQAGA QAYTISH YO'Q. Javob berilgach o'zgartirib bo'lmaydi — aks holda
 *    foydalanuvchi to'g'ri javobni ko'rib, orqaga qaytib "to'g'rilaydi" va
 *    natija ma'nosini yo'qotadi.
 */
export default function SignsQuizScreen({ category = null, onBack }) {
  const { t } = useTranslation();

  const [seed, setSeed] = useState(0);
  const [focusCodes, setFocusCodes] = useState([]);

  // useMemo — savollar faqat seed o'zgarganda qayta yaratiladi.
  // Aks holda har render'da yangi savollar chiqib, javob berish imkonsiz bo'lardi.
  const questions = useMemo(
    () => generateSignsQuiz({ category, focusCodes }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, seed]
  );

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [answers, setAnswers] = useState([]); // { code, correct }
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  const handleChoose = useCallback(
    (optIndex) => {
      if (chosen !== null || !q) return; // ikkinchi marta bosishni to'sadi
      setChosen(optIndex);
      setAnswers((prev) => [
        ...prev,
        { code: q.signCode, correct: optIndex === q.correctIndex },
      ]);
    },
    [chosen, q]
  );

  const handleNext = useCallback(() => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      // Natijani serverga yuboramiz — agar o'qituvchi "belgilarni o'rgan"
      // vazifasini bergan bo'lsa, u avtomatik yopiladi.
      // Xato bo'lsa jim o'tkazamiz: test allaqachon tugagan, foydalanuvchiga
      // tarmoq xatosini ko'rsatish natijani ko'rishga xalaqit beradi.
      const correct = answers.filter((a) => a.correct).length;
      if (answers.length > 0) {
        api
          .submitSignsQuiz(correct, answers.length, category)
          .catch(() => {});
      }
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
  }, [index, questions.length, answers, category]);

  const restart = useCallback((onlyWrong) => {
    const wrong = answers.filter((a) => !a.correct).map((a) => a.code);
    setFocusCodes(onlyWrong ? wrong : []);
    setAnswers([]);
    setIndex(0);
    setChosen(null);
    setFinished(false);
    setSeed((s) => s + 1);
  }, [answers]);

  if (questions.length === 0) {
    return (
      <Shell onBack={onBack} title={t("signsQuiz.title")}>
        <p className="text-center text-sm py-16" style={{ color: "var(--text-secondary)" }}>
          {t("signsQuiz.notEnoughSigns")}
        </p>
      </Shell>
    );
  }

  if (finished) {
    const correct = answers.filter((a) => a.correct).length;
    const total = answers.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wrongCount = total - correct;

    return (
      <Shell onBack={onBack} title={t("signsQuiz.title")}>
        <div className="rounded-[26px] bg-card border border-card-border p-6 text-center mt-4">
          <div
            className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
            }}
          >
            <Trophy size={24} color="#fff" />
          </div>
          <p
            className="text-[34px] font-extrabold mt-4 tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {pct}%
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {t("signsQuiz.resultLine", { correct, total })}
          </p>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {pct >= 90
              ? t("signsQuiz.tierExcellent")
              : pct >= 70
                ? t("signsQuiz.tierGood")
                : t("signsQuiz.tierWeak")}
          </p>
        </div>

        {wrongCount > 0 && (
          <button
            onClick={() => restart(true)}
            className="w-full mt-3 rounded-[19px] py-4 font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
            }}
          >
            <RotateCcw size={16} />
            {t("signsQuiz.retryWrong", { count: wrongCount })}
          </button>
        )}

        <button
          onClick={() => restart(false)}
          className="w-full mt-2.5 rounded-[19px] py-4 font-bold text-sm bg-card border border-card-border"
          style={{ color: "var(--text-primary)" }}
        >
          {t("signsQuiz.newQuiz")}
        </button>
      </Shell>
    );
  }

  const isAnswered = chosen !== null;
  const wasCorrect = isAnswered && chosen === q.correctIndex;

  return (
    <Shell onBack={onBack} title={t("signsQuiz.title")}>
      {/* Progress */}
      <div className="flex items-center gap-3 mt-1">
        <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--track)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((index + (isAnswered ? 1 : 0)) / questions.length) * 100}%`,
              background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))",
            }}
          />
        </div>
        <span
          className="text-[11px] font-bold tabular-nums shrink-0"
          style={{ color: "var(--text-secondary)" }}
        >
          {index + 1}/{questions.length}
        </span>
      </div>

      {/* Savol */}
      <div className="rounded-[26px] bg-card border border-card-border p-5 mt-4">
        {q.kind === "nameFromSign" ? (
          <>
            <div className="flex justify-center py-2">
              <SignIcon code={q.signCode} size={112} alt={t("signsQuiz.questionWhatIs")} />
            </div>
            <p
              className="text-center text-sm font-bold mt-3"
              style={{ color: "var(--text-primary)" }}
            >
              {t("signsQuiz.questionWhatIs")}
            </p>
          </>
        ) : (
          <>
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("signsQuiz.questionWhichSign")}
            </p>
            <p
              className="text-center text-[15px] font-bold mt-2.5 leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {q.prompt}
            </p>
          </>
        )}
      </div>

      {/* Variantlar */}
      <div className={q.kind === "signFromName" ? "grid grid-cols-2 gap-2.5 mt-3" : "mt-3 space-y-2.5"}>
        {q.options.map((opt, i) => (
          <Option
            key={opt.code}
            option={opt}
            kind={q.kind}
            state={
              !isAnswered
                ? "idle"
                : i === q.correctIndex
                  ? "correct"
                  : i === chosen
                    ? "wrong"
                    : "dim"
            }
            onClick={() => handleChoose(i)}
          />
        ))}
      </div>

      {/* Fikr-mulohaza + keyingi */}
      {isAnswered && (
        <div className="mt-4">
          {!wasCorrect && (
            <div
              className="rounded-2xl px-4 py-3 mb-3 flex items-start gap-2.5"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <X size={15} color="#F87171" className="shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: "#F87171" }}>
                  {t("signsQuiz.wrongAnswer")}
                </p>
                <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {q.options[q.correctIndex].name}
                  <span className="opacity-60"> · {q.options[q.correctIndex].code}</span>
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full rounded-[19px] py-4 font-bold text-sm text-white"
            style={{
              background: wasCorrect
                ? "linear-gradient(135deg, var(--exam-from), var(--exam-to))"
                : "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
            }}
          >
            {index + 1 >= questions.length ? t("signsQuiz.finish") : t("signsQuiz.next")}
          </button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, onBack, title }) {
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
      {children}
    </div>
  );
}

function Option({ option, kind, state, onClick }) {
  // MUHIM TUZATISH: variant foni avval faqat shaffof rang (16%) +
  // backdrop-filter edi. Ba'zi Telegram WebView versiyalarida
  // backdrop-filter ishlamaydi yoki noto'g'ri render bo'ladi — natijada
  // orqadagi shaffof rang tungi fonga qorishib, matn deyarli o'chib
  // qolardi (bosilgan xato/to'g'ri variant matni ko'rinmasdi).
  //
  // Yechim ikki qavatli:
  //   1) Fon rangi shaffoflikdan qat'i nazar yetarli quyuq bo'lishi uchun
  //      solid (aralashtirilgan) rang ishlatiladi — backdrop-filter
  //      ishlamasa ham fon o'zi ko'rinadi.
  //   2) Matnga yengil soya — chegara holatlarda (masalan fon va matn
  //      tasodifan yaqin tusda bo'lib qolsa) qo'shimcha ajratish beradi.
  const styles = {
    idle: { border: "var(--border-card)", bg: "var(--bg-card)", opacity: 1 },
    correct: {
      border: "rgba(16,185,129,0.6)",
      bg: "color-mix(in srgb, rgb(16,185,129) 22%, var(--bg-card))",
      opacity: 1,
    },
    wrong: {
      border: "rgba(239,68,68,0.6)",
      bg: "color-mix(in srgb, rgb(239,68,68) 22%, var(--bg-card))",
      opacity: 1,
    },
    dim: { border: "var(--border-card)", bg: "var(--bg-card)", opacity: 0.45 },
  }[state];

  const isSignOption = kind === "signFromName";

  return (
    <button
      onClick={onClick}
      disabled={state !== "idle"}
      className={`w-full text-left rounded-2xl border transition-all ${
        isSignOption ? "p-3 flex flex-col items-center gap-2" : "px-4 py-3.5 flex items-center gap-3"
      }`}
      style={{
        borderColor: styles.border,
        background: styles.bg,
        opacity: styles.opacity,
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
      }}
    >
      {isSignOption ? (
        <>
          <SignIcon code={option.code} size={72} alt={option.name} />
          <span className="text-[10px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
            {option.code}
          </span>
        </>
      ) : (
        <>
          <span
            className="flex-1 text-[12.5px] leading-snug"
            style={{
              color: "var(--text-primary)",
              // Zaxira: fon va matn tasodifan yaqin tusda bo'lib qolsa
              // (masalan backdrop-filter ishlamagan eski qurilmada) ham
              // matn kontursi bilan ajralib turadi.
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            }}
          >
            {option.name}
          </span>
          {state === "correct" && <Check size={16} color="#34D399" className="shrink-0" />}
          {state === "wrong" && <X size={16} color="#F87171" className="shrink-0" />}
        </>
      )}
    </button>
  );
}
