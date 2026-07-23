import React from "react";

// Yo'l belgisi ikonkasi.
//
// Rasmlar yagona manba: src/assets/signs/<kod>.png
// Barchasi bir xil normallashtirilgan — 320x320, shaffof fon, nisbati saqlangan.
// Ilgari bu yerda ~1400 qator qo'lda chizilgan SVG piktogramma bor edi;
// ular haqiqiy belgilarga mos kelmagani uchun olib tashlandi.
const signImages = import.meta.glob("../assets/signs/*.png", {
  eager: true,
  import: "default",
});

const IMAGE_BY_CODE = {};
for (const path in signImages) {
  const code = path.split("/").pop().replace(".png", "");
  IMAGE_BY_CODE[code] = signImages[path];
}

export function hasSignImage(code) {
  return Boolean(code && IMAGE_BY_CODE[code]);
}

/**
 * @param {string} code  Belgi kodi, masalan "3.24"
 * @param {number} size  Piksel o'lchami (kvadrat konteyner)
 * `shape` va `pic` proplari orqaga moslik uchun qabul qilinadi, lekin
 * endi ishlatilmaydi — chaqiruv joylarini o'zgartirish shart emas.
 */
export default function SignIcon({ code, size = 64, alt }) {
  const src = code ? IMAGE_BY_CODE[code] : undefined;

  if (!src) {
    // Rasm topilmadi — layout siljimasligi uchun neytral joy egallovchi.
    return (
      <div
        role="img"
        aria-label={alt || code || "belgi"}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.12,
          background: "rgba(127,127,127,0.10)",
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || code}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
