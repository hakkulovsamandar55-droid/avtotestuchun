import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Users, UserCheck, Check } from "lucide-react";
import { api } from "../../api";
import { TOTAL_TICKETS } from "../../../shared/data/ticketsData";
import { CATEGORIES as SIGN_CATEGORIES } from "../../../shared/data/signsData";

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
  // datetime-local input formatiga mos: "YYYY-MM-DDTHH:mm".
  // MUHIM: toISOString() UTC beradi — mahalliy vaqtdan farq qiladi va
  // O'zbekistonda (UTC+5) muddat 5 soat oldinga siljib ketardi.
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * O'qituvchi/Owner yangi uy vazifasi yaratadi.
 *
 * TUR BO'YICHA QO'SHIMCHA MAYDONLAR:
 *   TICKETS — bilet raqamlari (vergul bilan)
 *   SIGNS   — belgi toifasi + savol soni
 *   PRACTICE / OFFICIAL_EXAM — qo'shimcha maydon shart emas
 *
 * KIMGA BERILADI:
 *   Butun guruh (standart) yoki tanlangan talabalar.
 *
 * NIMA UCHUN MAQSADLI VAZIFA KERAK: o'qituvchi talaba profilida zaiflikni
 * ko'radi ("bu talabaning aniqligi 45%"), lekin avval aynan o'sha odamga
 * vazifa bera olmasdi — faqat butun guruhga. Bu mantiqsiz edi: tashxis bor,
 * davo yo'q.
 */
