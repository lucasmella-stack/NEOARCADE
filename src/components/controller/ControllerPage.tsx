"use client";

import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/game.store";
import type { Button } from "@/types/gamepad";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

// ─── Colors from NEOARCADE logo ─────────────────────────────────────────────
const C = {
  cyan: "#58FAFD",
  cyanGlow: "#20E9FB",
  blue: "#024DD6",
  darkBlue: "#011246",
  bg: "#010224",
  black: "#000000",
} as const;

// ─── ControlButton ─────────────────────────────────────────────────────────────

interface ControlButtonProps {
  button: Button;
  label: React.ReactNode;
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
        if (navigator.vibrate) navigator.vibrate(12);
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
      className={`ctrl-btn ${className}`}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
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
      onMouseLeave={() => {
        if (pressedRef.current) {
          pressedRef.current = false;
          onRelease(button);
        }
      }}
      aria-label={String(button)}
    >
      {label}
    </button>
  );
}

// ─── ControllerPage ────────────────────────────────────────────────────────────

export function ControllerPage() {
  const searchParams = useSearchParams();
  const { playerNumber, setPlayerNumber, setRoomId, setConnected, isConnected } =
    useGameStore();

  useEffect(() => {
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
    socket.on("player-assigned", (n: 1 | 2) => setPlayerNumber(n));
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
    if (socket.connected) socket.emit("input", { type: "input", button, state: "pressed" });
  }, []);

  const release = useCallback((button: Button) => {
    const socket = getSocket();
    if (socket.connected) socket.emit("input", { type: "input", button, state: "released" });
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const roomId = searchParams.get("room");

  if (!roomId) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          backgroundColor: C.bg,
        }}
      >
        <p
          style={{
            fontSize: 20,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: C.cyan,
            textShadow: `0 0 12px ${C.cyanGlow}`,
            fontFamily: '"Courier New", monospace',
          }}
        >
          NEOARCADE
        </p>
        <p style={{ fontSize: 13, color: "#556" }}>
          Escanea el QR desde la consola para conectarte
        </p>
      </div>
    );
  }

  return (
    <div className="pad-root">
      {/* ── Gamepad body ── */}
      <div className="pad-body">
        {/* ── Left wing: D-Pad ── */}
        <div className="pad-left">
          <div className="dpad">
            <ControlButton button="up" label={<DpadArrow dir="up" />} className="dpad-arm dpad-up" onPress={press} onRelease={release} />
            <ControlButton button="right" label={<DpadArrow dir="right" />} className="dpad-arm dpad-right" onPress={press} onRelease={release} />
            <ControlButton button="down" label={<DpadArrow dir="down" />} className="dpad-arm dpad-down" onPress={press} onRelease={release} />
            <ControlButton button="left" label={<DpadArrow dir="left" />} className="dpad-arm dpad-left" onPress={press} onRelease={release} />
            <div className="dpad-center" />
          </div>
        </div>

        {/* ── Center: logo + system buttons ── */}
        <div className="pad-center">
          <span className="pad-logo">NEOARCADE</span>
          <div className="pad-sys-row">
            <ControlButton button="select" label="SELECT" className="sys-btn" onPress={press} onRelease={release} />
            <ControlButton button="start" label="START" className="sys-btn" onPress={press} onRelease={release} />
          </div>
          <div className="pad-indicators">
            {playerNumber && <span className="pad-player">P{playerNumber}</span>}
            <span className="pad-dot" style={{
              backgroundColor: isConnected ? C.cyan : "#ff3366",
              boxShadow: isConnected ? `0 0 6px ${C.cyan}` : "0 0 6px #ff3366",
            }} />
          </div>
        </div>

        {/* ── Right wing: A / B buttons ── */}
        <div className="pad-right">
          <div className="ab-row">
            <ControlButton button="b" label="B" className="action-btn btn-b" onPress={press} onRelease={release} />
            <ControlButton button="a" label="A" className="action-btn btn-a" onPress={press} onRelease={release} />
          </div>
        </div>
      </div>

      {/* ── Fullscreen toggle (outside the pad body) ── */}
      <button className="pad-fs-btn" onClick={handleFullscreen} aria-label="Pantalla completa">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>

      {/* ── Connection status ── */}
      <div className="pad-status">
        {isConnected ? "● CONECTADO" : "○ CONECTANDO…"}
      </div>

      <style>{padStyles}</style>
    </div>
  );
}

// ─── D-pad arrow SVG ──────────────────────────────────────────────────────────

