import React, { createContext, useContext, useEffect, useState } from "react";

// Shrift o'lchami — Theme'dan mustaqil, chunki ular boshqa-boshqa narsa
// (rang va o'lcham). <html> elementining font-size'ini o'zgartiramiz —
// Tailwind barcha text-* klasslari rem asosida ishlagani uchun, bitta joyda
// o'zgartirish butun ilova bo'ylab proporsional ta'sir qiladi.
const FontSizeContext = createContext(null);
const STORAGE_KEY = "tezprava-font-size";

export const FONT_SIZES = {
  small: { key: "small", rootPx: 14 },
  medium: { key: "medium", rootPx: 16 },
  large: { key: "large", rootPx: 18 },
};

const FONT_SIZE_ORDER = ["small", "medium", "large"];

function getInitialFontSize() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && FONT_SIZES[saved]) return saved;
  } catch (e) {
    // localStorage yo'q bo'lishi mumkin — jim o'tkazamiz
  }
  return "medium";
}

export function FontSizeProvider({ children }) {
  const [fontSizeKey, setFontSizeKey] = useState(getInitialFontSize);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${FONT_SIZES[fontSizeKey].rootPx}px`;
    root.setAttribute("data-font-size", fontSizeKey);

    try {
      localStorage.setItem(STORAGE_KEY, fontSizeKey);
    } catch (e) {
      // saqlab bo'lmasa ham ilova ishlashda davom etadi
    }
  }, [fontSizeKey]);

  return (
    <FontSizeContext.Provider
      value={{
        fontSizeKey,
        setFontSizeKey,
        fontSizeList: FONT_SIZE_ORDER.map((key) => FONT_SIZES[key]),
      }}
    >
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize faqat FontSizeProvider ichida ishlatilishi kerak");
  return ctx;
}
