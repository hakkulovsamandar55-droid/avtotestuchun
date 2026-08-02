import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { TOTAL_TICKETS, QUESTIONS_PER_TICKET } from "../data/ticketsData";

// Biletlar ekrani — barcha bilet kartochkalari (TOTAL_TICKETS soniga qarab)
export default function TicketsScreen({ onBack, onSelectTicket }) {
  const { t } = useTranslation();
  const tickets = Array.from({ length: TOTAL_TICKETS }, (_, i) => i + 1);

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-6 bg-app min-h-full animate-slide-in">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <h1 className="text-2xl font-extrabold text-text-main">
          {t("home.tickets")}
        </h1>
      </div>
      <p className="text-text-muted text-sm mt-1 mb-5 ml-12">
        {t("tickets.subtitle", {
          count: TOTAL_TICKETS,
          questions: QUESTIONS_PER_TICKET,
        })}
      </p>

      <div className="grid grid-cols-4 gap-3">
        {tickets.map((num) => (
          <button
            key={num}
            onClick={() => onSelectTicket && onSelectTicket(num)}
            className="aspect-square rounded-2xl bg-card border border-card-border shadow-sm flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <span className="text-orange-400 font-extrabold text-lg leading-none">
              {num}
            </span>
            <span className="text-text-muted text-[11px] leading-none">
              {t("tickets.ticketWord")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