function DpadArrow({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  const rotate = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"
      style={{ transform: `rotate(${rotate}deg)`, opacity: 0.9 }}>
      <polygon points="12,5 19,17 5,17" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const padStyles = `
  /* ── Root ── */
  .pad-root {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: ${C.bg};
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  /* ── Gamepad body — horizontal rounded rectangle ── */
  .pad-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 96vw;
    max-width: 520px;
    height: clamp(200px, 50vw, 280px);
    background: linear-gradient(145deg, ${C.darkBlue}, ${C.bg});
    border: 2.5px solid ${C.blue};
    border-radius: 24px 24px 40px 40px;
    box-shadow:
      0 0 20px ${C.blue}60,
      0 0 60px ${C.blue}20,
      inset 0 1px 0 ${C.blue}40,
      inset 0 -2px 6px ${C.black}80;
    padding: 0 14px;
    position: relative;
  }

  /* ── Left section (D-Pad) ── */
  .pad-left {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  /* ── D-Pad: cross shape with absolute positioning ── */
  .dpad {
    position: relative;
    width: 130px;
    height: 130px;
  }

  .dpad-arm {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${C.darkBlue};
    border: 2px solid ${C.blue};
    color: ${C.cyan};
    cursor: pointer;
    transition: background 0.05s, box-shadow 0.05s;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .dpad-up {
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 44px; height: 44px;
    border-radius: 10px 10px 3px 3px;
  }
  .dpad-down {
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 44px; height: 44px;
    border-radius: 3px 3px 10px 10px;
  }
  .dpad-left {
    left: 0; top: 50%;
    transform: translateY(-50%);
    width: 44px; height: 44px;
    border-radius: 10px 3px 3px 10px;
  }
  .dpad-right {
    right: 0; top: 50%;
    transform: translateY(-50%);
    width: 44px; height: 44px;
    border-radius: 3px 10px 10px 3px;
  }

  .dpad-center {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 44px; height: 44px;
    background: ${C.darkBlue};
    border: 2px solid ${C.blue};
    border-radius: 4px;
    z-index: 0;
  }

  .dpad-arm:active {
    background: ${C.blue};
    box-shadow: 0 0 14px ${C.cyan}, 0 0 30px ${C.cyanGlow}40, inset 0 0 8px ${C.cyan}30;
    color: #fff;
  }

  /* ── Center section ── */
  .pad-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .pad-logo {
    font-family: "Courier New", monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.35em;
    color: ${C.cyan};
    text-shadow: 0 0 8px ${C.cyanGlow}80;
    text-transform: uppercase;
  }

  .pad-sys-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .sys-btn {
    height: 22px;
    padding: 0 14px;
    border-radius: 11px;
    font-family: "Courier New", monospace;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: ${C.cyan}cc;
    background: ${C.darkBlue};
    border: 1.5px solid ${C.blue};
    cursor: pointer;
    transition: background 0.06s, box-shadow 0.06s, transform 0.06s;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  .sys-btn:active {
    transform: scale(0.92);
    background: ${C.blue};
    box-shadow: 0 0 10px ${C.cyan}80;
    color: #fff;
  }

  .pad-indicators {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pad-player {
    font-family: "Courier New", monospace;
    font-size: 10px;
    font-weight: 700;
    color: ${C.cyan};
    letter-spacing: 0.1em;
  }
  .pad-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Right section (A / B) ── */
  .pad-right {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  .ab-row {
    display: flex;
    gap: 16px;
    align-items: center;
    /* B slightly higher, A slightly lower — classic diagonal */
    transform: rotate(-12deg);
  }

  .action-btn {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Courier New", monospace;
    font-size: 22px;
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.05s, box-shadow 0.05s, background 0.05s;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    border: 3px solid;
    text-shadow: 0 0 6px currentColor;
  }

  .btn-a {
    color: ${C.cyan};
    background: ${C.darkBlue};
    border-color: ${C.cyan};
    box-shadow:
      0 0 12px ${C.cyan}50,
      0 0 30px ${C.cyanGlow}20,
      inset 0 2px 4px ${C.cyan}15;
  }
  .btn-a:active {
    transform: scale(0.88);
    background: ${C.blue};
    box-shadow:
      0 0 20px ${C.cyan},
      0 0 40px ${C.cyanGlow}60,
      inset 0 0 12px ${C.cyan}30;
    color: #fff;
  }

  .btn-b {
    color: ${C.blue};
    background: ${C.darkBlue};
    border-color: ${C.blue};
    box-shadow:
      0 0 10px ${C.blue}40,
      inset 0 2px 4px ${C.blue}15;
  }
  .btn-b:active {
    transform: scale(0.88);
    background: ${C.blue};
    box-shadow:
      0 0 18px ${C.blue},
      0 0 36px ${C.blue}50,
      inset 0 0 10px ${C.cyan}20;
    color: ${C.cyan};
  }

  /* ── Fullscreen button (bottom-right corner) ── */
  .pad-fs-btn {
    position: fixed;
    bottom: 12px;
    right: 12px;
    width: 32px; height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${C.cyan}80;
    background: ${C.darkBlue};
    border: 1.5px solid ${C.blue}60;
    border-radius: 8px;
    cursor: pointer;
    z-index: 10;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.1s;
  }
  .pad-fs-btn:active {
    background: ${C.blue};
    color: #fff;
  }

  /* ── Status text ── */
  .pad-status {
    position: fixed;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    font-family: "Courier New", monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: ${C.cyan}50;
    z-index: 10;
  }

  /* ── Base button reset ── */
  .ctrl-btn {
    border: none;
    outline: none;
    padding: 0;
    background: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
  }

  /* ── Responsive: larger screens ── */
  @media (min-width: 480px) {
    .pad-body {
      height: clamp(240px, 45vw, 300px);
      padding: 0 20px;
    }
    .dpad { width: 150px; height: 150px; }
    .dpad-arm { width: 50px; height: 50px; }
    .dpad-center { width: 50px; height: 50px; }
    .action-btn { width: 78px; height: 78px; font-size: 24px; }
    .ab-row { gap: 20px; }
    .pad-logo { font-size: 11px; }
    .sys-btn { font-size: 9px; height: 24px; padding: 0 16px; }
  }

  /* ── Very small screens ── */
  @media (max-width: 360px) {
    .pad-body {
      height: clamp(180px, 55vw, 240px);
      padding: 0 8px;
      border-radius: 18px 18px 30px 30px;
    }
    .dpad { width: 110px; height: 110px; }
    .dpad-arm { width: 38px; height: 38px; }
    .dpad-center { width: 38px; height: 38px; }
    .action-btn { width: 58px; height: 58px; font-size: 18px; }
    .ab-row { gap: 12px; }
    .pad-logo { font-size: 9px; }
  }
`;
