import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";
import { api } from "../../api";

// Admin tomoni: ommaviy xabar yuborish (spec 12-bo'lim)
export default function AdminBroadcastTab() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const audiences = [
    { key: "ALL", label: t("admin.broadcast.audienceAll") },
    { key: "PREMIUM", label: t("admin.broadcast.audiencePremium") },
    { key: "BLOCKED", label: t("admin.broadcast.audienceBlocked") },
  ];

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    setResult(null);
    try {
      const data = await api.sendBroadcast(text.trim(), audience);
      setResult(data.recipientCount);
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <p className="font-bold text-text-main text-sm mb-3">{t("admin.broadcast.title")}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {audiences.map((a) => (
          <button
            key={a.key}
            onClick={() => setAudience(a.key)}
            className="rounded-xl px-3.5 py-2 text-xs font-semibold transition-transform active:scale-95"
            style={
              audience === a.key
                ? { background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`, color: "white" }
                : { background: "var(--bg-card-soft)", color: "var(--text-main)", border: "1px solid var(--border-card)" }
            }
          >
            {a.label}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("admin.broadcast.textPlaceholder")}
        rows={5}
        className="w-full rounded-2xl border border-card-border bg-card text-text-main px-4 py-3 text-sm outline-none focus:border-gray-400 resize-none mb-3 shadow-sm"
      />

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      {result != null && (
        <p className="text-green-600 text-xs font-semibold mb-3">{t("admin.broadcast.sent", { count: result })}</p>
      )}

      <button
        onClick={handleSend}
        disabled={!text.trim() || sending}
        className="w-full rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
      >
        <Send size={16} /> {t("admin.broadcast.send")}
      </button>
    </div>
  );
}
