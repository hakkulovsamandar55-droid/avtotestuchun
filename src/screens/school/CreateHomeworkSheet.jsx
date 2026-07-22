import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { api } from "../../api";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";
import { TOTAL_TICKETS } from "../../data/ticketsData";

const TYPES = [
  { key: "PRACTICE", emoji: "📝" },
  { key: "OFFICIAL_EXAM", emoji: "📋" },
  { key: "TICKETS", emoji: "🎫" },
  { key: "SIGNS", emoji: "🚸" },
];

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 0, 0);
  // datetime-local input formatiga mos: "YYYY-MM-DDTHH:mm"
  return d.toISOString().slice(0, 16);
}

/**
 * O'qituvchi/Owner yangi uy vazifasi yaratadi.
 *
 * Homework turi bo'yicha qo'shimcha maydonlar ko'rsatiladi:
 *   TICKETS -> bilet raqamlari (vergul bilan)
 *   boshqalari -> qo'shimcha maydon shart emas
 */
export default function CreateHomeworkSheet({ schoolId, groupId, onClose, onCreated }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("PRACTICE");
  const [ticketNumbers, setTicketNumbers] = useState("");
  const [minScore, setMinScore] = useState("80");
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function parseTicketNumbers() {
    return ticketNumbers
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_TICKETS);
  }

  async function handleSubmit() {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError("");

    const params = {};
    if (type === "TICKETS") {
      const nums = parseTicketNumbers();
      if (nums.length === 0) {
        setError(t("school.hwTicketsRequired"));
        setSubmitting(false);
        return;
      }
      params.ticketNumbers = nums;
    }

    try {
      await api.schoolCreateHomework(schoolId, groupId, {
        title: title.trim(),
        type,
        params,
        minScore: minScore ? Number(minScore) : null,
        deadline: new Date(deadline).toISOString(),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-0">
      <div className="w-full max-w-sm rounded-t-3xl bg-[#161B2E] border-t border-white/10 p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-base">{t("school.newHomework")}</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
          >
            <X size={16} color="#E5E7EB" />
          </button>
        </div>

        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          {t("school.hwTitle")}
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("school.hwTitlePlaceholder")}
          className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 mb-4"
        />

        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          {t("school.hwType")}
        </label>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {TYPES.map(({ key, emoji }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`rounded-2xl py-3 flex flex-col items-center gap-1 border transition-colors ${
                type === key
                  ? "border-white/40 bg-white/[0.1]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-[9px] font-semibold text-gray-300 leading-tight text-center">
                {t(`school.hwTypeLabel.${key}`)}
              </span>
            </button>
          ))}
        </div>

        {type === "TICKETS" && (
          <>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              {t("school.hwTicketNumbers")}
            </label>
            <input
              value={ticketNumbers}
              onChange={(e) => setTicketNumbers(e.target.value)}
              placeholder="5, 12, 18"
              className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 mb-4"
            />
          </>
        )}

        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          {t("school.hwMinScore")}
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 mb-4"
        />

        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          {t("school.hwDeadline")}
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 mb-5"
        />

        {error && <p className="text-red-400 text-xs mb-4 leading-relaxed">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
          className="w-full rounded-2xl py-3.5 font-bold text-white text-sm disabled:opacity-50"
          style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          {submitting ? t("school.creating") : t("school.createHomework")}
        </button>
      </div>
    </div>
  );
}
