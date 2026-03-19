"use client";

import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/game.store";
import type { Button } from "@/types/gamepad";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

interface ControlButtonProps {
  button: Button;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  onPress: (btn: Button) => void;
  onRelease: (btn: Button) => void;
}

function ControlButton({
  button,
  label,
  className = "",
  style = {},
  onPress,
  onRelease,
}: ControlButtonProps) {
  const pressedRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!pressedRef.current) {
        pressedRef.current = true;
        // Vibración háptica suave
        if (navigator.vibrate) navigator.vibrate(15);
        onPress(button);
      }
    },
    [button, onPress]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (pressedRef.current) {
        pressedRef.current = false;
        onRelease(button);
      }
    },
    [button, onRelease]
  );

  return (
    <button
      className={`control-btn select-none ${className}`}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      // Soporte mouse para desarrollo
      onMouseDown={(e) => {
        e.preventDefault();
        if (!pressedRef.current) {
          pressedRef.current = true;
          onPress(button);
        }
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        pressedRef.current = false;
        onRelease(button);
      }}
      onMouseLeave={(e) => {
        if (pressedRef.current) {
          pressedRef.current = false;
          onRelease(button);
        }
      }}
      aria-label={label}
    >
      {label}
    </button>
  );
}

export function ControllerPage() {
  const searchParams = useSearchParams();
  const { playerNumber, setPlayerNumber, setRoomId, setConnected, isConnected } =
    useGameStore();

  useEffect(() => {
    // fix overflow en mobile
    document.body.classList.add("controller-view");
    return () => document.body.classList.remove("controller-view");
  }, []);

  useEffect(() => {
    const roomId = searchParams.get("room");
    if (!roomId) return;

    setRoomId(roomId);
    const socket = getSocket();
    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", roomId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("player-assigned", (n: 1 | 2) => {
      setPlayerNumber(n);
    });

    socket.on("room-full", () => {
      alert("La sala está llena (máx. 2 jugadores)");
      socket.disconnect();
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("player-assigned");
      socket.off("room-full");
      socket.disconnect();
    };
  }, [searchParams, setRoomId, setConnected, setPlayerNumber]);

  const press = useCallback((button: Button) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("input", { type: "input", button, state: "pressed" });
    }
  }, []);

  const release = useCallback((button: Button) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("input", { type: "input", button, state: "released" });
    }
  }, []);

  const roomId = searchParams.get("room");

  if (!roomId) {
    return (
      <div
        className="w-screen h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "var(--bg-deep)" }}
      >
        <p
          className="text-xl tracking-widest uppercase glow-text-primary"
          style={{ color: "var(--neon-primary)" }}
        >
          NEOARCADE
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Escanea el QR desde la consola para conectarte
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-[100dvh] flex flex-col items-center justify-between select-none overflow-hidden"
      style={{ backgroundColor: "var(--bg-deep)", padding: "12px 8px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm px-2">
        <span
          className="text-xs font-bold tracking-[0.3em] uppercase"
          style={{ color: "var(--neon-primary)" }}
        >
          NEOARCADE
        </span>
        <div className="flex items-center gap-2">
          {playerNumber && (
            <span
              className="text-xs font-bold tracking-wider px-2 py-0.5 rounded"
              style={{
                color: "var(--neon-primary)",
                border: "1px solid color-mix(in srgb, var(--neon-primary) 40%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--neon-primary) 10%, transparent)",
              }}
            >
              P{playerNumber}
            </span>
          )}
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isConnected ? "var(--neon-primary)" : "#ff3366",
              boxShadow: isConnected ? "0 0 8px var(--neon-primary)" : "0 0 8px #ff3366",
            }}
          />
        </div>
      </div>

      {/* Zona de controles */}
      <div className="flex items-center justify-between w-full max-w-sm px-2 flex-1 py-4">
        {/* D-PAD izquierdo */}
        <DPad onPress={press} onRelease={release} />

        {/* Botón START central */}
        <div className="flex flex-col items-center gap-3">
          <ControlButton
            button="select"
            label="SEL"
            onPress={press}
            onRelease={release}
            className="start-btn"
          />
          <ControlButton
            button="start"
            label="START"
            onPress={press}
            onRelease={release}
            className="start-btn"
          />
        </div>

        {/* Botones A / B derecha */}
        <ActionButtons onPress={press} onRelease={release} />
      </div>

      {/* Footer hint */}
      <p
        className="text-xs tracking-wider pb-1"
        style={{ color: "var(--text-muted)" }}
      >
        {isConnected ? "●  CONECTADO" : "○  CONECTANDO…"}
      </p>

      {/* Estilos inline del controller */}
      <style>{controllerStyles}</style>
    </div>
  );
}

// ─── D-Pad ────────────────────────────────────────────────────────────────────

interface DPadProps {
  onPress: (btn: Button) => void;
  onRelease: (btn: Button) => void;
}

