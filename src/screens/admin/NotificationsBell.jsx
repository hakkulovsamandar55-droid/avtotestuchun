import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { ACCENT_FROM } from "../../theme";
import { api } from "../../api";

const TYPE_ICONS = {
  SUPPORT_MESSAGE: "💬",
  PAYMENT_REQUEST: "💳",
  PREMIUM_EXPIRING: "⏳",
  NEW_REGISTRATION: "🎉",
};

function fmt(iso) {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Admin panel header'idagi bildirishnoma qo'ng'irog'i — o'qilmagan sonini ko'rsatadi (spec 5-bo'lim)
export default function NotificationsBell({ onOpenLink }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  function load() {
    api.getNotifications().then((data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    });
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  async function handleMarkAll() {
    await api.markAllNotificationsRead();
    load();
  }

  async function handleClick(n) {
    if (!n.isRead) {
      await api.markNotificationRead(n.id);
      load();
    }
    setOpen(false);
    if (n.linkType && n.linkId) onOpenLink?.(n.linkType, n.linkId);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center relative"
      >
        <Bell size={17} color="var(--icon-muted)" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1"
            style={{ background: ACCENT_FROM }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-w-[85vw] max-h-96 overflow-y-auto rounded-2xl bg-card border border-card-border shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border sticky top-0 bg-card">
            <p className="font-bold text-text-main text-sm">{t("admin.notifications.title")}</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-[11px] font-semibold" style={{ color: ACCENT_FROM }}>
                {t("admin.notifications.markAllRead")}
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-center text-text-muted text-xs py-8">{t("admin.notifications.empty")}</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="w-full flex items-start gap-2.5 px-4 py-3 text-left border-b border-card-border last:border-0 active:bg-card-soft"
                style={{ opacity: n.isRead ? 0.6 : 1 }}
              >
                <span className="text-base leading-none mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-main text-xs font-semibold truncate">{n.title}</p>
                  {n.body && <p className="text-text-muted text-[11px] truncate">{n.body}</p>}
                  <p className="text-text-muted text-[10px] mt-0.5">{fmt(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: ACCENT_FROM }} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
