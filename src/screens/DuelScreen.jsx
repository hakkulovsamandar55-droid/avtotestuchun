import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Swords,
  Trophy,
  Frown,
  Handshake,
  Users,
  Shuffle,
  Send,
  Copy,
  Check,
} from "lucide-react";
import { getDuelSocket, disconnectDuelSocket } from "../duelSocket";
import SignIcon from "../components/SignIcon";
import { ACCENT_FROM, ACCENT_TO, ACCENT_WARM } from "../theme";

// Duel (jonli musobaqa) rejimi — real vaqtda ikkita foydalanuvchi bir xil
// 20 ta savolni yechadi. Server savollarni va to'g'ri javoblarni saqlaydi,
// shuning uchun bu yerda darhol "to'g'ri/xato" ko'rsatilmaydi — natija faqat
// duel tugagach ma'lum bo'ladi (bu duel uslubiga xos, TestScreen'dan farqli).
//
// Raqib topish ikki yo'l bilan bo'lishi mumkin:
//   - "random"  — umumiy navbatga qo'shilib, birinchi bo'sh raqibga ulanadi
//   - "lobby"   — o'zi lobby ochadi (6 xonali kod), do'stini Telegram orqali
//                 yoki kodni qo'lda yuborib taklif qiladi
export default function DuelScreen({ onExit }) {
  const { t } = useTranslation();
  // idle | mode_select | searching | lobby_host | lobby_join | playing | finished
  const [phase, setPhase] = useState("idle");
  const [duelId, setDuelId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [opponentName, setOpponentName] = useState("");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [myAnswered, setMyAnswered] = useState(0);
  const [opponentAnswered, setOpponentAnswered] = useState(0);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [lobbyCode, setLobbyCode] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState(null);
  const [copied, setCopied] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getDuelSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("connect_error", () => {
      setError(t("duel.connectionError"));
      setPhase("idle");
    });
    socket.on("duel:queued", () => setPhase("searching"));

    socket.on("duel:lobby_created", ({ code }) => {
      setLobbyCode(code);
      setPhase("lobby_host");
    });
    socket.on("duel:lobby_expired", () => {
      setLobbyCode(null);
      setError(t("duel.lobbyExpired"));
      setPhase("mode_select");
    });
    socket.on("duel:lobby_error", ({ reason }) => {
      setJoinError(
        reason === "self"
          ? t("duel.lobbyErrorSelf")
          : reason === "unavailable"
          ? t("duel.lobbyErrorUnavailable")
          : t("duel.lobbyErrorNotFound")
      );
    });

    socket.on("duel:start", (payload) => {
      setDuelId(payload.duelId);
      setQuestions(payload.questions);
      setOpponentName(payload.opponent.name);
      setIndex(0);
      setSelected(null);
      setMyAnswered(0);
      setOpponentAnswered(0);
      setOpponentFinished(false);
      setLobbyCode(null);
      setJoinError(null);
      setPhase("playing");
    });
    socket.on("duel:opponent_progress", ({ answered }) => setOpponentAnswered(answered));
    socket.on("duel:opponent_finished", () => setOpponentFinished(true));
    socket.on("duel:result", (payload) => {
      setResult(payload);
      setPhase("finished");
    });

    return () => {
      socket.off("connect_error");
      socket.off("duel:queued");
      socket.off("duel:lobby_created");
      socket.off("duel:lobby_expired");
      socket.off("duel:lobby_error");
      socket.off("duel:start");
      socket.off("duel:opponent_progress");
      socket.off("duel:opponent_finished");
      socket.off("duel:result");
      disconnectDuelSocket();
    };
  }, [t]);

  function openModeSelect() {
    setError(null);
    setPhase("mode_select");
  }

  function startSearching() {
    setError(null);
    socketRef.current?.emit("duel:join_queue");
    setPhase("searching");
  }

  function cancelSearching() {
    socketRef.current?.emit("duel:leave_queue");
    setPhase("mode_select");
  }

  function createLobby() {
    setError(null);
    socketRef.current?.emit("duel:create_lobby");
  }

  function cancelLobby() {
    socketRef.current?.emit("duel:cancel_lobby");
    setLobbyCode(null);
    setPhase("mode_select");
  }

  function openJoinLobby() {
    setJoinError(null);
    setJoinCode("");
    setPhase("lobby_join");
  }

  function submitJoinLobby() {
    if (joinCode.trim().length !== 6) {
      setJoinError(t("duel.lobbyErrorInvalid"));
      return;
    }
    setJoinError(null);
    socketRef.current?.emit("duel:join_lobby", { code: joinCode.trim() });
  }

  function copyLobbyCode() {
    if (!lobbyCode) return;
    navigator.clipboard?.writeText(lobbyCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function shareLobbyViaTelegram() {
    if (!lobbyCode) return;
    const botUsername = import.meta.env.VITE_BOT_USERNAME;
    const shareText = t("duel.shareText", { code: lobbyCode });
    const tg = window.Telegram?.WebApp;

    if (botUsername) {
      const startParam = `duel_${lobbyCode}`;
      const deepLink = `https://t.me/${botUsername}?start=${startParam}`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
        deepLink
      )}&text=${encodeURIComponent(shareText)}`;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(shareUrl);
        return;
      }
      window.open(shareUrl, "_blank");
      return;
    }

    // Bot username sozlanmagan bo'lsa — kodni oddiy matn sifatida ulashamiz
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      copyLobbyCode();
    }
  }

  function handleChoose(optIdx) {
    if (selected !== null) return;
    setSelected(optIdx);
    socketRef.current?.emit("duel:answer", {
      duelId,
      questionIndex: index,
      chosenIndex: optIdx,
    });
    setMyAnswered((n) => n + 1);

    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
        setSelected(null);
      }
      // Oxirgi savolda — "raqib tugatishini kutish" holati playing rejimida
      // opponentFinished/duel:result orqali avtomatik ko'rinadi.
    }, 250);
  }

  if (phase === "idle") {
    return (
      <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white flex flex-col animate-slide-in">
        <Header onExit={onExit} title={t("duel.title")} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            <Swords size={40} color="white" />
          </div>
          <h2 className="text-xl font-extrabold mb-2">{t("duel.introTitle")}</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            {t("duel.introSubtitle")}
          </p>
          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
          <button
            onClick={openModeSelect}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-sm active:scale-[0.98] transition-transform"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {t("duel.findOpponent")}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "mode_select") {
    return (
      <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white flex flex-col animate-slide-in">
        <Header onExit={onExit} title={t("duel.title")} />
        <div className="flex-1 flex flex-col justify-center gap-4 px-1">
          {error && <p className="text-red-400 text-xs text-center mb-1">{error}</p>}

          <button
            onClick={startSearching}
            className="w-full rounded-2xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Shuffle size={22} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-white text-[15px]">
                {t("duel.randomOpponent")}
              </p>
              <p className="text-white/75 text-xs mt-0.5">{t("duel.randomOpponentSubtitle")}</p>
            </div>
          </button>

          <button
            onClick={createLobby}
            className="w-full rounded-2xl p-5 flex items-center gap-4 text-left border border-white/10 bg-white/[0.05] active:scale-[0.98] transition-transform"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${ACCENT_WARM}22` }}
            >
              <Users size={22} color={ACCENT_WARM} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-white text-[15px]">{t("duel.inviteFriend")}</p>
              <p className="text-gray-400 text-xs mt-0.5">{t("duel.inviteFriendSubtitle")}</p>
            </div>
          </button>

          <button
            onClick={openJoinLobby}
            className="w-full text-center text-sm text-gray-400 py-2 active:opacity-70"
          >
            {t("duel.haveCode")}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "lobby_host") {
    return (
      <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white flex flex-col animate-slide-in">
        <Header onExit={cancelLobby} title={t("duel.title")} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ backgroundColor: `${ACCENT_WARM}22` }}
          >
            <Users size={28} color={ACCENT_WARM} />
          </div>
          <h2 className="text-lg font-bold mb-1">{t("duel.lobbyWaiting")}</h2>
          <p className="text-gray-400 text-sm mb-6">{t("duel.lobbyWaitingSubtitle")}</p>

          {lobbyCode ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-2">
                  {lobbyCode.split("").map((digit, i) => (
                    <span
                      key={i}
                      className="w-9 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-lg font-extrabold tracking-wide"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
                <button
                  onClick={copyLobbyCode}
                  className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
                >
                  {copied ? (
                    <Check size={16} color="#34D399" />
                  ) : (
                    <Copy size={16} color="#E5E7EB" />
                  )}
                </button>
              </div>

              <button
                onClick={shareLobbyViaTelegram}
                className="w-full rounded-2xl py-3.5 font-bold text-white text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mb-3"
                style={{ background: `linear-gradient(90deg, #0EA5E9, #0369A1)` }}
              >
                <Send size={16} />
                {t("duel.shareViaTelegram")}
              </button>
            </>
          ) : (
            <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-transparent animate-spin mb-6" style={{ borderTopColor: ACCENT_FROM }} />
          )}

          <button
            onClick={cancelLobby}
            className="rounded-2xl px-6 py-3 font-bold text-sm border border-white/10 bg-white/[0.04] active:scale-[0.98] transition-transform"
          >
            {t("duel.cancel")}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "lobby_join") {
    return (
      <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white flex flex-col animate-slide-in">
        <Header onExit={() => setPhase("mode_select")} title={t("duel.title")} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ backgroundColor: `${ACCENT_WARM}22` }}
          >
            <Users size={28} color={ACCENT_WARM} />
          </div>
          <h2 className="text-lg font-bold mb-1">{t("duel.enterCode")}</h2>
          <p className="text-gray-400 text-sm mb-6">{t("duel.enterCodeSubtitle")}</p>

          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="000000"
            className="w-full text-center text-2xl font-extrabold tracking-[0.3em] rounded-2xl py-3.5 mb-4 bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 outline-none"
          />

          {joinError && <p className="text-red-400 text-xs mb-4">{joinError}</p>}

          <button
            onClick={submitJoinLobby}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-sm active:scale-[0.98] transition-transform mb-3"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {t("duel.joinLobby")}
          </button>
          <button
            onClick={() => setPhase("mode_select")}
            className="rounded-2xl px-6 py-3 font-bold text-sm border border-white/10 bg-white/[0.04] active:scale-[0.98] transition-transform"
          >
            {t("duel.cancel")}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "searching") {
    return (
      <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white flex flex-col animate-slide-in">
        <Header onExit={cancelSearching} title={t("duel.title")} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-transparent animate-spin mb-6" style={{ borderTopColor: ACCENT_FROM }} />
          <h2 className="text-lg font-bold mb-2">{t("duel.searching")}</h2>
          <p className="text-gray-400 text-sm mb-8">{t("duel.searchingSubtitle")}</p>
          <button
            onClick={cancelSearching}
            className="rounded-2xl px-6 py-3 font-bold text-sm border border-white/10 bg-white/[0.04] active:scale-[0.98] transition-transform"
          >
            {t("duel.cancel")}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    const question = questions[index];
    if (!question) return null;
    const myPct = (myAnswered / questions.length) * 100;
    const oppPct = (opponentAnswered / questions.length) * 100;

    return (
      <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-lg font-extrabold flex-1">{t("duel.vsTitle", { name: opponentName })}</h1>
          <span className="text-xs text-gray-400">{index + 1}/{questions.length}</span>
        </div>

        {/* Ikkala o'yinchining progressi */}
        <div className="space-y-1.5 mb-6">
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">{t("duel.you")}</p>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${myPct}%`, background: ACCENT_FROM }} />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">
              {opponentName} {opponentFinished && `· ${t("duel.opponentDone")}`}
            </p>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${oppPct}%`, background: ACCENT_WARM }} />
            </div>
          </div>
        </div>

        {question.image && (
          <div className="w-full flex justify-center mb-5">
            <div className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center shadow-lg">
              <SignIcon code={question.image} size={92} />
            </div>
          </div>
        )}

        <h2 className="text-[17px] font-bold leading-snug mb-5">{question.text}</h2>

        <div className="space-y-3">
          {question.options.map((opt, i) => {
            const isChosen = selected === i;
            return (
              <button
                key={i}
                onClick={() => handleChoose(i)}
                disabled={selected !== null}
                className={`w-full text-left rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-colors ${
                  isChosen
                    ? "border-white/30 bg-white/[0.08] text-white"
                    : "border-white/10 bg-white/[0.04] text-white/90"
                }`}
              >
                <span className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-sm leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        {myAnswered === questions.length && (
          <p className="text-center text-sm text-gray-400 mt-6">{t("duel.waitingOpponent")}</p>
        )}
      </div>
    );
  }

  if (phase === "finished" && result) {
    const isWin = result.result === "win";
    const isDraw = result.result === "draw";
    const Icon = isDraw ? Handshake : isWin ? Trophy : Frown;
    const color = isDraw ? "#9CA3AF" : isWin ? "#34D399" : "#F87171";

    return (
      <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white flex flex-col animate-slide-in">
        <Header onExit={onExit} title={t("duel.title")} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
            style={{ backgroundColor: `${color}22` }}
          >
            <Icon size={40} color={color} />
          </div>
          <h2 className="text-2xl font-extrabold mb-1">
            {isDraw ? t("duel.resultDraw") : isWin ? t("duel.resultWin") : t("duel.resultLose")}
          </h2>
          {result.forfeit && (
            <p className="text-gray-400 text-xs mb-4">{t("duel.forfeitNote")}</p>
          )}

          <div className="w-full flex gap-3 mt-6">
            <ScoreCard label={t("duel.you")} correct={result.me.correct} total={questions.length} highlight={isWin} />
            <ScoreCard label={result.opponent.name} correct={result.opponent.correct} total={questions.length} highlight={!isWin && !isDraw} />
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <button
            onClick={openModeSelect}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-sm active:scale-[0.98] transition-transform"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {t("duel.playAgain")}
          </button>
          <button
            onClick={onExit}
            className="w-full rounded-2xl py-3.5 font-bold text-sm text-gray-400"
          >
            {t("duel.backHome")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function Header({ onExit, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={onExit}
        className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
      >
        <ChevronLeft size={20} color="#E5E7EB" />
      </button>
      <h1 className="text-lg font-extrabold text-white">{title}</h1>
    </div>
  );
}

function ScoreCard({ label, correct, total, highlight }) {
  return (
    <div
      className={`flex-1 rounded-2xl p-4 border ${
        highlight ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <p className="text-xs text-gray-400 mb-1 truncate">{label}</p>
      <p className="text-xl font-extrabold">
        {correct}/{total}
      </p>
    </div>
  );
}