function DPad({ onPress, onRelease }: DPadProps) {
  return (
    <div className="dpad-wrapper">
      {/* Fila superior */}
      <div className="dpad-row">
        <ControlButton
          button="up"
          label="▲"
          onPress={onPress}
          onRelease={onRelease}
          className="dpad-btn dpad-btn-top"
        />
      </div>
      {/* Fila media */}
      <div className="dpad-row">
        <ControlButton
          button="left"
          label="◀"
          onPress={onPress}
          onRelease={onRelease}
          className="dpad-btn dpad-btn-left"
        />
        <div className="dpad-center" />
        <ControlButton
          button="right"
          label="▶"
          onPress={onPress}
          onRelease={onRelease}
          className="dpad-btn dpad-btn-right"
        />
      </div>
      {/* Fila inferior */}
      <div className="dpad-row">
        <ControlButton
          button="down"
          label="▼"
          onPress={onPress}
          onRelease={onRelease}
          className="dpad-btn dpad-btn-bottom"
        />
      </div>
    </div>
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

interface ActionButtonsProps {
  onPress: (btn: Button) => void;
  onRelease: (btn: Button) => void;
}

function ActionButtons({ onPress, onRelease }: ActionButtonsProps) {
  return (
    <div className="action-wrapper">
      {/* B arriba-izquierda, A abajo-derecha (layout NeoGeo) */}
      <div className="action-row action-row-top">
        <ControlButton
          button="b"
          label="B"
          onPress={onPress}
          onRelease={onRelease}
          className="action-btn btn-b"
        />
      </div>
      <div className="action-row action-row-bottom">
        <ControlButton
          button="a"
          label="A"
          onPress={onPress}
          onRelease={onRelease}
          className="action-btn btn-a"
        />
      </div>
    </div>
  );
}

// ─── Estilos del controller ───────────────────────────────────────────────────

const controllerStyles = `
  /* ---- Variables ---- */
  :root {
    --btn-size: 64px;
    --dpad-size: 58px;
    --action-size: 68px;
  }

  /* ---- Base button ---- */
  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Courier New", monospace;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
    border: none;
    transition: transform 0.06s ease, box-shadow 0.06s ease, background-color 0.06s ease;
  }

  /* ---- D-Pad layout ---- */
  .dpad-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    width: calc(var(--dpad-size) * 3);
  }
  .dpad-row {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dpad-center {
    width: var(--dpad-size);
    height: var(--dpad-size);
    background: color-mix(in srgb, #00d4ff 6%, #0a0a0f);
    border-radius: 4px;
  }

  /* ---- D-Pad buttons ---- */
  .dpad-btn {
    width: var(--dpad-size);
    height: var(--dpad-size);
    font-size: 18px;
    color: #00d4ff;
    background: color-mix(in srgb, #00d4ff 8%, #0f0f1a);
    border: 1.5px solid color-mix(in srgb, #00d4ff 35%, transparent);
  }
  .dpad-btn-top    { border-radius: 10px 10px 4px 4px; }
  .dpad-btn-bottom { border-radius: 4px 4px 10px 10px; }
  .dpad-btn-left   { border-radius: 10px 4px 4px 10px; }
  .dpad-btn-right  { border-radius: 4px 10px 10px 4px; }

  .dpad-btn:active,
  .dpad-btn.pressed {
    transform: scale(0.92);
    background: color-mix(in srgb, #00d4ff 25%, #0f0f1a);
    box-shadow:
      0 0 10px #00d4ff,
      0 0 22px color-mix(in srgb, #00d4ff 50%, transparent),
      inset 0 0 10px color-mix(in srgb, #00d4ff 20%, transparent);
    border-color: #00d4ff;
  }

  /* ---- Action buttons layout ---- */
  .action-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: calc(var(--action-size) + 32px);
  }
  .action-row {
    display: flex;
    justify-content: center;
    width: 100%;
  }
  .action-row-top  { padding-right: calc(var(--action-size) + 8px); }
  .action-row-bottom { padding-left: calc(var(--action-size) + 8px); }

  /* ---- Action buttons ---- */
  .action-btn {
    width: var(--action-size);
    height: var(--action-size);
    border-radius: 50%;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.05em;
  }

  .btn-a {
    color: #00d4ff;
    background: color-mix(in srgb, #00d4ff 10%, #0f0f1a);
    border: 2px solid color-mix(in srgb, #00d4ff 45%, transparent);
    box-shadow: 0 0 12px color-mix(in srgb, #00d4ff 20%, transparent);
  }
  .btn-a:active {
    transform: scale(0.88);
    background: color-mix(in srgb, #00d4ff 30%, #0f0f1a);
    box-shadow:
      0 0 16px #00d4ff,
      0 0 32px color-mix(in srgb, #00d4ff 50%, transparent),
      inset 0 0 12px color-mix(in srgb, #00d4ff 25%, transparent);
    border-color: #00d4ff;
  }

  .btn-b {
    color: #0080ff;
    background: color-mix(in srgb, #0080ff 10%, #0f0f1a);
    border: 2px solid color-mix(in srgb, #0080ff 45%, transparent);
    box-shadow: 0 0 12px color-mix(in srgb, #0080ff 20%, transparent);
  }
  .btn-b:active {
    transform: scale(0.88);
    background: color-mix(in srgb, #0080ff 30%, #0f0f1a);
    box-shadow:
      0 0 16px #0080ff,
      0 0 32px color-mix(in srgb, #0080ff 50%, transparent),
      inset 0 0 12px color-mix(in srgb, #0080ff 25%, transparent);
    border-color: #0080ff;
  }

  /* ---- Start / Select ---- */
  .start-btn {
    width: 64px;
    height: 24px;
    border-radius: 12px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: color-mix(in srgb, #00d4ff 70%, #fff);
    background: color-mix(in srgb, #00d4ff 6%, #0f0f1a);
    border: 1.5px solid color-mix(in srgb, #00d4ff 30%, transparent);
    box-shadow: 0 0 6px color-mix(in srgb, #00d4ff 15%, transparent);
  }
  .start-btn:active {
    transform: scale(0.9);
    background: color-mix(in srgb, #00d4ff 20%, #0f0f1a);
    box-shadow:
      0 0 10px #00d4ff,
      0 0 20px color-mix(in srgb, #00d4ff 40%, transparent);
    border-color: #00d4ff;
  }
`;
