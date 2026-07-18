import { io } from "socket.io-client";

const SOCKET_URL = "http://10.0.2.2:5000";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true
});

socket.on("connect", () => {
  console.log("🟢 GLOBAL SOCKET CONNECT:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 SOCKET DISCONNECT");
});

socket.on("connect_error", (err) => {
  console.log("❌ SOCKET ERROR:", err.message);
});