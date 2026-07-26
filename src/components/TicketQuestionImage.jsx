import React from "react";

// Bilet savoliga biriktirilgan rasm (chorraha sxemasi, belgi joylashuvi va h.k.).
//
// Rasmlar yagona manba: src/assets/newQuestions/t<bilet>-<savol>.webp
// Har bir savolda rasm bo'lishi shart emas — ko'p savol faqat matndan
// iborat (masalan huquqiy/nazariy savollar).
const questionImages = import.meta.glob("../assets/newQuestions/*.webp", {
  eager: true,
  import: "default",
});

const IMAGE_BY_KEY = {};
for (const path in questionImages) {
  const key = path.split("/").pop().replace(".webp", ""); // "t1-1"
  IMAGE_BY_KEY[key] = questionImages[path];
}

export function hasQuestionImage(questionId) {
  return Boolean(questionId && IMAGE_BY_KEY[questionId]);
}

/**
 * @param {string} questionId  Savol ID'si, masalan "t1-1"
 * @param {number} [maxHeight] Piksel balandlik chegarasi
 */
export default function TicketQuestionImage({ questionId, maxHeight = 220, alt }) {
  const src = questionId && IMAGE_BY_KEY[questionId];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      className="w-full rounded-2xl object-contain bg-card-soft"
      style={{ maxHeight }}
    />
  );
}
