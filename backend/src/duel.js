import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { prisma } from "./db.js";
import { getRandomExamQuestions } from "./data/ticketsData.js";

// === Duel (jonli musobaqa) rejimi ===
// Ikkita foydalanuvchi bir xil 20 ta savolni bir vaqtda yechadi.
// G'olib: kamroq xato qilgan, teng bo'lsa — tezroq tugatgan.
//
// MUHIM CHEKLOV: barcha holat xotirada (in-memory) saqlanadi — server qayta
// ishga tushsa yoki bir nechta instansiyada ishlasa (masalan Render'da
// avtomatik scaling yoqilsa), duel holati yo'qoladi. Hozircha bitta
// instansiya uchun yetarli; kelajakda ko'proq foydalanuvchi bo'lsa, Redis
// kabi umumiy xotira kerak bo'ladi.

const DUEL_DURATION_MS = 3 * 60 * 1000; // 3 daqiqa
const QUESTIONS_COUNT = 20;

const waitingQueue = []; // { socket, userId, name }
const activeDuels = new Map(); // duelId -> session
const socketToDuel = new Map(); // socket.id -> duelId

function publicQuestion(q, idx) {
  // "correct" javobni clientga yubormaymiz — aks holda tarmoq orqali
  // ko'rish mumkin bo'lib qoladi va musobaqa adolatsiz bo'ladi.
  return { index: idx, id: q.id, text: q.text, image: q.image || null, options: q.options };
}

