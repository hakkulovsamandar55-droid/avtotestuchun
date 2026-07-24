import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Check, Loader2 } from "lucide-react";
import { api } from "../../api";

/**
 * Foydalanuvchi qidirish va tanlash komponenti.
 *
 * NIMA UCHUN KERAK: avval Owner o'qituvchi qo'shish uchun ID kiritardi.
 * Bu ikki sababdan yomon edi:
 *   1) Hech kim o'zining ichki ID sini bilmaydi
 *   2) Ko'pchilik Telegram ID kiritardi (10 xonali), u esa INT4 ga sig'maydi
 *      va server 500 qaytarardi
 *
 * Endi ism/username/telefon bo'yicha qidiriladi va faqat TAYINLASH MUMKIN
 * bo'lganlar ko'rsatiladi (boshqa maktabga a'zo bo'lmaganlar).
 *
 * Qayta ishlatiladigan qilib yozildi — kelajakda talaba qidirish, guruhga
 * ko'chirish kabi joylarda ham ishlatiladi.
 */
export default function UserSearchPicker({ schoolId, selectedUser, onSelect, autoFocus }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // Har bir harfda so'rov yubormaslik uchun debounce (300ms).
  // requestId — kech kelgan javob yangisini bosib ketmasligi uchun.
  const timerRef = useRef(null);
  const requestIdRef = useRef(0);

  const runSearch = useCallback(
    async (q) => {
      const myId = ++requestIdRef.current;
      setSearching(true);
      setError("");
      try {
        const res = await api.schoolSearchUsers(schoolId, q);
        if (myId !== requestIdRef.current) return; // eskirgan javob
        setResults(res.users || []);
        setSearched(true);
      } catch (err) {
        if (myId !== requestIdRef.current) return;
        setError(err.message);
        setResults([]);
      } finally {
        if (myId === requestIdRef.current) setSearching(false);
      }
    },
    [schoolId]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      requestIdRef.current++; // uchayotgan so'rovlarni bekor qilamiz
      return;
    }

    timerRef.current = setTimeout(() => runSearch(q), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, runSearch]);

  return (
    <div>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("school.searchUserPlaceholder")}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-3 text-sm text-white outline-none focus:border-white/25"
        />
        {searching && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin"
          />
        )}
      </div>

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      {selectedUser && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2.5">
          <Avatar user={selectedUser} />
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">{selectedUser.name}</p>
            {selectedUser.username && (
              <p className="text-gray-400 text-xs truncate">@{selectedUser.username}</p>
            )}
          </div>
          <Check size={18} className="text-emerald-400 shrink-0" />
        </div>
      )}

      {!selectedUser && results.length > 0 && (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <Avatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-gray-500 text-xs truncate">
                  {user.username ? `@${user.username}` : `ID: ${user.id}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!selectedUser && searched && !searching && results.length === 0 && (
        <p className="text-gray-500 text-xs mt-3 text-center py-3">
          {t("school.noUsersFound")}
        </p>
      )}

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="text-gray-600 text-[11px] mt-2">{t("school.searchMinChars")}</p>
      )}
    </div>
  );
}

function Avatar({ user }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }
  const initial = (user.name || "?").charAt(0).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <span className="text-white text-sm font-semibold">{initial}</span>
    </div>
  );
}
