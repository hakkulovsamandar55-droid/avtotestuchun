import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { api } from "../../api";
import SchoolChatScreen from "./SchoolChatScreen";

/**
 * Chatlar ro'yxati + tanlangan chat ekrani.
 *
 * myMembershipId majburiy — xabar kimniki ekanini aniqlash uchun kerak.
 * Uni ota-komponent (dashboard) uzatadi, chunki u allaqachon bilади.
 */
export default function SchoolChatListScreen({ schoolId, myMembershipId, onBack }) {
  const { t } = useTranslation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openChat, setOpenChat] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.schoolChats(schoolId);
      setChats(res.chats || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  // Chat ochilganda o'qilmaganlar nolga tushadi — ro'yxatni ham yangilaymiz
  const handleRead = useCallback((chatId) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  if (openChat) {
    return (
      <SchoolChatScreen
        schoolId={schoolId}
        chat={{ ...openChat, myMembershipId }}
        onBack={() => {
          setOpenChat(null);
          load(); // ro'yxatni yangilaymiz — oxirgi xabar o'zgargan bo'lishi mumkin
        }}
        onRead={handleRead}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white">
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <p className="font-bold text-lg">{t("school.messages")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-gray-500" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm px-5">{error}</p>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center py-16 px-8">
          <MessageCircle size={32} className="text-gray-700 mb-3" />
          <p className="text-gray-500 text-xs text-center leading-relaxed">
            {t("school.noChatsYet")}
          </p>
        </div>
      ) : (
        <div className="px-5 space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setOpenChat(chat)}
              className="w-full flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-left hover:bg-white/[0.06] transition-colors"
            >
              {chat.other?.avatarUrl ? (
                <img
                  src={chat.other.avatarUrl}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">
                    {(chat.other?.name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate">{chat.other?.name}</p>
                  {chat.lastMessageAt && (
                    <span className="text-gray-600 text-[10px] shrink-0">
                      {formatShort(chat.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-gray-500 text-xs truncate">
                    {chat.lastMessageText || t("school.noMessagesYet")}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span
                      className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                      }}
                    >
                      {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatShort(iso) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return `${d.getDate()}.${d.getMonth() + 1}`;
}
