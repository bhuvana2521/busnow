import { io } from "socket.io-client";

const SERVER_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.warn("⚠️ Socket connection error:", err.message);
});

export default socket;
