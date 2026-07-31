import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../theme";
import AdminPaymentsTab from "./admin/AdminPaymentsTab";
import ModeratorUsersTab from "./admin/ModeratorUsersTab";
import ModeratorStatsTab from "./admin/ModeratorStatsTab";

// Mini-admin (MODERATOR) paneli — to'liq AdminPanelScreen'dan ATAYLAB
// ALOHIDA va SODDA: faqat 3 bo'lim (to'lovlar, statistika, foydalanuvchilar).
// Tariflarni tahrirlash, broadcast, jurnal, maktablar va h.k. bu yerda yo'q —
// backend ham bu harakatlarga moderator tokenini qabul qilmaydi, shuning
// uchun bu ekranda ularni ko'rsatishning ma'nosi yo'q.
export default function ModeratorPanelScreen({ onBack }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("payments"); // payments | stats | users

  const TABS = ["payments", "stats", "users"];
  const TAB_LABEL_KEY = {
    payments: "payments",
    stats: "moderatorStats",
    users: "moderatorUsers",
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-6 bg-app min-h-full animate-slide-in">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <h1 className="text-xl font-extrabold text-text-main flex-1">{t("admin.moderator.title")}</h1>
      </div>

      <div className="flex gap-1.5 mb-4">
        {TABS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap"
            style={
              tab === key
                ? { background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`, color: "white" }
                : { background: "var(--bg-card-soft)", color: "var(--text-secondary)", border: "1px solid var(--border-card)" }
            }
          >
            {t(`admin.tab.${TAB_LABEL_KEY[key]}`)}
          </button>
        ))}
      </div>

      {tab === "payments" && <AdminPaymentsTab moderatorMode />}
      {tab === "stats" && <ModeratorStatsTab />}
      {tab === "users" && <ModeratorUsersTab />}
    </div>
  );
}
