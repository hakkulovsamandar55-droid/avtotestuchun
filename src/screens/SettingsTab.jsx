import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle, Send, ChevronRight, ShieldCheck, Crown, Check, Trophy, School } from "lucide-react";
import { ACCENT_FROM } from "../theme";
import { useTheme } from "../ThemeContext";
import { useFontSize } from "../FontSizeContext";
import { api, showComingSoon } from "../api";
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

// Reytingda ko'rinish tugmasi.
//
// Maxfiylik: o'chirilsa, foydalanuvchi ommaviy reytinglardan BUTUNLAY
// chiqariladi (o'z o'rnini ham ko'rmaydi). Holat serverda saqlanadi,
// shuning uchun boshqa qurilmada ham amal qiladi.
function LeaderboardToggle() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .examMe()
      .then((res) => {
        if (!cancelled) setVisible(res.showOnLeaderboard);
      })
      .catch(() => {
        // Sozlama yuklanmasa, tugma ko'rsatilmaydi (holatni bilmasdan
        // noto'g'ri qiymat ko'rsatgandan ko'ra yaxshiroq)
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (visible === null) return null;

  async function toggle() {
    if (saving) return;
    const next = !visible;
    setVisible(next); // optimistik
    setSaving(true);
    try {
      await api.setLeaderboardVisibility(next);
    } catch {
      setVisible(!next); // qaytarish
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="w-full flex items-center gap-3 rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5 text-left active:scale-[0.99] transition-transform disabled:opacity-60"
    >
      <Trophy size={18} color="var(--icon-muted)" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-main text-sm">
          {t("settings.showOnLeaderboard")}
        </p>
        <p className="text-text-muted text-xs mt-0.5 leading-snug">
          {t("settings.showOnLeaderboardHint")}
        </p>
      </div>
      <span
        className="w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors"
        style={{ backgroundColor: visible ? ACCENT_FROM : "var(--border-card)" }}
      >
        <span
          className="block w-5 h-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: visible ? "translateX(20px)" : "translateX(0)" }}
        />
      </span>
    </button>
  );
}

// Light / Dark uchun katta tanlov tugmasi (mockup'dagi ikkita pill kabi)
function ThemeModePill({ item, isActive, onClick }) {
  const isDarkPill = item.key === "dark";
  return (
    <button
      onClick={onClick}
      className="flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center transition-transform active:scale-[0.98]"
      style={{
        background: isDarkPill ? "#18181F" : "#FFFFFF",
        color: isDarkPill ? "#FFFFFF" : "#111827",
        border: isActive
          ? `2px solid ${item.accentFrom}`
          : "2px solid var(--border-card)",
      }}
    >
      {item.label}
    </button>
  );
}

// Qolgan ranglar uchun ro'yxat qatori — chapda to'liq rang doirasi, o'ngda nom,
// tanlangan bo'lsa oxirida check, premium bo'lsa toj belgisi
function ThemeColorRow({ item, isActive, isLocked, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 active:opacity-70 transition-opacity"
    >
      <span
        className="w-7 h-7 rounded-full shrink-0"
        style={{
          backgroundColor: item.accentFrom,
          boxShadow: isActive ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${item.accentFrom}` : "none",
        }}
      />
      <span className="flex-1 text-left text-sm font-medium text-text-main">
        {item.label}
      </span>
      {isLocked && <Crown size={15} color="#E0A62E" />}
      {isActive && <Check size={17} color="var(--accent-from)" strokeWidth={3} />}
    </button>
  );
}

function ThemePickerRow({ isPremium }) {
  const { t } = useTranslation();
  const { themeKey, setThemeKey, themeList } = useTheme();
  const [open, setOpen] = useState(false);

  const modePills = themeList.filter((it) => it.key === "light" || it.key === "dark");
  const colorOptions = themeList.filter((it) => it.key !== "light" && it.key !== "dark");
  const activeItem = themeList.find((it) => it.key === themeKey);

  function choose(key, locked) {
    if (locked) {
      showComingSoon(t("settings.premium"));
      return;
    }
    setThemeKey(key);
  }

  return (
    <div className="w-full rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-medium text-text-main text-sm">{t("settings.theme")}</span>
        <span className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: activeItem?.accentFrom }}
          />
          <ChevronRight
            size={16}
            color="var(--chevron)"
            className="transition-transform"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        </span>
      </button>

      {open && (
        <div className="mt-3.5 pt-3.5 border-t border-card-border">
          <div className="flex gap-3">
            {modePills.map((item) => (
              <ThemeModePill
                key={item.key}
                item={item}
                isActive={item.key === themeKey}
                onClick={() => choose(item.key, false)}
              />
            ))}
          </div>

          <div className="mt-1 divide-y divide-card-border">
            {colorOptions.map((item) => (
              <ThemeColorRow
                key={item.key}
                item={item}
                isActive={item.key === themeKey}
                isLocked={!isPremium}
                onClick={() => choose(item.key, !isPremium)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Shrift o'lchamini tanlash qatori — Aa harflari orqali kichik/o'rta/katta
// tanlash, xuddi ThemePickerRow uslubida ochilib-yopiladi.
function FontSizePickerRow() {
  const { t } = useTranslation();
  const { fontSizeKey, setFontSizeKey, fontSizeList } = useFontSize();
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-medium text-text-main text-sm">{t("settings.fontSize")}</span>
        <span className="flex items-center gap-2">
          <span className="text-text-muted text-xs">{t(`settings.fontSizeOptions.${fontSizeKey}`)}</span>
          <ChevronRight
            size={16}
            color="var(--chevron)"
            className="transition-transform"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        </span>
      </button>

      {open && (
        <div className="mt-3.5 pt-3.5 border-t border-card-border flex gap-2.5">
          {fontSizeList.map((item) => {
            const isActive = item.key === fontSizeKey;
            return (
              <button
                key={item.key}
                onClick={() => setFontSizeKey(item.key)}
                className="flex-1 flex flex-col items-center gap-1.5 rounded-xl py-3 transition-transform active:scale-[0.97]"
                style={
                  isActive
                    ? { background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_FROM})`, color: "white" }
                    : { background: "var(--bg-card-soft)", color: "var(--text-main)", border: "1px solid var(--border-card)" }
                }
              >
                <span style={{ fontSize: `${item.rootPx}px`, lineHeight: 1 }} className="font-bold">Aa</span>
                <span className="text-[10px] font-medium">{t(`settings.fontSizeOptions.${item.key}`)}</span>
                {isActive && <Check size={11} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 3c-EKRAN: "Sozlamalar" bo'limi
export default function SettingsTab({ user, onOpenAdmin, onOpenPremium, onOpenSupport, onOpenSchool }) {
  const { t } = useTranslation();
  const isAdmin = user?.role === "ADMIN";
  const isPremium = Boolean(user?.isPremium) || isAdmin;

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
        <ThemePickerRow isPremium={isPremium} />
        <FontSizePickerRow />
        <LeaderboardToggle />
        <SettingsRow
          icon={School}
          label={t("settings.mySchool")}
          onClick={onOpenSchool}
        />
        <SettingsRow
          icon={HelpCircle}
          label={t("settings.support")}
          onClick={onOpenSupport}
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