export default function CreateHomeworkSheet({ schoolId, groupId, onClose, onCreated }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("PRACTICE");
  const [ticketNumbers, setTicketNumbers] = useState("");
  const [signsCategory, setSignsCategory] = useState("");
  const [signsCount, setSignsCount] = useState("15");
  const [minScore, setMinScore] = useState("80");
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Kimga: null = butun guruh, massiv = tanlangan talabalar
  const [targets, setTargets] = useState(null);
  const [students, setStudents] = useState([]);

  // Talabalar ro'yxati faqat kerak bo'lganda yuklanadi — sheet ochilganda
  // darhol so'rov yubormaslik uchun.
  useEffect(() => {
    if (targets === null) return;
    if (students.length > 0) return;
    api
      .schoolStudents(schoolId, groupId)
      .then((res) => setStudents(res.students || []))
      .catch((err) => setError(err.message));
  }, [targets, schoolId, groupId, students.length]);

  function parseTicketNumbers() {
    return [
      ...new Set(
        ticketNumbers
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_TICKETS)
      ),
    ];
  }

  async function handleSubmit() {
    if (!title.trim() || submitting) return;

    const params = {};
    if (type === "TICKETS") {
      const nums = parseTicketNumbers();
      if (nums.length === 0) {
        setError(t("school.hwTicketsRequired"));
        return;
      }
      params.ticketNumbers = nums;
    }
    if (type === "SIGNS") {
      params.category = signsCategory || null;
      params.questionCount = Number(signsCount) || 15;
    }

    // Maqsadli tanlangan, lekin hech kim belgilanmagan — bu xato.
    // Backend ham tekshiradi, lekin foydalanuvchiga darhol aytish yaxshiroq.
    if (targets !== null && targets.length === 0) {
      setError(t("school.hwSelectStudents"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.schoolCreateHomework(schoolId, groupId, {
        title: title.trim(),
        type,
        params,
        minScore: minScore === "" ? null : Number(minScore),
        deadline: new Date(deadline).toISOString(),
        targetMembershipIds: targets,
      });
      onCreated();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const toggleTarget = (id) =>
    setTargets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div
        className="w-full max-w-sm rounded-t-3xl border-t p-5 max-h-[88vh] overflow-y-auto bg-solid"
        style={{ borderColor: "var(--border-card)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            {t("school.newHomework")}
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-card-soft flex items-center justify-center"
          >
            <X size={15} color="var(--icon-muted)" />
          </button>
        </div>

        <Field label={t("school.hwTitle")}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("school.hwTitlePlaceholder")}
            className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </Field>

        <Field label={t("school.hwType")}>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(({ key, emoji }) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className="rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors"
                style={
                  type === key
                    ? {
                        borderColor: "var(--accent-from)",
                        background: "color-mix(in srgb, var(--accent-from) 16%, transparent)",
                        color: "var(--text-primary)",
                      }
                    : {
                        borderColor: "var(--border-card)",
                        background: "var(--bg-card-soft)",
                        color: "var(--text-secondary)",
                      }
                }
              >
                <span className="mr-1.5">{emoji}</span>
                {t(`school.hwTypeLabel.${key}`)}
              </button>
            ))}
          </div>
        </Field>

        {type === "TICKETS" && (
          <Field label={t("school.hwTickets")} hint={t("school.hwTicketsHint", { max: TOTAL_TICKETS })}>
            <input
              value={ticketNumbers}
              onChange={(e) => setTicketNumbers(e.target.value)}
              placeholder="1, 5, 12"
              inputMode="numeric"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </Field>
        )}

        {type === "SIGNS" && (
          <>
            <Field label={t("school.hwSignsCategory")}>
              <select
                value={signsCategory}
                onChange={(e) => setSignsCategory(e.target.value)}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              >
                <option value="">{t("school.hwSignsAllCategories")}</option>
                {SIGN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`signs.categories.${c}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("school.hwSignsCount")}>
              <input
                value={signsCount}
                onChange={(e) => setSignsCount(e.target.value)}
                inputMode="numeric"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              />
            </Field>
          </>
        )}

        {/* KIMGA BERILADI */}
        <Field label={t("school.hwAudience")}>
          <div className="grid grid-cols-2 gap-2">
            <AudienceBtn
              active={targets === null}
              icon={Users}
              label={t("school.hwWholeGroup")}
              onClick={() => setTargets(null)}
            />
            <AudienceBtn
              active={targets !== null}
              icon={UserCheck}
              label={t("school.hwSelected")}
              onClick={() => setTargets((prev) => (prev === null ? [] : prev))}
            />
          </div>

          {targets !== null && (
            <div
              className="mt-2.5 rounded-xl border max-h-44 overflow-y-auto"
              style={{ borderColor: "var(--border-card)" }}
            >
              {students.length === 0 ? (
                <p className="text-[11px] px-3 py-3" style={{ color: "var(--text-secondary)" }}>
                  {t("school.hwNoStudents")}
                </p>
              ) : (
                students.map((st, i) => {
                  const on = targets.includes(st.membershipId);
                  return (
                    <button
                      key={st.membershipId}
                      onClick={() => toggleTarget(st.membershipId)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                      style={
                        i > 0 ? { borderTop: "1px solid var(--border-card)" } : undefined
                      }
                    >
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                        style={{
                          background: on ? "var(--accent-from)" : "transparent",
                          border: on ? "none" : "1.5px solid var(--chevron)",
                        }}
                      >
                        {on && <Check size={11} color="#fff" />}
                      </span>
                      <span
                        className="flex-1 min-w-0 text-xs truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {st.name}
                      </span>
                      {st.examReadiness != null && (
                        <span
                          className="text-[10px] tabular-nums shrink-0"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {st.examReadiness}%
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t("school.hwMinScore")}>
            <input
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              inputMode="numeric"
              placeholder="80"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </Field>
          <Field label={t("school.hwDeadline")}>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 text-xs outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </Field>
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
          className="w-full rounded-2xl py-3.5 font-bold text-sm text-white disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
          }}
        >
          {submitting ? t("school.creating") : t("school.createHomework")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-3.5">
      <label
        className="block text-[11px] font-semibold mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)", opacity: 0.8 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function AudienceBtn({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border px-3 py-2.5 flex items-center gap-2 text-xs font-semibold"
      style={
        active
          ? {
              borderColor: "var(--accent-from)",
              background: "color-mix(in srgb, var(--accent-from) 16%, transparent)",
              color: "var(--text-primary)",
            }
          : {
              borderColor: "var(--border-card)",
              background: "var(--bg-card-soft)",
              color: "var(--text-secondary)",
            }
      }
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
