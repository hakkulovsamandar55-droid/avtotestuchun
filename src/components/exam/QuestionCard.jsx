import React from "react";
import { Check, X, Info, MinusCircle } from "lucide-react";
import SignIcon from "../SignIcon";

/**
 * Savol kartasi — ikki rejimda ishlaydi:
 *
 *  mode="answering" — imtihon davomida. To'g'ri javob KO'RSATILMAYDI
 *    (server ham uni yubormaydi). Faqat foydalanuvchi nimani tanlagani
 *    belgilanadi.
 *
 *  mode="review" — imtihon yakunlangandan keyin. To'g'ri javob, foydalanuvchi
 *    javobi va izoh (agar bo'lsa) ko'rsatiladi.
 *
 * Bitta komponent ikkala holatda ishlatilgani uchun ko'rinish bir xil bo'ladi
 * va kod takrorlanmaydi.
 */
export default function QuestionCard({
  question,
  mode = "answering",
  chosenIndex = null,
  onChoose,
  explanationLabel,
  correctAnswerLabel,
  yourAnswerLabel,
  skippedLabel,
}) {
  const isReview = mode === "review";
  const correctIndex = isReview ? question.correctIndex : null;

  return (
    <div>
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

      <h2 className="text-[17px] font-bold leading-snug mb-5 text-white">
        {question.text}
      </h2>

      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const isChosen = chosenIndex === i;
          const isCorrectOpt = isReview && i === correctIndex;

          // Javob berish rejimi: faqat tanlanganini ajratamiz, to'g'ri/xato
          // haqida hech qanday ishora bermaymiz.
          let cls = "border-white/10 bg-white/[0.04] text-white/90";
          let icon = null;

          if (!isReview && isChosen) {
            cls = "border-white/70 bg-white/[0.12] text-white";
          }

          if (isReview) {
            if (isCorrectOpt) {
              cls = "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
              icon = <Check size={18} className="shrink-0" color="#34D399" />;
            } else if (isChosen) {
              cls = "border-red-500/60 bg-red-500/10 text-red-300";
              icon = <X size={18} className="shrink-0" color="#F87171" />;
            } else {
              cls = "border-white/5 bg-white/[0.02] text-white/40";
            }
          }

          return (
            <button
              key={i}
              onClick={() => !isReview && onChoose?.(i)}
              disabled={isReview}
              className={`w-full text-left rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-colors ${cls} ${
                isReview ? "" : "active:scale-[0.99]"
              }`}
            >
              <span className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-sm leading-snug">{opt}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {isReview && question.isSkipped && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3">
          <MinusCircle size={15} className="mt-0.5 shrink-0" color="#9CA3AF" />
          <p className="text-xs text-gray-400 leading-relaxed">{skippedLabel}</p>
        </div>
      )}

      {/* Izoh ixtiyoriy — savol bazasida hozircha yo'q, bosqichma-bosqich
          qo'shiladi. Bo'lmasa bu blok umuman ko'rinmaydi. */}
      {isReview && question.explanation && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-sky-500/10 border border-sky-500/25 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0" color="#7DD3FC" />
          <div>
            <p className="text-[11px] font-bold text-sky-300 uppercase tracking-wide mb-1">
              {explanationLabel}
            </p>
            <p className="text-xs text-sky-100/80 leading-relaxed">
              {question.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
