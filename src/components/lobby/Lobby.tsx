"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useGameStore } from "@/store/game.store";

export function Lobby() {
  const { roomId, connectedPlayers, isConnected } = useGameStore();
  const [controllerUrl, setControllerUrl] = useState("");

  useEffect(() => {
    if (roomId && typeof window !== "undefined") {
      const base = window.location.origin;
      setControllerUrl(`${base}/controller?room=${roomId}`);
    }
  }, [roomId]);

  const players = [1, 2] as const;

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-4"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid color-mix(in srgb, var(--neon-primary) 20%, transparent)",
        boxShadow: "0 0 20px color-mix(in srgb, var(--neon-primary) 8%, transparent)",
      }}
    >
      {/* Título */}
      <div className="flex items-center justify-between">
        <h2
          className="text-sm font-bold tracking-widest uppercase"
          style={{ color: "var(--neon-primary)" }}
        >
          CONECTAR JOYSTICK
        </h2>
        {/* Indicador de conexión */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isConnected ? "var(--neon-primary)" : "#ff3366",
              boxShadow: isConnected
                ? "0 0 6px var(--neon-primary)"
                : "0 0 6px #ff3366",
            }}
          />
          <span
            className="text-xs tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {isConnected ? "ON" : "OFF"}
          </span>
        </div>
      </div>

      {/* QR Code */}
      {controllerUrl ? (
        <div className="flex flex-col items-center gap-3">
          <div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: "#fff",
              boxShadow: "0 0 20px color-mix(in srgb, var(--neon-primary) 30%, transparent)",
            }}
          >
            <QRCodeSVG
              value={controllerUrl}
              size={160}
              bgColor="#ffffff"
              fgColor="#0a0a0f"
              level="M"
            />
          </div>
          <p
            className="text-xs text-center break-all leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            {controllerUrl}
          </p>
        </div>
      ) : (
        <div
          className="w-[160px] h-[160px] mx-auto rounded flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Cargando…
          </span>
        </div>
      )}

      {/* Estado de jugadores */}
      <div className="flex flex-col gap-2 pt-1">
        <p
          className="text-xs tracking-widest uppercase mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          Jugadores
        </p>
        {players.map((p) => {
          const connected = connectedPlayers >= p;
          return (
            <div
              key={p}
              className="flex items-center gap-3 px-3 py-2 rounded"
              style={{
                backgroundColor: connected
                  ? "color-mix(in srgb, var(--neon-primary) 8%, transparent)"
                  : "var(--bg-surface)",
                border: `1px solid ${
                  connected
                    ? "color-mix(in srgb, var(--neon-primary) 40%, transparent)"
                    : "color-mix(in srgb, var(--text-muted) 20%, transparent)"
                }`,
                transition: "all 0.3s ease",
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: connected ? "var(--neon-primary)" : "var(--text-muted)",
                  boxShadow: connected ? "0 0 8px var(--neon-primary)" : "none",
                  transition: "all 0.3s ease",
                }}
              />
              <span
                className="text-sm font-bold tracking-wider"
                style={{
                  color: connected ? "var(--neon-primary)" : "var(--text-muted)",
                  transition: "color 0.3s ease",
                }}
              >
                PLAYER {p}
              </span>
              <span
                className="ml-auto text-xs tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                {connected ? "READY" : "WAITING"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Instrucción */}
      <p
        className="text-xs text-center leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        Escanea el QR con tu móvil para conectarte como joystick
      </p>
    </div>
  );
}
