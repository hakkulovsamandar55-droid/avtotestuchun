import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, School, KeyRound, ArrowRight } from "lucide-react";
import { api } from "../../api";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";

/**
 * Talaba taklif kodi orqali maktabga qo'shiladi.
 *
 * QR skanerlash alohida qurilma ruxsati (kamera) talab qiladi va bu
 * bosqichda ixtiyoriy — kod qo'lda kiritish har doim ishlaydi va QR
 * skanerlangan kod ham aslida shu formatdagi matn, shuning uchun bitta
 * forma ikkalasiga ham xizmat qiladi (QR skaner kelajakda shu inputni
 * to'ldiruvchi qo'shimcha tugma sifatida qo'shiladi).
 */
export default function JoinSchoolScreen({ onBack, onJoined }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.schoolJoin(code.trim());
      onJoined(result);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <h1 className="text-xl font-extrabold">{t("school.joinTitle")}</h1>
      </div>

      <div className="flex flex-col items-center text-center mb-8">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
          style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          <School size={34} color="white" />
        </div>
        <p className="text-gray-400 text-sm leading-relaxed px-4">
          {t("school.joinSubtitle")}
        </p>
      </div>

      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
        {t("school.inviteCodeLabel")}
      </label>
      <div className="relative mb-2">
        <KeyRound
          size={16}
          color="#6B7280"
          className="absolute left-4 top-1/2 -translate-y-1/2"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          placeholder="AVTO-XXXXXX"
          autoCapitalize="characters"
          className="w-full rounded-2xl bg-white/[0.05] border border-white/10 pl-11 pr-4 py-3.5 text-sm font-mono tracking-wider text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30"
        />
      </div>

      {error && <p className="text-red-400 text-xs mb-4 leading-relaxed">{error}</p>}

      <button
        onClick={handleJoin}
        disabled={!code.trim() || loading}
        className="w-full rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 mt-4"
        style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
      >
        {loading ? t("school.joining") : t("school.joinButton")}
        {!loading && <ArrowRight size={16} />}
      </button>

      <p className="text-gray-500 text-xs text-center mt-6 leading-relaxed px-4">
        {t("school.noCodeHint")}
      </p>
    </div>
  );
}
