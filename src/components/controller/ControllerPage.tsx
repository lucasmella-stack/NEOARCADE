"use client";

import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/game.store";
import type { Button } from "@/types/gamepad";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Colors — 3D retro solid palette ────────────────────────────────────────
const C = {
  // Primary body
  body: "#1a3a8a", // Bold blue body (like the Polaroid)
  bodyLight: "#2a55b8", // Lighter face
  bodyDark: "#0e2260", // Shadow/underside
  // D-pad & details
  dpad: "#1a1a2e", // Dark charcoal for D-pad
  dpadFace: "#252540", // Slightly lighter face
  // Buttons
  btnPink: "#e83a7d", // Bold pink like the camera
  btnPinkDark: "#b0285d",
  btnYellow: "#f5c842", // Yellow accent
  btnYellowDark: "#c89e28",
  // Accent
  cyan: "#58FAFD",
  cyanGlow: "#20E9FB",
  // Base
  bg: "#0d0d1a",
  white: "#f0f0f5",
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

// ─── DpadController — supports drag between directions ─────────────────────────

function DpadController({
  onPress,
  onRelease,
}: {
  onPress: (btn: Button) => void;
  onRelease: (btn: Button) => void;
}) {
  const dpadRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Set<string>>(new Set());

  const getDirections = useCallback(
    (touch: { clientX: number; clientY: number }): Set<string> => {
      const el = dpadRef.current;
      if (!el) return new Set();
      const rect = el.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (touch.clientY - rect.top) / rect.height - 0.5;
      const deadzone = 0.08;
      const dirs = new Set<string>();
      if (y < -deadzone) dirs.add("up");
      if (y > deadzone) dirs.add("down");
      if (x < -deadzone) dirs.add("left");
      if (x > deadzone) dirs.add("right");
      return dirs;
    },
    [],
  );

  const sync = useCallback(
    (dirs: Set<string>) => {
      const prev = activeRef.current;
      for (const btn of prev) {
        if (!dirs.has(btn)) onRelease(btn as Button);
      }
      for (const btn of dirs) {
        if (!prev.has(btn)) {
          if (navigator.vibrate) navigator.vibrate(8);
          onPress(btn as Button);
        }
      }
      activeRef.current = new Set(dirs);
    },
    [onPress, onRelease],
  );

  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        sync(new Set());
        return;
      }
      sync(getDirections(e.touches[0]));
    },
    [getDirections, sync],
  );

  return (
    <div
      ref={dpadRef}
      className="dpad"
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouch}
      onTouchCancel={handleTouch}
    >
      <div className="dpad-cross-h" />
      <div className="dpad-cross-v" />
      <div className="dpad-arrow dpad-arr-up">
        <DpadArrow dir="up" />
      </div>
      <div className="dpad-arrow dpad-arr-right">
        <DpadArrow dir="right" />
      </div>
      <div className="dpad-arrow dpad-arr-down">
        <DpadArrow dir="down" />
      </div>
      <div className="dpad-arrow dpad-arr-left">
        <DpadArrow dir="left" />
      </div>
      <div className="dpad-center-dot" />
    </div>
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen changes (webkit fallback for iOS Safari)
  useEffect(() => {
    const onFsChange = () =>
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as Document & { webkitFullscreenElement?: Element })
            .webkitFullscreenElement
        ),
      );
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

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

  // Note: auto-fullscreen on touchstart removed — it raced with the AMPLIAR button click
  // causing immediate enter+exit. Fullscreen is controlled solely by handleFullscreen.

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
    const isFullNow = !!(
      document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element })
        .webkitFullscreenElement
    );
    if (!isFullNow) {
      // iOS Safari uses webkitRequestFullscreen
      const doFs = (
        el.requestFullscreen ??
        (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
          .webkitRequestFullscreen
      )?.bind(el);
      doFs?.()
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
      const doExit = (
        document.exitFullscreen ??
        (document as Document & { webkitExitFullscreen?: () => void })
          .webkitExitFullscreen
      )?.bind(document);
      try {
        doExit?.();
      } catch {
        /* ignore */
      }
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
      {/* ── Fullscreen button — hides when already fullscreen ── */}
      {!isFullscreen && (
        <button
          className="pad-fs-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            handleFullscreen();
          }}
          onClick={handleFullscreen}
        >
          ⛶ AMPLIAR
        </button>
      )}

      {/* ── Gamepad body ── */}
      <div className={`pad-body${isFullscreen ? " pad-body-fs" : ""}`}>
        {/* ── Left: D-Pad (connected cross) ── */}
        <div className="pad-left">
          <DpadController onPress={press} onRelease={release} />
        </div>

        {/* ── Center: logo + system buttons ── */}
        <div className="pad-center">
          <Image
            src="/logo.webp"
            alt="NEOARCADE"
            width={28}
            height={28}
            className="pad-center-logo"
          />
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
                backgroundColor: isConnected ? "#44dd88" : C.btnPink,
                boxShadow: isConnected
                  ? "0 0 6px #44dd88"
                  : `0 0 6px ${C.btnPink}`,
              }}
            />
          </div>
        </div>

        {/* ── Right: Y / B / A — triangle layout ── */}
        <div className="pad-right">
          <div className="abxy-diamond">
            <ControlButton
              button="y"
              label="Y"
              className="action-btn btn-y"
              onPress={press}
              onRelease={release}
            />
            <div className="abxy-mid">
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
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotate}deg)`, opacity: 0.85 }}
    >
      <path d="M18 15L12 9L6 15" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const padStyles = `
  /* ── Base button reset — MUST be first so specific styles override ── */
  .ctrl-btn {
    border: none;
    outline: none;
    padding: 0;
    background: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
  }

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
    background: linear-gradient(160deg, #141428, ${C.bg});
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  /* ── Fullscreen button ── */
  .pad-fs-btn {
    position: fixed;
    top: 10px;
    right: 12px;
    z-index: 20;
    font-family: "Courier New", monospace;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: ${C.white};
    background: linear-gradient(180deg, ${C.btnPink}, ${C.btnPinkDark});
    border: none;
    border-radius: 10px;
    padding: 8px 18px;
    cursor: pointer;
    touch-action: manipulation;
    box-shadow:
      0 4px 0 ${C.btnPinkDark},
      0 6px 12px rgba(0,0,0,0.4);
    -webkit-tap-highlight-color: transparent;
  }
  .pad-fs-btn:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 ${C.btnPinkDark};
  }

  /* ── Gamepad body — 3D retro solid ── */
  .pad-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 92%;
    max-width: 720px;
    height: 78%;
    max-height: 320px;
    background: linear-gradient(170deg, ${C.bodyLight}, ${C.body});
    border: 3px solid ${C.bodyDark};
    border-radius: 28px;
    box-shadow:
      0 6px 0 ${C.bodyDark},
      0 10px 24px rgba(0,0,0,0.5),
      inset 0 2px 0 rgba(255,255,255,0.08);
    padding: 0 4%;
    position: relative;
  }
  /* Fullscreen: expand */
  .pad-body-fs {
    width: 96%;
    max-width: 860px;
    height: 88%;
    max-height: 400px;
  }

  /* ── Left section (D-Pad) ── */
  .pad-left {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  /* ── D-Pad ── */
  .dpad {
    position: relative;
    width: clamp(160px, 50vmin, 240px);
    height: clamp(160px, 50vmin, 240px);
  }

  /* Cross bars — 3D effect */
  .dpad-cross-h, .dpad-cross-v {
    position: absolute;
    background: linear-gradient(145deg, ${C.dpadFace}, ${C.dpad});
    border: 2px solid #11112a;
    box-shadow:
      0 3px 0 #0a0a18,
      inset 0 1px 0 rgba(255,255,255,0.06);
  }
  .dpad-cross-h {
    top: 50%;
    left: 0;
    right: 0;
    height: 36%;
    transform: translateY(-50%);
    border-radius: 8px;
  }
  .dpad-cross-v {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 36%;
    transform: translateX(-50%);
    border-radius: 8px;
  }

  /* Center dot — 3D inset */
  .dpad-center-dot {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 14px; height: 14px;
    border-radius: 50%;
    background: radial-gradient(circle, #333355, #1a1a30);
    border: 1.5px solid #0a0a18;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
    z-index: 3;
    pointer-events: none;
  }

  /* Touch zones — LARGE, overlapping center for better sensitivity */
  .dpad-arrow {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.5);
    pointer-events: none;
  }

  .dpad-arr-up {
    top: 6%; left: 50%;
    transform: translateX(-50%);
  }
  .dpad-arr-down {
    bottom: 6%; left: 50%;
    transform: translateX(-50%);
  }
  .dpad-arr-left {
    left: 6%; top: 50%;
    transform: translateY(-50%);
  }
  .dpad-arr-right {
    right: 6%; top: 50%;
    transform: translateY(-50%);
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

  .pad-center-logo {
    width: 28px;
    height: 28px;
    object-fit: contain;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
  }

  .pad-logo {
    font-family: "Courier New", monospace;
    font-size: clamp(9px, 2.5vmin, 13px);
    font-weight: 800;
    letter-spacing: 0.3em;
    color: ${C.white};
    text-shadow: 0 1px 0 rgba(0,0,0,0.4);
    text-transform: uppercase;
  }

  .pad-sys-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  /* System buttons — small rounded rectangle */
  .sys-btn {
    height: 30px;
    min-width: 110px;
    padding: 0 18px;
    border-radius: 8px;
    font-family: "Courier New", monospace;
    font-size: clamp(8px, 2vmin, 11px);
    font-weight: 800;
    letter-spacing: 0.12em;
    color: ${C.white};
    background: linear-gradient(180deg, #444466, #333350);
    border: 2px solid #28283e;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    box-shadow:
      0 3px 0 #1a1a2e,
      0 5px 8px rgba(0,0,0,0.3),
      inset 0 1px 0 rgba(255,255,255,0.1);
    touch-action: manipulation;
  }
  .sys-btn:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #1a1a2e;
    background: #28283e;
  }

  .pad-indicators {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pad-player {
    font-family: "Courier New", monospace;
    font-size: 13px;
    font-weight: 800;
    color: ${C.btnYellow};
    letter-spacing: 0.1em;
    text-shadow: 0 1px 0 rgba(0,0,0,0.3);
  }
  .pad-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1.5px solid rgba(0,0,0,0.2);
  }

  /* ── Right section (A / B / X / Y) ── */
  .pad-right {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  /* SNES-style triangle: Y on top, B-A in bottom row */
  .abxy-diamond {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(4px, 1.5vmin, 8px);
  }

  .abxy-mid {
    display: flex;
    gap: clamp(2px, 1vmin, 6px);
    align-items: center;
  }

  /* Action buttons — chunky 3D circles */
  .action-btn {
    width: clamp(68px, 20vmin, 100px);
    height: clamp(68px, 20vmin, 100px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Courier New", monospace;
    font-size: clamp(15px, 4.5vmin, 24px);
    font-weight: 900;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    border: 3px solid;
    touch-action: manipulation;
  }

  .btn-a {
    color: ${C.white};
    background: linear-gradient(145deg, ${C.btnPink}, ${C.btnPinkDark});
    border-color: ${C.btnPinkDark};
    box-shadow:
      0 4px 0 ${C.btnPinkDark},
      0 6px 12px rgba(0,0,0,0.35),
      inset 0 2px 0 rgba(255,255,255,0.15);
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .btn-a:active {
    transform: translateY(3px);
    box-shadow:
      0 1px 0 ${C.btnPinkDark},
      inset 0 2px 6px rgba(0,0,0,0.3);
  }

  .btn-b {
    color: ${C.white};
    background: linear-gradient(145deg, ${C.btnYellow}, ${C.btnYellowDark});
    border-color: ${C.btnYellowDark};
    box-shadow:
      0 4px 0 ${C.btnYellowDark},
      0 6px 12px rgba(0,0,0,0.35),
      inset 0 2px 0 rgba(255,255,255,0.2);
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .btn-b:active {
    transform: translateY(3px);
    box-shadow:
      0 1px 0 ${C.btnYellowDark},
      inset 0 2px 6px rgba(0,0,0,0.3);
  }

  /* Y — verde (like SNES) */
  .btn-y {
    color: ${C.white};
    background: linear-gradient(145deg, #44cc66, #28884a);
    border-color: #28884a;
    box-shadow:
      0 4px 0 #28884a,
      0 6px 12px rgba(0,0,0,0.35),
      inset 0 2px 0 rgba(255,255,255,0.18);
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .btn-y:active {
    transform: translateY(3px);
    box-shadow:
      0 1px 0 #28884a,
      inset 0 2px 6px rgba(0,0,0,0.3);
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
    color: rgba(255,255,255,0.25);
    z-index: 10;
  }

  /* ── Portrait fallback ── */
  @media (orientation: portrait) {
    .pad-root {
      transform: rotate(90deg);
      transform-origin: center center;
      width: 100dvh;
      height: 100dvw;
    }
  }
`;
