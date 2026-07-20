import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, HelpCircle, Send, ChevronRight, ShieldCheck, Crown, Check } from "lucide-react";
import { ACCENT_FROM } from "../theme";
import { useTheme } from "../ThemeContext";
import { showComingSoon } from "../api";
import LanguageSwitcher from "../components/LanguageSwitcher";

function PremiumRow({ onClick }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left shadow-sm active:scale-[0.99] transition-transform"
      style={{
        background: "linear-gradient(90deg, #F5C542, #E0A62E, #C9982B)",
      }}
    >
      <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center shrink-0">
        <Crown size={18} color="#3B2C00" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-[#3B2C00] text-sm">
          {t("settings.premium")}
        </p>
        <p className="text-[#5C4600] text-xs">{t("settings.premiumSubtitle")}</p>
      </div>
      <ChevronRight size={18} color="#3B2C00" />
    </button>
  );
}

function SettingsRow({ icon: Icon, label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5 text-left active:scale-[0.99] transition-transform"
    >
      <Icon size={18} color="var(--icon-muted)" />
      <span className="flex-1 font-medium text-text-main text-sm">
        {label}
      </span>
      {value && <span className="text-text-muted text-sm">{value}</span>}
      <ChevronRight size={18} color="var(--chevron)" />
    </button>
  );
}

// Har bir tema uchun kichik doiraviy preview — accent rangi va fon rangidan hosil bo'ladi
function ThemeSwatch({ item, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center relative"
        style={{
          background: `linear-gradient(135deg, ${item.accentFrom}, ${item.accentTo})`,
          boxShadow: isActive ? `0 0 0 2px var(--bg-app), 0 0 0 4px ${item.accentFrom}` : "none",
        }}
      >
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: item.vars["--bg-app"] }}
        />
        {isActive && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Check size={16} color={item.isDark ? "#FFFFFF" : "#111827"} strokeWidth={3} />
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium text-text-muted">{item.label}</span>
    </button>
  );
}

function ThemePickerRow() {
  const { t } = useTranslation();
  const { themeKey, setThemeKey, themeList } = useTheme();
  // Bosilgan swatch darhol qo'llanmaydi — avval "tanlangan" holatga o'tadi,
  // faqat "Qo'llash" tugmasi bosilganda haqiqiy tema almashadi.
  const [pendingKey, setPendingKey] = useState(null);
  const displayedKey = pendingKey ?? themeKey;
  const hasPendingChange = pendingKey !== null && pendingKey !== themeKey;

  function applyTheme() {
    if (pendingKey && pendingKey !== themeKey) {
      setThemeKey(pendingKey);
    }
    setPendingKey(null);
  }

  return (
    <div className="w-full rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5">
      <p className="font-medium text-text-main text-sm mb-3">{t("settings.theme")}</p>
      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        {themeList.map((item) => (
          <ThemeSwatch
            key={item.key}
            item={item}
            isActive={item.key === displayedKey}
            onClick={() => setPendingKey(item.key)}
          />
        ))}
      </div>
      {hasPendingChange && (
        <button
          onClick={applyTheme}
          className="w-full mt-3.5 rounded-xl py-2.5 font-bold text-white text-sm active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
        >
          {t("settings.applyTheme")}
        </button>
      )}
    </div>
  );
}

// 3c-EKRAN: "Sozlamalar" bo'limi
export default function SettingsTab({ user, onOpenAdmin, onOpenPremium }) {
  const { t } = useTranslation();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-4 animate-fade-in">
      <h1 className="text-xl font-extrabold text-text-main text-center mb-5">
        {t("settings.title")}
      </h1>

      <div className="rounded-3xl bg-card border border-card-border shadow-sm p-5 flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
          style={{ backgroundColor: ACCENT_FROM }}
        >
          S
        </div>
        <div>
          <p className="font-bold text-text-main">{user?.name || "—"}</p>
          <p className="text-text-muted text-sm">
            {user?.username ? `@${user.username}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <PremiumRow onClick={onOpenPremium} />
        <LanguageSwitcher variant="row" />
        <ThemePickerRow />
        <SettingsRow
          icon={Bell}
          label={t("settings.notifications")}
          value={t("settings.on")}
          onClick={() => showComingSoon(t("settings.notificationsComingSoon"))}
        />
        <SettingsRow
          icon={HelpCircle}
          label={t("settings.support")}
          onClick={() => showComingSoon(t("settings.supportComingSoon"))}
        />
      </div>

      <div
        className="mt-3 rounded-2xl px-4 py-4 flex items-center gap-3 text-white"
        style={{ background: "linear-gradient(90deg,#0EA5E9,#0369A1)" }}
      >
        <Send size={18} />
        <div className="flex-1">
          <p className="font-bold text-sm">{t("settings.channelTitle")}</p>
          <p className="text-white/70 text-xs">
            {t("settings.channelSubtitle")}
          </p>
        </div>
        <ChevronRight size={18} color="white" />
      </div>

      {isAdmin && (
        <div className="mt-3">
          <button
            onClick={onOpenAdmin}
            className="w-full flex items-center gap-3 rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5 text-left"
          >
            <ShieldCheck size={18} color="var(--icon-muted)" />
            <span className="flex-1 font-medium text-text-main text-sm">
              {t("settings.adminPanel")}
            </span>
            <ChevronRight size={18} color="var(--chevron)" />
          </button>
        </div>
      )}
    </div>
  );
}
