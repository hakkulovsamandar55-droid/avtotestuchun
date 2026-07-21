import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronLeft, Send, Image as ImageIcon, Lock, Unlock, UserCircle2 } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";
import { api, resolveUploadUrl } from "../../api";

function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ConversationRow({ conv, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5 text-left active:scale-[0.99] transition-transform"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
      >
        {initials(conv.user.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-text-main text-sm truncate">{conv.user.name}</p>
          {conv.status === "CLOSED" && <Lock size={11} color="var(--icon-muted)" />}
        </div>
        <p className="text-text-muted text-xs truncate">
          {conv.lastMessage ? (conv.lastMessage.text || "📷 Rasm") : "—"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-text-muted text-[10px] mb-1">{timeAgo(conv.lastMessageAt)}</p>
        {conv.unreadForAdmin > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white px-1"
            style={{ background: ACCENT_FROM }}
          >
            {conv.unreadForAdmin}
          </span>
        )}
      </div>
    </button>
  );
}

function ConversationDetail({ conversationId, onBack, onOpenProfile }) {
  const { t } = useTranslation();
  const [conv, setConv] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  function load() {
    api.getConversation(conversationId).then(setConv);
  }

  useEffect(() => { load(); }, [conversationId]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conv?.messages?.length]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    const value = text.trim();
    setText("");
    try {
      const { message } = await api.replyToConversation(conversationId, value);
      setConv((prev) => ({ ...prev, messages: [...prev.messages, message] }));
    } finally {
      setSending(false);
    }
  }

  async function handleImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSending(true);
    try {
      const { message } = await api.replyToConversationImage(conversationId, file);
      setConv((prev) => ({ ...prev, messages: [...prev.messages, message] }));
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    const next = conv.status === "OPEN" ? "CLOSED" : "OPEN";
    await api.setConversationStatus(conversationId, next);
    setConv((prev) => ({ ...prev, status: next }));
  }

  if (!conv) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-muted text-sm">...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="flex items-center gap-3 px-5 tp-safe-top pb-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0">
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-main text-sm truncate">{conv.user.name}</p>
          <p className="text-text-muted text-xs truncate">{conv.user.username ? `@${conv.user.username}` : conv.user.telegramId}</p>
        </div>
        <button
          onClick={() => onOpenProfile(conv.user.id)}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
          title={t("admin.support.openProfile")}
        >
          <UserCircle2 size={18} color="var(--icon-muted)" />
        </button>
        <button
          onClick={toggleStatus}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          {conv.status === "OPEN" ? <Lock size={16} color="var(--icon-muted)" /> : <Unlock size={16} color="var(--icon-muted)" />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-2">
        {conv.messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "ADMIN" ? "justify-end" : "justify-start"} mb-2.5`}>
            <div
              className="max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm"
              style={
                m.sender === "ADMIN"
                  ? { background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }
                  : { background: "var(--bg-card)", border: "1px solid var(--border-card)" }
              }
            >
              {m.imageUrl && (
                <img src={resolveUploadUrl(m.imageUrl)} alt="" className="rounded-xl mb-1.5 max-w-full max-h-64 object-cover" />
              )}
              {m.text && (
                <p className={`text-sm leading-snug whitespace-pre-wrap ${m.sender === "ADMIN" ? "text-white" : "text-text-main"}`}>
                  {m.text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {conv.status === "CLOSED" ? (
        <div className="mx-4 mb-4 rounded-2xl bg-card-soft border border-card-border px-4 py-3 text-center">
          <p className="text-text-muted text-xs">{t("admin.support.filterClosed")}</p>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 flex items-end gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="w-11 h-11 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <ImageIcon size={18} color="var(--icon-muted)" />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={t("admin.support.replyPlaceholder")}
            rows={1}
            className="flex-1 rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3 text-sm text-text-main outline-none resize-none max-h-28"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            <Send size={17} color="white" />
          </button>
        </div>
      )}
    </div>
  );
}

// Admin tomoni: qo'llab-quvvatlash moduli (spec 1-bo'lim, admin qismi)
export default function AdminSupportTab({ onOpenProfile }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);

  function load() {
    setLoading(true);
    api.getConversations({ ...(filter ? { status: filter } : {}), ...(query ? { query } : {}) })
      .then((data) => setConversations(data.conversations))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [filter, query]);

  useEffect(() => {
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [filter, query]);

  if (activeId) {
    return (
      <ConversationDetail
        conversationId={activeId}
        onBack={() => { setActiveId(null); load(); }}
        onOpenProfile={onOpenProfile}
      />
    );
  }

  return (
    <div>
      <div className="relative mb-3">
        <Search size={18} color="#9CA3AF" className="absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.support.searchPlaceholder")}
          className="w-full rounded-2xl bg-card border border-card-border shadow-sm pl-11 pr-4 py-3 text-sm text-text-main outline-none focus:border-gray-300"
        />
      </div>

      <div className="flex gap-2 mb-3">
        {[
          { key: "", label: t("admin.support.filterAll") },
          { key: "OPEN", label: t("admin.support.filterOpen") },
          { key: "CLOSED", label: t("admin.support.filterClosed") },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-1 rounded-xl py-2 text-xs font-semibold transition-colors"
            style={
              filter === f.key
                ? { background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`, color: "white" }
                : { background: "var(--bg-card-soft)", color: "var(--text-secondary)", border: "1px solid var(--border-card)" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {conversations.map((c) => (
          <ConversationRow key={c.id} conv={c} onClick={() => setActiveId(c.id)} />
        ))}
        {!loading && conversations.length === 0 && (
          <p className="text-center text-text-muted text-sm mt-10">{t("admin.support.noConversations")}</p>
        )}
      </div>
    </div>
  );
}
