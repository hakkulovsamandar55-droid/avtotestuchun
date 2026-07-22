import React from "react";

/**
 * Savollar bo'ylab navigatsiya paneli.
 *
 * 🟩 javob berilgan · ⬜ javob berilmagan · joriy savol ajratib ko'rsatiladi
 *
 * Rasmiy imtihonda foydalanuvchi savollar orasida erkin yura oladi va
 * o'tkazib yuborilganlariga qaytishi mumkin — shuning uchun bu panel
 * shunchaki bezak emas, asosiy navigatsiya vositasi.
 */
export default function QuestionNavigator({
  total,
  currentIndex,
  answers,
  onSelect,
}) {
  return (
    <div className="grid grid-cols-10 gap-1.5" role="navigation">
      {Array.from({ length: total }, (_, i) => {
        const isAnswered = answers[String(i)] !== undefined;
        const isCurrent = i === currentIndex;

        let cls = "border-white/15 bg-white/[0.04] text-white/50";
        if (isAnswered) cls = "border-emerald-500/50 bg-emerald-500/20 text-emerald-200";
        if (isCurrent) cls = "border-white bg-white text-[#0F1424] font-extrabold";

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Savol ${i + 1}${isAnswered ? " (javob berilgan)" : ""}`}
            aria-current={isCurrent ? "true" : undefined}
            className={`aspect-square rounded-lg border text-[11px] font-bold flex items-center justify-center transition-colors active:scale-95 ${cls}`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
