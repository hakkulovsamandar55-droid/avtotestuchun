import React from "react";
import { useTranslation } from "react-i18next";
import { Bell, HelpCircle, Send, ChevronRight, ShieldCheck, Crown } from "lucide-react";
import { ACCENT_FROM } from "../theme";
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

function SettingsRow({ icon: Icon, label, value }) {
  return (
    <button className="w-full flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3.5 text-left">
      <Icon size={18} color="#4B5563" />
      <span className="flex-1 font-medium text-gray-900 text-sm">
        {label}
      </span>
      {value && <span className="text-gray-400 text-sm">{value}</span>}
      <ChevronRight size={18} color="#D1D5DB" />
    </button>
  );
}

// 3c-EKRAN: "Sozlamalar" bo'limi
export default function SettingsTab({ user, onOpenAdmin, onOpenPremium }) {
  const { t } = useTranslation();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-4 animate-fade-in">
      <h1 className="text-xl font-extrabold text-gray-900 text-center mb-5">
        {t("settings.title")}
      </h1>

      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
          style={{ backgroundColor: ACCENT_FROM }}
        >
          S
        </div>
        <div>
          <p className="font-bold text-gray-900">{user?.name || "—"}</p>
          <p className="text-gray-400 text-sm">
            {user?.username ? `@${user.username}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <PremiumRow onClick={onOpenPremium} />
        <LanguageSwitcher variant="row" />
        <SettingsRow
          icon={Bell}
          label={t("settings.notifications")}
          value={t("settings.on")}
        />
        <SettingsRow icon={HelpCircle} label={t("settings.support")} />
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
            className="w-full flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3.5 text-left"
          >
            <ShieldCheck size={18} color="#4B5563" />
            <span className="flex-1 font-medium text-gray-900 text-sm">
              {t("settings.adminPanel")}
            </span>
            <ChevronRight size={18} color="#D1D5DB" />
          </button>
        </div>
      )}
    </div>
  );
}
