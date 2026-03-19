"use client";

import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/game.store";
import type { Button } from "@/types/gamepad";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
    [button, onPress],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (pressedRef.current) {
        pressedRef.current = false;
        onRelease(button);
      }
    },
    [button, onRelease],
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
  const {
    playerNumber,
    setPlayerNumber,
    setRoomId,
    setConnected,
    isConnected,
  } = useGameStore();

  const [orientationLocked, setOrientationLocked] = useState(false);

  useEffect(() => {
    document.body.classList.add("controller-view");
    return () => document.body.classList.remove("controller-view");
  }, []);

  // Try to lock orientation to landscape on mount
  useEffect(() => {
    const lockLandscape = async () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock(o: string): Promise<void>;
          unlock(): void;
        };
        await orientation.lock("landscape");
        setOrientationLocked(true);
      } catch {
        // Most browsers require fullscreen first — will retry on user gesture
      }
    };
    lockLandscape();
    return () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          unlock(): void;
        };
        orientation.unlock();
      } catch {
        /* ignore */
      }
    };
  }, []);

  // On first touch, request fullscreen + landscape lock (needs user gesture)
  useEffect(() => {
    if (orientationLocked) return;
    const tryLock = async () => {
      try {
        await document.documentElement.requestFullscreen();
        const orientation = screen.orientation as ScreenOrientation & {
          lock(o: string): Promise<void>;
        };
        await orientation.lock("landscape");
        setOrientationLocked(true);
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("touchstart", tryLock, { once: true });
    return () => document.removeEventListener("touchstart", tryLock);
  }, [orientationLocked]);

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
    if (socket.connected)
      socket.emit("input", { type: "input", button, state: "pressed" });
  }, []);

  const release = useCallback((button: Button) => {
    const socket = getSocket();
    if (socket.connected)
      socket.emit("input", { type: "input", button, state: "released" });
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen()
        .then(() => {
          try {
            const o = screen.orientation as ScreenOrientation & {
              lock(o: string): Promise<void>;
            };
            o.lock("landscape").catch(() => {});
          } catch {
            /* ignore */
          }
        })
        .catch(() => {});
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
      {/* ── Fullscreen button ── */}
      <button className="pad-fs-btn" onClick={handleFullscreen}>
        ⛶ AMPLIAR
      </button>

      {/* ── Gamepad body ── */}
      <div className="pad-body">
        {/* ── Left: D-Pad (connected cross) ── */}
        <div className="pad-left">
          <div className="dpad">
            <div className="dpad-cross-h" />
            <div className="dpad-cross-v" />
            <ControlButton
              button="up"
              label={<DpadArrow dir="up" />}
              className="dpad-arm dpad-up"
              onPress={press}
              onRelease={release}
            />
            <ControlButton
              button="right"
              label={<DpadArrow dir="right" />}
              className="dpad-arm dpad-right"
              onPress={press}
              onRelease={release}
            />
            <ControlButton
              button="down"
              label={<DpadArrow dir="down" />}
              className="dpad-arm dpad-down"
              onPress={press}
              onRelease={release}
            />
            <ControlButton
              button="left"
              label={<DpadArrow dir="left" />}
              className="dpad-arm dpad-left"
              onPress={press}
              onRelease={release}
            />
            <div className="dpad-center-dot" />
          </div>
        </div>

        {/* ── Center: logo + system buttons ── */}
        <div className="pad-center">
          <span className="pad-logo">NEOARCADE</span>
          <div className="pad-sys-row">
            <ControlButton
              button="select"
              label="SELECT"
              className="sys-btn"
              onPress={press}
              onRelease={release}
            />
            <ControlButton
              button="start"
              label="START"
              className="sys-btn"
              onPress={press}
              onRelease={release}
            />
          </div>
          <div className="pad-indicators">
            {playerNumber && (
              <span className="pad-player">P{playerNumber}</span>
            )}
            <span
              className="pad-dot"
              style={{
                backgroundColor: isConnected ? C.cyan : "#ff3366",
                boxShadow: isConnected
                  ? `0 0 6px ${C.cyan}`
                  : "0 0 6px #ff3366",
              }}
            />
          </div>
        </div>

        {/* ── Right: A / B buttons ── */}
        <div className="pad-right">
          <div className="ab-row">
            <ControlButton
              button="b"
              label="B"
              className="action-btn btn-b"
              onPress={press}
              onRelease={release}
            />
            <ControlButton
              button="a"
              label="A"
              className="action-btn btn-a"
              onPress={press}
              onRelease={release}
            />
          </div>
        </div>
      </div>

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
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ transform: `rotate(${rotate}deg)`, opacity: 0.9 }}
    >
      <polygon points="12,4 20,18 4,18" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const padStyles = `
  /* ── Root: fills entire screen ── */
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

  /* ── Fullscreen button ── */
  .pad-fs-btn {
    position: fixed;
    top: 8px;
    right: 10px;
    z-index: 20;
    font-family: "Courier New", monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: ${C.cyan};
    background: ${C.darkBlue};
    border: 1.5px solid ${C.blue};
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
    text-shadow: 0 0 6px ${C.cyanGlow}60;
    box-shadow: 0 0 8px ${C.blue}40;
    -webkit-tap-highlight-color: transparent;
  }
  .pad-fs-btn:active {
    background: ${C.blue};
    color: #fff;
    box-shadow: 0 0 14px ${C.cyan};
  }

  /* ── Gamepad body ── */
  .pad-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 94%;
    max-width: 720px;
    height: 80%;
    max-height: 320px;
    background: linear-gradient(170deg, ${C.darkBlue}, ${C.bg});
    border: 2.5px solid ${C.blue};
    border-radius: 24px;
    box-shadow:
      0 0 18px ${C.blue}50,
      0 0 40px ${C.blue}18,
      inset 0 1px 0 ${C.blue}20;
    padding: 0 4%;
    position: relative;
  }

  /* ── Left section (D-Pad) ── */
  .pad-left {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  /* ── D-Pad: connected cross shape ── */
  .dpad {
    position: relative;
    width: clamp(150px, 46vmin, 230px);
    height: clamp(150px, 46vmin, 230px);
  }

  /* Cross bars */
  .dpad-cross-h, .dpad-cross-v {
    position: absolute;
    background: linear-gradient(145deg, #0a1a5c, ${C.darkBlue});
    border: 2.5px solid ${C.blue};
    box-shadow: 0 0 10px ${C.blue}50, inset 0 1px 0 ${C.blue}30;
  }
  .dpad-cross-h {
    top: 50%;
    left: 0;
    right: 0;
    height: 38%;
    transform: translateY(-50%);
    border-radius: 10px;
  }
  .dpad-cross-v {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 38%;
    transform: translateX(-50%);
    border-radius: 10px;
  }

  /* Center dot */
  .dpad-center-dot {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 16px; height: 16px;
    border-radius: 50%;
    background: ${C.blue};
    box-shadow: 0 0 8px ${C.cyan}80;
    z-index: 3;
    pointer-events: none;
  }

  /* Touch zones */
  .dpad-arm {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: ${C.cyan};
    cursor: pointer;
    z-index: 2;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.06s;
  }

  .dpad-up {
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 38%; height: 42%;
    border-radius: 10px 10px 0 0;
  }
  .dpad-down {
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 38%; height: 42%;
    border-radius: 0 0 10px 10px;
  }
  .dpad-left {
    left: 0; top: 50%;
    transform: translateY(-50%);
    width: 42%; height: 38%;
    border-radius: 10px 0 0 10px;
  }
  .dpad-right {
    right: 0; top: 50%;
    transform: translateY(-50%);
    width: 42%; height: 38%;
    border-radius: 0 10px 10px 0;
  }

  .dpad-arm:active {
    background: ${C.blue}90;
    box-shadow: 0 0 24px ${C.cyan}70, inset 0 0 14px ${C.cyan}40;
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
    font-size: clamp(10px, 2.8vmin, 14px);
    font-weight: 700;
    letter-spacing: 0.35em;
    color: ${C.cyan};
    text-shadow: 0 0 10px ${C.cyanGlow}90;
    text-transform: uppercase;
  }

  .pad-sys-row {
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .sys-btn {
    height: 28px;
    padding: 0 18px;
    border-radius: 14px;
    font-family: "Courier New", monospace;
    font-size: clamp(8px, 2vmin, 11px);
    font-weight: 700;
    letter-spacing: 0.15em;
    color: ${C.cyan}cc;
    background: linear-gradient(180deg, #0a1a5c, ${C.darkBlue});
    border: 1.5px solid ${C.blue};
    cursor: pointer;
    transition: background 0.06s, box-shadow 0.06s, transform 0.06s;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  .sys-btn:active {
    transform: scale(0.92);
    background: ${C.blue};
    box-shadow: 0 0 12px ${C.cyan}90;
    color: #fff;
  }

  .pad-indicators {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pad-player {
    font-family: "Courier New", monospace;
    font-size: 12px;
    font-weight: 700;
    color: ${C.cyan};
    letter-spacing: 0.1em;
    text-shadow: 0 0 6px ${C.cyanGlow}60;
  }
  .pad-dot {
    width: 8px; height: 8px;
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
    gap: 5vmin;
    align-items: center;
    transform: rotate(-12deg);
  }

  .action-btn {
    width: clamp(68px, 22vmin, 110px);
    height: clamp(68px, 22vmin, 110px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Courier New", monospace;
    font-size: clamp(20px, 6vmin, 32px);
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.05s, box-shadow 0.05s, background 0.05s;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    border: 3px solid;
    text-shadow: 0 0 8px currentColor;
  }

  .btn-a {
    color: ${C.cyan};
    background: linear-gradient(145deg, #0a1a5c, ${C.darkBlue});
    border-color: ${C.cyan};
    box-shadow:
      0 0 14px ${C.cyan}60,
      0 0 32px ${C.cyanGlow}25,
      inset 0 2px 4px ${C.cyan}20;
  }
  .btn-a:active {
    transform: scale(0.88);
    background: ${C.blue};
    box-shadow:
      0 0 24px ${C.cyan},
      0 0 48px ${C.cyanGlow}70,
      inset 0 0 14px ${C.cyan}40;
    color: #fff;
  }

  .btn-b {
    color: ${C.blue};
    background: linear-gradient(145deg, #0a1a5c, ${C.darkBlue});
    border-color: ${C.blue};
    box-shadow:
      0 0 12px ${C.blue}50,
      inset 0 2px 4px ${C.blue}20;
  }
  .btn-b:active {
    transform: scale(0.88);
    background: ${C.blue};
    box-shadow:
      0 0 20px ${C.blue},
      0 0 40px ${C.blue}60,
      inset 0 0 12px ${C.cyan}30;
    color: ${C.cyan};
  }

  /* ── Status text ── */
  .pad-status {
    position: fixed;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    font-family: "Courier New", monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: ${C.cyan}60;
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

  /* ── Portrait fallback: rotate the entire UI to landscape ── */
  @media (orientation: portrait) {
    .pad-root {
      transform: rotate(90deg);
      transform-origin: center center;
      width: 100dvh;
      height: 100dvw;
    }
  }
`;
