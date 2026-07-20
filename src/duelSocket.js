import { io } from "socket.io-client";
import { getToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let socket = null;

// Duel uchun bitta ulanish — ekran almashganda qayta ulanmasin.
// Har chaqirilganda joriy tokenni tekshiradi (login qilingandan keyin chaqirilishi shart).
export function getDuelSocket() {
  if (socket) return socket;
  socket = io(API_URL, {
    autoConnect: false,
    auth: (cb) => cb({ token: getToken() }),
  });
  return socket;
}

export function disconnectDuelSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
