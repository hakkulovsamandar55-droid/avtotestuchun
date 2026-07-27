import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Loader2, Shuffle, AlertTriangle } from "lucide-react";
import { getAllQuestions } from "../../shared/data/ticketsData";
import { api } from "../api";
import TestScreen from "./TestScreen";

/**
 * CHALG'ITUVCHI TESTLAR.
 *
 * Bu bo'lim "eng ko'p xato qilinadigan" savollardan test tuzadi. Ular odatda
 * variantlari bir-biriga o'xshash yoki shartida arzimas ko'ringan lekin
 * hal qiluvchi tafsilot bo'lgan savollar.
 *
 * MA'LUMOT MANBAI (server hal qiladi, tartib bilan):
 *   1) Global statistika — boshqa foydalanuvchilar ko'p xato qilgan savollar
 *   2) Yetmasa — foydalanuvchining o'z xatolari
 *
 * NIMA UCHUN BO'SH HOLAT BO'LISHI MUMKIN: ilova yangi bo'lsa yoki kam
 * foydalanilgan bo'lsa, statistika hali to'planmagan bo'ladi. Bunday holatda
 * "hali ma'lumot yetarli emas" deb aniq aytamiz — bu bo'sh ekran yoki
 * xato ko'rsatishdan yaxshiroq.
 */
export default function TrickyTestScreen({ onBack }) {
  const { t, i18n } = useTranslation();
  const [questionIds, setQuestionIds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getTrickyQuestions()
      .then((res) => setQuestionIds(res.questionIds || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ID -> savol. Matnlar mahalliy bazadan olinadi.
  const questions = useMemo(() => {
    if (!questionIds || questionIds.length === 0) return [];
    const byId = new Map(getAllQuestions(i18n.language).map((q) => [q.id, q]));
    // Topilmagan ID'lar tashlab yuboriladi — savollar bazasi yangilangan
    // bo'lsa eski ID statistikada qolgan bo'lishi mumkin.
    return questionIds.map((id) => byId.get(id)).filter(Boolean);
  }, [questionIds, i18n.language]);

  if (loading) {
    return (
      <Shell onBack={onBack} title={t("home.trickyTests")}>
        <div className="flex justify-center py-20">
          <Loader2 size={22} className="animate-spin" color="var(--icon-muted)" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell onBack={onBack} title={t("home.trickyTests")}>
        <p className="text-red-400 text-sm mt-4">{error}</p>
      </Shell>
    );
  }

  // Test tuzish uchun kamida 5 savol kerak — undan kam bo'lsa test
  // ma'nosiz (bir necha savol darhol tugaydi).
  if (questions.length < 5) {
    return (
      <Shell onBack={onBack} title={t("home.trickyTests")}>
        <div className="rounded-2xl bg-card border border-card-border p-5 mt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} color="#FBBF24" className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {t("tricky.notEnoughTitle")}
              </p>
              <p
                className="text-xs mt-2 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("tricky.notEnoughBody")}
              </p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // TestScreen qayta ishlatiladi — oqim aynan bir xil (savol, javob,
  // darhol fikr-mulohaza, natija). Alohida ekran yozish kodni takrorlash
  // bo'lardi.
  return (
    <TestScreen
      customQuestions={questions}
      customTitle={t("home.trickyTests")}
      onExit={onBack}
    />
  );
}

function Shell({ children, onBack, title }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 animate-slide-in">
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card-soft border border-card-border flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={17} color="var(--icon-muted)" />
        </button>
        <div className="flex items-center gap-2">
          <Shuffle size={17} color="var(--accent-from)" />
          <h1 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
        </div>
      </div>
      {children}
    </div>
  );
}
