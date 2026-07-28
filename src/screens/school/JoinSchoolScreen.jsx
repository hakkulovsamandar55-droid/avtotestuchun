import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, School, KeyRound, ArrowRight, Users, Loader2 } from "lucide-react";
import { api } from "../../api";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";

/**
 * Talaba guruh kodi orqali maktabga qo'shiladi.
 *
 * IKKI BOSQICHLI OQIM (soddalashtirilgan onboarding):
 *   1) Kod kiritiladi -> tekshiriladi (preview) -> "Siz <Maktab>,
 *      <Guruh> guruhiga qo'shilmoqchisiz" ko'rsatiladi
 *   2) Tasdiqlansa -> darhol qo'shiladi
 *
 * Owner yoki CEO tasdig'i KERAK EMAS.
 *
 * DEEP LINK: Telegram "?startapp=join_AB12-X7KF" bilan ochilsa, kod
 * URL'dan avtomatik o'qiladi va foydalanuvchi to'g'ridan-to'g'ri
 * tasdiqlash oynasini ko'radi (kod yozish shart emas).
 *
 * ESKI KODLAR: agar kiritilgan kod guruh kodi bo'lmasa, eski Invitation
 * tizimi orqali ham urinib ko'riladi — shu sababli ilgari tarqatilgan
 * kodlar ishlashda davom etadi.
 */
export default function JoinSchoolScreen({ onBack, onJoined }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState(null);
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const checkCode = useCallback(async (raw) => {
    const value = (raw || "").trim();
    if (!value) return;
    setChecking(true);
    setError("");
    try {
      setPreview(await api.schoolInvitePreview(value));
    } catch (err) {
      setError(err.message);
      setPreview(null);
    } finally {
      setChecking(false);
    }
  }, []);

  // Deep link: ?startapp=join_AB12-X7KF (yoki Telegram start_param)
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("startapp");
    const fromTg = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    const param = fromUrl || fromTg;
    if (param && param.startsWith("join_")) {
      const extracted = param.slice("join_".length);
      setCode(extracted);
      checkCode(extracted);
    }
  }, [checkCode]);

  async function handleConfirmJoin() {
    if (joining) return;
    setJoining(true);
    setError("");
    try {
      onJoined(await api.schoolJoinGroup(code.trim()));
    } catch (err) {
      setError(err.message);
      setJoining(false);
    }
  }

  // Guruh kodi topilmasa — eski taklif kodi tizimini sinab ko'ramiz.
  async function handleLegacyJoin() {
    setJoining(true);
    setError("");
    try {
      onJoined(await api.schoolJoin(code.trim()));
    } catch (err) {
      setError(err.message);
      setJoining(false);
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

      {preview ? (
        <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5">
          <p className="text-gray-400 text-xs mb-4">{t("school.confirmJoinTitle")}</p>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {preview.school.logoUrl ? (
                <img src={preview.school.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <School size={22} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold truncate">{preview.school.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users size={12} color="#9CA3AF" />
                <p className="text-gray-400 text-xs truncate">{preview.group.name}</p>
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs mb-3 leading-relaxed">{error}</p>}

          <button
            onClick={handleConfirmJoin}
            disabled={joining}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {joining ? t("school.joining") : t("school.confirmJoinButton")}
            {!joining && <ArrowRight size={16} />}
          </button>
          <button
            onClick={() => {
              setPreview(null);
              setError("");
            }}
            className="w-full rounded-2xl py-3 font-semibold text-sm text-gray-400 mt-2"
          >
            {t("officialExam.back")}
          </button>
        </div>
      ) : (
        <>
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
              onKeyDown={(e) => e.key === "Enter" && checkCode(code)}
              placeholder="AB12-X7KF"
              autoCapitalize="characters"
              className="w-full rounded-2xl bg-white/[0.05] border border-white/10 pl-11 pr-4 py-3.5 text-sm font-mono tracking-wider text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30"
            />
          </div>

          {error && (
            <div className="mb-4">
              <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              <button
                onClick={handleLegacyJoin}
                disabled={joining || !code.trim()}
                className="text-xs underline text-gray-400 mt-2 disabled:opacity-50"
              >
                {t("school.tryLegacyCode")}
              </button>
            </div>
          )}

          <button
            onClick={() => checkCode(code)}
            disabled={!code.trim() || checking}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 mt-4"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {checking ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {t("school.continueButton")}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="text-gray-500 text-xs text-center mt-6 leading-relaxed px-4">
            {t("school.noCodeHint")}
          </p>
        </>
      )}
    </div>
  );
}
