import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";

const TOTAL_TICKETS = 60;
const QUESTIONS_PER_TICKET = 20;

// Biletlar ekrani — 1 dan 60 gacha bilet kartochkalari, tungi (dark) uslub
export default function TicketsScreen({ onBack, onSelectTicket }) {
  const { t } = useTranslation();
  const tickets = Array.from({ length: TOTAL_TICKETS }, (_, i) => i + 1);

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 bg-[#0F1424] min-h-full">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <h1 className="text-2xl font-extrabold text-white">
          {t("home.tickets")}
        </h1>
      </div>
      <p className="text-gray-400 text-sm mt-1 mb-5 ml-12">
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
            className="aspect-square rounded-2xl border border-white/10 bg-white/[0.04] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <span className="text-orange-400 font-extrabold text-lg leading-none">
              {num}
            </span>
            <span className="text-gray-400 text-[11px] leading-none">
              {t("tickets.ticketWord")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
