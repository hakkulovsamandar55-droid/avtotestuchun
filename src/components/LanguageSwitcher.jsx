import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { LANGUAGES } from "../i18n";

// Til tanlovchi — ikki ko'rinishda ishlaydi:
//  variant="dark"  -> Login ekrani uchun (tim fon ustida)
//  variant="row"   -> Sozlamalar ro'yxatidagi qator sifatida
export default function LanguageSwitcher({ variant = "row" }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const currentLabel = t(`languageNames.${i18n.language}`);

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  const Dropdown = () => (
    <div
      className={`absolute z-30 mt-2 w-56 rounded-2xl overflow-hidden shadow-xl ${
        variant === "dark"
          ? "bg-[#17171F] border border-white/10"
          : "bg-white border border-gray-100"
      } ${variant === "dark" ? "right-0" : "right-0"}`}
    >
      {LANGUAGES.map(({ code, nativeKey }) => {
        const active = i18n.language === code;
        return (
          <button
            key={code}
            onClick={() => handleSelect(code)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${
              variant === "dark"
                ? "text-white/80 hover:bg-white/5"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>{t(`languageNames.${nativeKey}`)}</span>
            {active && (
              <Check
                size={16}
                color={variant === "dark" ? "#A855F7" : "#6C5CE7"}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  if (variant === "dark") {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70"
        >
          <Globe size={13} />
          {currentLabel}
        </button>
        {open && <Dropdown />}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3.5 text-left"
      >
        <Globe size={18} color="#4B5563" />
        <span className="flex-1 font-medium text-gray-900 text-sm">
          {t("settings.language")}
        </span>
        <span className="text-gray-400 text-sm">{currentLabel}</span>
      </button>
      {open && <Dropdown />}
    </div>
  );
}
