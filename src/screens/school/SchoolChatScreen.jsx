import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { api } from "../../api";

const POLL_INTERVAL_MS = 8000;

/**
 * Bitta chat ekrani.
 *
 * YANGI XABARLAR: hozircha polling (8 soniyada bir). Socket.io loyihada bor
 * (duel uchun), lekin uni chatga ulash alohida ish — polling birinchi
 * versiyada yetarli va ancha sodda. Foydalanuvchi ekranda bo'lmaganda
 * so'rov yuborilmaydi (document.hidden tekshiruvi).
 */
export default function SchoolChatScreen({ schoolId, chat, onBack, onRead }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");

  const bottomRef = useRef(null);
  const lastIdRef = useRef(0);
  const didInitialScroll = useRef(false);

  const scrollToBottom = useCallback((smooth) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const load = useCallback(
    async ({ silent } = {}) => {
      if (!silent) setLoading(true);
      try {
        const res = await api.schoolChatMessages(schoolId, chat.id);
        const list = res.messages || [];

        // Faqat haqiqatan o'zgargan bo'lsa state'ni yangilaymiz — aks holda
        // har polling'da butun ro'yxat qayta render bo'lardi
        const newest = list.length > 0 ? list[list.length - 1].id : 0;
        if (newest !== lastIdRef.current || !silent) {
          lastIdRef.current = newest;
          setMessages(list);
        }
        setError("");
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [schoolId, chat.id]
  );

  // Boshlang'ich yuklash + o'qilgan deb belgilash
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
      try {
        await api.schoolMarkChatRead(schoolId, chat.id);
        onRead?.(chat.id);
      } catch {
        /* o'qilgan belgisi muhim emas — xato yutiladi */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, schoolId, chat.id, onRead]);

  // Polling — faqat ekran ko'rinib turganda
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) load({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Yangi xabar kelganda pastga tushamiz
  useEffect(() => {
    if (messages.length === 0) return;
    scrollToBottom(didInitialScroll.current);
    didInitialScroll.current = true;
  }, [messages, scrollToBottom]);

  async function handleSend() {
    const value = text.trim();
    if (!value || sending) return;

    setSending(true);
    setError("");

    // Optimistik ko'rsatish — foydalanuvchi kutmasligi uchun.
    // Muvaffaqiyatsiz bo'lsa olib tashlanadi.
    const tempId = -Date.now();
    const optimistic = {
      id: tempId,
      chatId: chat.id,
      senderMembershipId: chat.myMembershipId,
      text: value,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");

    try {
      await api.schoolSendMessage(schoolId, chat.id, value);
      await load({ silent: true });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(value); // matnni qaytaramiz — foydalanuvchi qayta yozmasin
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0F1424] text-white">
      {/* Sarlavha */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        {chat.other?.avatarUrl ? (
          <img src={chat.other.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-sm font-bold">
              {(chat.other?.name || "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{chat.other?.name}</p>
          {chat.other?.isActive === false && (
            <p className="text-gray-500 text-[11px]">{t("school.leftSchool")}</p>
          )}
        </div>
      </div>

      {/* Xabarlar */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={20} className="animate-spin text-gray-500" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-10">{t("school.noMessagesYet")}</p>
        ) : (
          <div className="space-y-2">
            {messages.map((m, i) => {
              const mine = m.senderMembershipId === chat.myMembershipId;
              const prev = messages[i - 1];
              const showDate =
                !prev || !isSameDay(prev.createdAt, m.createdAt);
              return (
                <React.Fragment key={m.id}>
                  {showDate && (
                    <p className="text-center text-gray-600 text-[10px] py-2">
                      {formatDay(m.createdAt, t)}
                    </p>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                        mine ? "rounded-br-md" : "bg-white/[0.07] rounded-bl-md"
                      }`}
                      style={
                        mine
                          ? {
                              background:
                                "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                              opacity: m.pending ? 0.6 : 1,
                            }
                          : undefined
                      }
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {m.text}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          mine ? "text-white/60" : "text-gray-500"
                        }`}
                      >
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="text-red-400 text-xs px-5 pb-2 shrink-0">{error}</p>
      )}

      {/* Yozish maydoni */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-white/[0.06] shrink-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={t("school.messagePlaceholder")}
          className="flex-1 resize-none bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-white/25 max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
          }}
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

function isSameDay(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.toDateString() === d2.toDateString();
}

function formatTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDay(iso, t) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return t("school.today");
  const yesterday = new Date(today.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return t("school.yesterday");
  return `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
}