function removeFromQueue(socketId) {
  const idx = waitingQueue.findIndex((w) => w.socket.id === socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

function computeScore(player) {
  const correct = player.answers.filter((a) => a && a.isCorrect).length;
  return { correct, mistakes: QUESTIONS_COUNT - correct };
}

function finishDuel(duelId, { forfeitWinnerId } = {}) {
  const session = activeDuels.get(duelId);
  if (!session || session.ended) return;
  session.ended = true;
  clearTimeout(session.timer);

  const [idA, idB] = Object.keys(session.players);
  const a = session.players[idA];
  const b = session.players[idB];

  let winnerId = forfeitWinnerId ?? null;

  if (!winnerId) {
    const scoreA = computeScore(a);
    const scoreB = computeScore(b);
    if (scoreA.mistakes !== scoreB.mistakes) {
      winnerId = scoreA.mistakes < scoreB.mistakes ? idA : idB;
    } else {
      const timeA = a.finishedAtMs ?? Infinity;
      const timeB = b.finishedAtMs ?? Infinity;
      if (timeA !== timeB) winnerId = timeA < timeB ? idA : idB;
      // aks holda — durrang (winnerId null qoladi)
    }
  }

  for (const [uid, player] of Object.entries(session.players)) {
    const opponentId = uid === idA ? idB : idA;
    const opponent = session.players[opponentId];
    const myScore = computeScore(player);
    const oppScore = computeScore(opponent);
    if (player.socket.connected) {
      player.socket.emit("duel:result", {
        duelId,
        result: winnerId === null ? "draw" : winnerId === uid ? "win" : "lose",
        forfeit: Boolean(forfeitWinnerId),
        me: { correct: myScore.correct, mistakes: myScore.mistakes, timeMs: player.finishedAtMs },
        opponent: {
          name: opponent.name,
          correct: oppScore.correct,
          mistakes: oppScore.mistakes,
          timeMs: opponent.finishedAtMs,
        },
      });
    }
    socketToDuel.delete(player.socket.id);
  }

  activeDuels.delete(duelId);
}

function createDuel(playerA, playerB) {
  const duelId = randomUUID();
  const questions = getRandomExamQuestions().slice(0, QUESTIONS_COUNT);

  const session = {
    id: duelId,
    questions,
    startedAt: Date.now(),
    ended: false,
    players: {
      [playerA.userId]: {
        socket: playerA.socket,
        name: playerA.name,
        answers: new Array(QUESTIONS_COUNT).fill(null),
        finishedAtMs: null,
      },
      [playerB.userId]: {
        socket: playerB.socket,
        name: playerB.name,
        answers: new Array(QUESTIONS_COUNT).fill(null),
        finishedAtMs: null,
      },
    },
    timer: setTimeout(() => finishDuel(duelId), DUEL_DURATION_MS),
  };

  activeDuels.set(duelId, session);
  socketToDuel.set(playerA.socket.id, duelId);
  socketToDuel.set(playerB.socket.id, duelId);

  const publicQuestions = questions.map(publicQuestion);

  playerA.socket.emit("duel:start", {
    duelId,
    questions: publicQuestions,
    opponent: { name: playerB.name },
    durationMs: DUEL_DURATION_MS,
  });
  playerB.socket.emit("duel:start", {
    duelId,
    questions: publicQuestions,
    opponent: { name: playerA.name },
    durationMs: DUEL_DURATION_MS,
  });
}

export function initDuelSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: "*" } });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("Token yo'q");
      socket.auth = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = String(socket.auth.sub);
    let name = "Foydalanuvchi";
    try {
      const user = await prisma.user.findUnique({ where: { id: socket.auth.sub } });
      if (user) name = user.name || name;
    } catch {
      // Ism topilmasa ham duelga xalaqit bermasin — standart ism bilan davom etadi
    }

    socket.on("duel:join_queue", () => {
      // Bir xil foydalanuvchi ikki marta navbatga tushib qolmasin
      removeFromQueue(socket.id);
      if (socketToDuel.has(socket.id)) return; // allaqachon duelda

      const opponent = waitingQueue.shift();
      if (opponent && opponent.userId !== userId) {
        createDuel(opponent, { socket, userId, name });
      } else {
        if (opponent) waitingQueue.push(opponent); // o'zi bilan mos tushmasin
        waitingQueue.push({ socket, userId, name });
        socket.emit("duel:queued");
      }
    });

    socket.on("duel:leave_queue", () => {
      removeFromQueue(socket.id);
    });

    socket.on("duel:answer", ({ duelId, questionIndex, chosenIndex }) => {
      const session = activeDuels.get(duelId);
      if (!session || session.ended) return;
      const player = session.players[userId];
      if (!player) return;
      if (
        !Number.isInteger(questionIndex) ||
        questionIndex < 0 ||
        questionIndex >= QUESTIONS_COUNT
      )
        return;
      if (player.answers[questionIndex] !== null) return; // qayta yuborilishi mumkin emas

      const question = session.questions[questionIndex];
      const isCorrect = chosenIndex === question.correct;
      player.answers[questionIndex] = { chosenIndex, isCorrect };

      const answeredCount = player.answers.filter((a) => a !== null).length;

      const opponentEntry = Object.entries(session.players).find(([uid]) => uid !== userId);
      if (opponentEntry) {
        const [, opponent] = opponentEntry;
        if (opponent.socket.connected) {
          opponent.socket.emit("duel:opponent_progress", { answered: answeredCount });
        }
      }

      if (answeredCount === QUESTIONS_COUNT) {
        player.finishedAtMs = Date.now() - session.startedAt;
        const otherEntry = Object.entries(session.players).find(([uid]) => uid !== userId);
        if (otherEntry) {
          const [otherUid, otherPlayer] = otherEntry;
          if (otherPlayer.socket.connected) {
            otherPlayer.socket.emit("duel:opponent_finished");
          }
          if (otherPlayer.finishedAtMs !== null) {
            finishDuel(duelId);
          }
        }
      }
    });

    socket.on("disconnect", () => {
      removeFromQueue(socket.id);
      const duelId = socketToDuel.get(socket.id);
      if (!duelId) return;
      const session = activeDuels.get(duelId);
      if (!session || session.ended) return;
      const otherUid = Object.keys(session.players).find((uid) => uid !== userId);
      // Raqib chiqib ketsa, qolgan o'yinchi avtomatik g'olib bo'ladi
      finishDuel(duelId, { forfeitWinnerId: otherUid });
    });
  });

  return io;
}
