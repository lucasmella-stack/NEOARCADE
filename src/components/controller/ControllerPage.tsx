"use client";

import { ControlButton } from "@/components/controller/ControlButton";
import { DpadController } from "@/components/controller/DpadController";
import { C, padStyles } from "@/components/controller/controllerStyles";
import { useGamepad } from "@/hooks/useGamepad";
import { t } from "@/lib/i18n";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/game.store";
import { useLangStore } from "@/store/lang.store";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

  const [isFullscreen, setIsFullscreen] = useState(false);
  const { lang } = useLangStore();

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

  const { press, release } = useGamepad();

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
        <p style={{ fontSize: 13, color: "#556" }}>{t[lang].noRoom}</p>
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
          {t[lang].expand}
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
        {isConnected ? t[lang].connected : t[lang].connecting}
      </div>

      <style>{padStyles}</style>
    </div>
  );
}
