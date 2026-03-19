import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { parse } from "url";
import type { InputEvent } from "./src/types/gamepad";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.ALLOWED_ORIGIN ?? ""
          : "*",
      methods: ["GET", "POST"],
    },
  });

  // room → set of socket ids
  const rooms = new Map<string, Set<string>>();

  io.on("connection", (socket) => {
    let currentRoom: string | null = null;
    let playerNumber: 1 | 2 | null = null;

    socket.on("join-room", (roomId: string) => {
      currentRoom = roomId;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }

      const room = rooms.get(roomId)!;
      const playerCount = [...room].filter((id) =>
        id.startsWith("player:")
      ).length;

      if (playerCount >= 2) {
        socket.emit("room-full");
        return;
      }

      playerNumber = (playerCount + 1) as 1 | 2;
      const playerId = `player:${socket.id}`;
      room.add(playerId);

      socket.join(roomId);
      socket.emit("player-assigned", playerNumber);
      socket.to(roomId).emit("player-joined", playerNumber);

      // Informar al game screen cuántos jugadores hay
      io.to(roomId).emit("room-update", {
        players: playerCount + 1,
      });
    });

    socket.on("join-game-screen", (roomId: string) => {
      currentRoom = roomId;
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)!.add(`screen:${socket.id}`);
      socket.join(roomId);
    });

    socket.on("input", (event: InputEvent) => {
      if (!currentRoom || !playerNumber) return;
      // Reenviar al game screen con el número de jugador
      socket.to(currentRoom).emit("input", {
        ...event,
        player: playerNumber,
      });
    });

    socket.on("disconnect", () => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (room) {
        room.delete(`player:${socket.id}`);
        room.delete(`screen:${socket.id}`);

        const playerCount = [...room].filter((id) =>
          id.startsWith("player:")
        ).length;

        if (room.size === 0) {
          rooms.delete(currentRoom);
        } else if (playerNumber) {
          io.to(currentRoom).emit("player-left", playerNumber);
          io.to(currentRoom).emit("room-update", { players: playerCount });
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> NEOARCADE running on http://localhost:${port} [${dev ? "dev" : "prod"}]`
    );
  });
});
