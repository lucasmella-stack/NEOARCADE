import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Use the current page origin so it works from any domain
    // (localhost, ngrok, production) without env var configuration
    const url =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    socket = io(url, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}
