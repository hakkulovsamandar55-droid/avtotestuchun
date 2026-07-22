import React, { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";

// Vaqtni MM:SS shaklida ko'rsatadi
export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Ogohlantirish darajalari — spec bo'yicha 10 daqiqa, 5 daqiqa, 1 daqiqa
const LEVELS = [
  { at: 60, level: "danger" },
  { at: 5 * 60, level: "warning" },
  { at: 10 * 60, level: "info" },
];

function levelFor(seconds) {
  for (const l of LEVELS) {
    if (seconds <= l.at) return l.level;
  }
  return "normal";
}

const STYLES = {
  normal: "bg-white/5 text-white/80",
  info: "bg-sky-500/15 text-sky-300",
  warning: "bg-amber-500/15 text-amber-300",
  danger: "bg-red-500/20 text-red-300 animate-pulse",
};

/**
 * Imtihon taymeri.
 *
 * MUHIM: bu taymer faqat KO'RSATISH uchun. Haqiqiy vaqt nazorati serverda
 * (ExamAttempt.expiresAt) — foydalanuvchi brauzer soatini o'zgartirsa ham
 * qo'shimcha vaqt ololmaydi.
 *
 * `serverSecondsLeft` har safar serverdan javob kelganda yangilanadi, shunda
 * uzoq imtihonda brauzer va server vaqti orasidagi farq to'planib qolmaydi.
 */
export default function ExamTimer({ serverSecondsLeft, onExpire, onWarning }) {
  const [secondsLeft, setSecondsLeft] = useState(serverSecondsLeft ?? 0);
  const expiredRef = useRef(false);
  const lastWarnedRef = useRef(null);

  // Server bilan sinxronlash
  useEffect(() => {
    if (typeof serverSecondsLeft === "number") {
      setSecondsLeft(serverSecondsLeft);
    }
  }, [serverSecondsLeft]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, onExpire]);

  // Ogohlantirishlar — har bir chegara faqat BIR MARTA ishga tushadi
  useEffect(() => {
    const level = levelFor(secondsLeft);
    if (level === "normal") return;

    const threshold = LEVELS.find((l) => l.level === level)?.at;
    if (threshold && secondsLeft <= threshold && lastWarnedRef.current !== level) {
      lastWarnedRef.current = level;
      onWarning?.(level, secondsLeft);
    }
  }, [secondsLeft, onWarning]);

  const level = levelFor(secondsLeft);

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums shrink-0 ${STYLES[level]}`}
      role="timer"
      aria-live={level === "danger" ? "assertive" : "off"}
    >
      <Timer size={14} />
      {formatDuration(secondsLeft)}
    </div>
  );
}
