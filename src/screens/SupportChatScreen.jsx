import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Send, Image as ImageIcon, CheckCheck, Lock } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../theme";
import { api, resolveUploadUrl } from "../api";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ message }) {
  const isAdmin = message.sender === "ADMIN";
  return (
    <div className={`flex ${isAdmin ? "justify-start" : "justify-end"} mb-2.5`}>
      <div
        className="max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm"
        style={
          isAdmin
            ? { background: "var(--bg-card)", border: "1px solid var(--border-card)" }
            : { background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }
        }
      >
        {message.imageUrl && (
          <img
            src={resolveUploadUrl(message.imageUrl)}
            alt=""
            className="rounded-xl mb-1.5 max-w-full max-h-64 object-cover"
          />
        )}
        {message.text && (
          <p className={`text-sm leading-snug whitespace-pre-wrap ${isAdmin ? "text-text-main" : "text-white"}`}>
            {message.text}
          </p>
        )}
        <div className={`flex items-center gap-1 mt-1 ${isAdmin ? "justify-start" : "justify-end"}`}>
          <span className={`text-[10px] ${isAdmin ? "text-text-muted" : "text-white/70"}`}>
            {formatTime(message.createdAt)}
          </span>
          {!isAdmin && <CheckCheck size={12} color={message.isRead ? "#93C5FD" : "rgba(255,255,255,0.6)"} />}
        </div>
      </div>
    </div>
  );
}

// Foydalanuvchi tomoni "Adminga murojaat" chat ekrani — Sozlamalar > Yordam orqali ochiladi
export default function SupportChatScreen({ onBack }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("OPEN");
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  async function load() {
    try {
      const data = await api.getMyConversation();
      setMessages(data.messages);
      setStatus(data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Admin javobini ko'rish uchun har 8 soniyada yangilanadi (real vaqt socket
    // hozircha faqat Duel rejimi uchun ulangan — kelajakda shu yerga ham ulash mumkin)
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    const value = text.trim();
    setText("");
    try {
      const { message } = await api.sendSupportMessage(value);
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      setError(err.message);
      setText(value);
    } finally {
      setSending(false);
    }
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSending(true);
    setError("");
    try {
      const { message } = await api.sendSupportImage(file);
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex items-center gap-3 px-5 tp-safe-top pb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold text-text-main truncate">{t("support.title")}</h1>
          <p className="text-text-muted text-xs">
            {status === "CLOSED" ? t("support.closedSubtitle") : t("support.openSubtitle")}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-2">
        {loading ? (
          <p className="text-center text-text-muted text-sm mt-10">...</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 px-6 text-center">
            <p className="text-text-main font-semibold text-sm mb-1">{t("support.emptyTitle")}</p>
            <p className="text-text-muted text-xs">{t("support.emptySubtitle")}</p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      {error && <p className="text-center text-red-500 text-xs px-5 mb-1">{error}</p>}

      {status === "CLOSED" ? (
        <div className="mx-4 mb-4 rounded-2xl bg-card-soft border border-card-border px-4 py-3 flex items-center gap-2">
          <Lock size={15} color="var(--icon-muted)" />
          <p className="text-text-muted text-xs flex-1">{t("support.closedNotice")}</p>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="w-11 h-11 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
          >
            <ImageIcon size={18} color="var(--icon-muted)" />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("support.placeholder")}
            rows={1}
            className="flex-1 rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3 text-sm text-text-main outline-none focus:border-gray-300 resize-none max-h-28"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            <Send size={17} color="white" />
          </button>
        </div>
      )}
    </div>
  );
}
