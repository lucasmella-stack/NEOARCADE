"use client";

import { GameMenu } from "@/components/emulator/GameMenu";
import type { ArcadeGame } from "@/data/games";
import {
  createAudioEngine,
  isKnownSound,
  type AudioEngine,
} from "@/lib/audioEngine";
import { CORES, loadEmulator, type CoreKey } from "@/lib/emulatorLoader";
import {
  createEmptyGamepad,
  handleRemoteInput,
  installGamepadShim,
  type VirtualGamepadState,
} from "@/lib/gamepadShim";
import { t } from "@/lib/i18n";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/game.store";
import { useLangStore } from "@/store/lang.store";
import type { InputEvent, RoomUpdateEvent } from "@/types/gamepad";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Screen mode ─────────────────────────────────────────────────────────────

type ScreenMode =
  | { type: "menu" }
  | { type: "jsgame"; game: ArcadeGame }
  | { type: "emulator" };

export function GameScreen() {
  const emulatorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const { setRoomId, setConnectedPlayers, setConnected } = useGameStore();
  const [mode, setMode] = useState<ScreenMode>({ type: "menu" });
  const [selectedCore, setSelectedCore] = useState<CoreKey>("NES");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const { lang } = useLangStore();

  if (!audioEngineRef.current && typeof window !== "undefined") {
    audioEngineRef.current = createAudioEngine();
  }

  // Find the TopBar portal target
  useEffect(() => {
    const el = document.getElementById("topbar-controls");
    setPortalTarget(el);
  }, []);

  useEffect(() => {
    const onWindowMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      const payload = event.data as { type?: string; sound?: string };
      if (payload.type !== "neoarcade-sfx" || !payload.sound) return;
      if (!isKnownSound(payload.sound)) return;
      audioEngineRef.current?.play(payload.sound);
    };

    window.addEventListener("message", onWindowMessage);
    return () => window.removeEventListener("message", onWindowMessage);
  }, []);
  const virtualGamepadsRef = useRef<VirtualGamepadState[]>([
    createEmptyGamepad(),
    createEmptyGamepad(),
  ]);

  // Enviar input al iframe del juego JS
  const sendInputToIframe = useCallback((event: InputEvent) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: "neoarcade-input",
        player: event.player ?? 1,
        button: event.button,
        state: event.state,
      },
      "*",
    );
  }, []);

  // Setup Socket.io
  useEffect(() => {
    let roomId = sessionStorage.getItem("neoarcade-room");
    if (!roomId) {
      roomId = crypto.randomUUID();
      sessionStorage.setItem("neoarcade-room", roomId);
    }
    setRoomId(roomId);

    const socket = getSocket();
    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-game-screen", roomId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("room-update", (data: RoomUpdateEvent) => {
      setConnectedPlayers(data.players);
    });

    socket.on("input", (event: InputEvent) => {
      // Enviar al juego JS embebido
      sendInputToIframe(event);
      // También al gamepad shim (para EmulatorJS)
      handleRemoteInput(event, virtualGamepadsRef.current);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-update");
      socket.off("input");
      socket.disconnect();
    };
  }, [setRoomId, setConnectedPlayers, setConnected, sendInputToIframe]);

  // Instalar gamepad interceptor para EmulatorJS
  useEffect(() => {
    installGamepadShim(virtualGamepadsRef.current);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handlePlayGame = (game: ArcadeGame) => {
    audioEngineRef.current?.unlock();
    // Limpiar EmulatorJS si estaba activo
    cleanupEmulator();
    setMode({ type: "jsgame", game });
  };

  const handleRomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    audioEngineRef.current?.unlock();
    const file = e.target.files?.[0];
    if (!file || !emulatorRef.current) return;

    const url = URL.createObjectURL(file);
    loadEmulator(emulatorRef.current, url, CORES[selectedCore], file.name);
    setMode({ type: "emulator" });
  };

  const handleBackToMenu = () => {
    cleanupEmulator();
    setMode({ type: "menu" });
  };

  const cleanupEmulator = () => {
    if (emulatorRef.current) {
      emulatorRef.current.innerHTML = "";
    }
    const win = window as unknown as Record<string, unknown>;
    delete win.EJS_player;
    delete win.EJS_gameUrl;
    delete win.EJS_core;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative h-full">
      {/* Pantalla principal — fills all available height */}
      <div
        className="relative rounded-lg overflow-hidden scanlines w-full h-full"
        style={{
          border:
            "2px solid color-mix(in srgb, var(--neon-primary) 30%, transparent)",
          boxShadow:
            "0 0 30px color-mix(in srgb, var(--neon-primary) 15%, transparent), inset 0 0 60px rgba(0,0,0,0.5), 0 4px 0 #000, 0 6px 12px rgba(0,0,0,0.5)",
          backgroundColor: "#000",
          borderRadius: 12,
        }}
      >
        {/* EmulatorJS container (siempre presente para ROM mode) */}
        <div
          ref={emulatorRef}
          id="emulator"
          className="w-full h-full"
          style={{ display: mode.type === "emulator" ? "block" : "none" }}
        />

        {/* Juego JS embebido en iframe */}
        {mode.type === "jsgame" && (
          <iframe
            ref={iframeRef}
            src={mode.game.src}
            title={mode.game.name}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-downloads allow-popups allow-forms"
          />
        )}

        {mode.type === "menu" && (
          <GameMenu onPlay={handlePlayGame} lang={lang} />
        )}
      </div>

      {/* ── Game controls — portaled into TopBar ── */}
      {portalTarget &&
        createPortal(
          <>
            {mode.type !== "menu" && (
              <button
                onClick={handleBackToMenu}
                className="h-7 px-3 rounded text-[10px] font-bold tracking-wider uppercase cursor-pointer shrink-0"
                style={{
                  background: "linear-gradient(180deg, #1a0a2e, #0a0520)",
                  color: "#ff3366",
                  border: "1.5px solid rgba(255,51,102,0.4)",
                  boxShadow: "0 2px 0 #050210",
                  fontFamily: '"Courier New", monospace',
                }}
              >
                {t[lang].backMenu}
              </button>
            )}

            {mode.type === "jsgame" && (
              <span
                className="text-[10px] font-bold tracking-widest uppercase shrink-0 hidden sm:block"
                style={{
                  color: mode.game.color,
                  fontFamily: '"Courier New", monospace',
                }}
              >
                ▶ {mode.game.name}
              </span>
            )}

            <select
              value={selectedCore}
              onChange={(e) => setSelectedCore(e.target.value as CoreKey)}
              disabled={mode.type !== "menu"}
              title="Sistema de emulación"
              className="h-7 px-2 rounded text-[10px] font-bold tracking-wider uppercase outline-none cursor-pointer disabled:opacity-40 shrink-0"
              style={{
                background: "linear-gradient(180deg, #0a1a5c, #011246)",
                color: "#58FAFD",
                border: "1.5px solid #024DD6",
                fontFamily: '"Courier New", monospace',
              }}
            >
              {Object.keys(CORES).map((key) => (
                <option
                  key={key}
                  value={key}
                  style={{ background: "#011246", color: "#58FAFD" }}
                >
                  {key}
                </option>
              ))}
            </select>

            <label
              className="h-7 px-3 rounded flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase cursor-pointer shrink-0"
              style={{
                background:
                  mode.type === "emulator"
                    ? "linear-gradient(180deg, #024DD6, #011246)"
                    : "linear-gradient(180deg, #0a1a5c, #011246)",
                color: "#58FAFD",
                border: "1.5px solid #024DD6",
                boxShadow: "0 2px 0 #010224",
                fontFamily: '"Courier New", monospace',
              }}
            >
              <span>
                {mode.type === "emulator" ? t[lang].romLoaded : t[lang].loadRom}
              </span>
              <input
                type="file"
                accept=".zip,.7z,.nes,.smc,.sfc,.gba,.gb,.gbc,.bin,.rom,.md,.n64,.z64,.v64"
                onChange={handleRomUpload}
                className="hidden"
                disabled={mode.type === "emulator"}
              />
            </label>
          </>,
          portalTarget,
        )}
    </div>
  );
}
