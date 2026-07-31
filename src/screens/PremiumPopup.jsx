import React from "react";
import { X } from "lucide-react";
import PremiumScreen from "./PremiumScreen";

// Ilova ochilganda avtomatik ko'rsatiladigan premium popup.
//
// NIMA UCHUN alohida komponent: PremiumScreen o'zi to'liq ekranli sahifa
// (SettingsTab/HomeTab'dan "Premium" tugmasi bosilganda ochiladi). Bu yerda
// esa uni MODAL sifatida ustidan (overlay) chiqaramiz — orqa fon qorong'i
// bo'ladi va "X" tugmasi bilan yopiladi, lekin ichidagi tarif tanlash mantig'i
// bir xil (bitta joyda saqlanadi, ikki marta yozilmaydi).
export default function PremiumPopup({ onClose, onSelectPlan }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 animate-fade-in">
      <div className="flex-1 flex flex-col min-h-0 mt-6 rounded-t-3xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="Yopish"
        >
          <X size={18} color="#E5E7EB" />
        </button>
        <PremiumScreen onBack={onClose} onSelectPlan={onSelectPlan} />
      </div>
    </div>
  );
}
