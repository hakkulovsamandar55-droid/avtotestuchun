import React from "react";
import { useTranslation } from "react-i18next";
import { Home, BarChart3, Settings } from "lucide-react";
import { ACCENT_FROM } from "../theme";

// Pastki navigatsiya — 3 bo'lim: O'rganish / Statistika / Sozlamalar
export default function BottomNav({ active, setActive }) {
  const { t } = useTranslation();
  const items = [
    { key: "home", label: t("nav.home"), icon: Home },
    { key: "stats", label: t("nav.stats"), icon: BarChart3 },
    { key: "settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <div className="flex border-t border-black/5 bg-white px-2 pt-2 pb-6">
      {items.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => setActive(key)}
            className="flex-1 flex flex-col items-center gap-1 py-1 active:scale-95 transition-transform"
          >
            <Icon
              size={22}
              strokeWidth={2}
              color={isActive ? ACCENT_FROM : "#9CA3AF"}
              className="transition-colors duration-200"
            />
            <span
              className="text-[11px] font-medium transition-colors duration-200"
              style={{ color: isActive ? ACCENT_FROM : "#9CA3AF" }}
            >
              {label}
            </span>
            <span
              className="w-1 h-1 rounded-full mt-0.5 transition-all duration-200"
              style={{
                backgroundColor: ACCENT_FROM,
                opacity: isActive ? 1 : 0,
                transform: isActive ? "scale(1)" : "scale(0)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
