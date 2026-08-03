import React from "react";
import SignIcon, { hasSignImage } from "./SignIcon";
import TicketQuestionImage, { hasQuestionImage } from "./TicketQuestionImage";

// Savol rasmi — YAGONA chaqiruv nuqtasi.
//
// `question.image` IKKI XIL bo'lishi mumkin:
//   1) sahna rasmi — "t12-3.webp" (chorraha sxemasi va h.k.),
//      src/assets/newQuestions/ ichida;
//   2) yo'l belgisi kodi — "3.24", src/assets/signs/ ichida.
//
// Ilgari har bir ekran buni o'zi ajratardi. Rasmiy imtihon (QuestionCard)
// va duel ekranida bu ajratish yo'q edi — ular har qanday rasmni belgi kodi
// deb SignIcon'ga uzatardi. Savol bazasidagi rasmlarning HAMMASI ".webp"
// bo'lgani uchun SignIcon ularni topa olmasdi va imtihonda rasm o'rniga
// bo'sh kulrang joy ko'rinardi. Endi mantiq shu bitta komponentda.
export function isSceneImage(image) {
  return typeof image === "string" && /\.webp$/i.test(image);
}

/**
 * @param {string} image           Savol rasmi ("t12-3.webp" yoki "3.24")
 * @param {number} [signSize]      Belgi uchun piksel o'lchami
 * @param {number} [sceneMaxHeight] Sahna rasmi uchun balandlik chegarasi
 * @param {string} [alt]
 */
export default function QuestionImage({
  image,
  signSize = 104,
  sceneMaxHeight = 260,
  alt,
}) {
  if (!image) return null;

  const scene = isSceneImage(image);

  // Rasm topilmasa — ramka ham chizilmaydi, aks holda bo'sh oq quti
  // qolib ketardi.
  if (scene ? !hasQuestionImage(image) : !hasSignImage(image)) return null;

  return (
    <div className="w-full flex justify-center mb-5">
      <div
        className={`rounded-3xl bg-white flex items-center justify-center shadow-lg ${
          scene ? "w-full max-w-[280px] p-2" : "w-32 h-32"
        }`}
        style={{ boxShadow: "0 10px 30px rgba(108,92,231,0.25)" }}
      >
        {scene ? (
          <TicketQuestionImage
            questionId={image}
            maxHeight={sceneMaxHeight}
            alt={alt}
          />
        ) : (
          <SignIcon code={image} size={signSize} alt={alt} />
        )}
      </div>
    </div>
  );
}
