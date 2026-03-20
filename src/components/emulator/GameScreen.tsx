"use client";

import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/game.store";
import type { InputEvent, RoomUpdateEvent } from "@/types/gamepad";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Catálogo de juegos JS integrados ─────────────────────────────────────────

interface ArcadeGame {
  id: string;
  name: string;
  description: string;
  src: string; // ruta en /games/
  players: string; // "1P" | "1-2P"
  color: string; // color neon del card
  icon: string; // emoji
}

const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: "slug",
    name: "METAL SLUG (NeoGeo)",
    description:
      "Carga tu ROM de Metal Slug. Emulado con FinalBurn Neo. 1-2P co-op.",
    src: "/games/slug/index.html",
    players: "1-2P",
    color: "#ff9900",
    icon: "🔫",
  },
  {
    id: "sidekicks",
    name: "SUPER SIDEKICKS (NeoGeo)",
    description: "Fútbol arcade NeoGeo. 2 jugadores simultáneos.",
    src: "/games/sidekicks/index.html",
    players: "1-2P",
    color: "#44ff88",
    icon: "⚽",
  },
  {
    id: "mario",
    name: "MARIO",
    description: "Plataformas clásico con salto, carrera y tuberías.",
    src: "/games/mario/index.html",
    players: "1P",
    color: "#ff5c5c",
    icon: "🍄",
  },
  {
    id: "pacman",
    name: "PACMAN",
    description: "Come puntos, esquiva fantasmas y limpia el laberinto.",
    src: "/games/pacman.html",
    players: "1P",
    color: "#ffe45c",
    icon: "🟡",
  },
  {
    id: "pong",
    name: "PONG",
    description: "El clásico. 2 jugadores con joysticks móviles.",
    src: "/games/pong.html",
    players: "1-2P",
    color: "#58FAFD",
    icon: "🏓",
  },
  {
    id: "snake",
    name: "SNAKE",
    description: "Come, crece, no te muerdas la cola.",
    src: "/games/snake.html",
    players: "1P",
    color: "#44ff88",
    icon: "🐍",
  },
  {
    id: "breakout",
    name: "BREAKOUT",
    description: "Rompe todos los bloques con la bola.",
    src: "/games/breakout.html",
    players: "1P",
    color: "#c080ff",
    icon: "🧱",
  },
  {
    id: "invaders",
    name: "SPACE INVADERS",
    description: "Defiende la tierra de oleadas alienígenas.",
    src: "/games/invaders.html",
    players: "1P",
    color: "#ff4466",
    icon: "👾",
  },
];

// ─── EmulatorJS cores (para ROM upload) ───────────────────────────────────────

const CORES = {
  GB: "gambatte",
  GBC: "gambatte",
  NES: "fceumm",
  SNES: "snes9x",
  NeoGeo: "fbneo",
  Arcade: "fbneo",
  GBA: "mgba",
  N64: "mupen64plus_next",
  Genesis: "genesis_plus_gx",
} as const;

type CoreKey = keyof typeof CORES;

// Mapeo de botones NEOARCADE → índice EmulatorJS gamepad
const BUTTON_INDEX: Record<string, number> = {
  b: 0,
  a: 1,
  y: 2,
  select: 8,
  start: 9,
};

// D-pad a ejes con [axisIndex, value]
const DPAD_AXIS: Record<string, [number, number]> = {
  left: [0, -1],
  right: [0, 1],
  up: [1, -1],
  down: [1, 1],
};

// ─── Tipo de modo activo ──────────────────────────────────────────────────────

type ScreenMode =
  | { type: "menu" }
  | { type: "jsgame"; game: ArcadeGame }
  | { type: "emulator" };

interface SoundStep {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume?: number;
  slideTo?: number;
  delay?: number;
}

const SOUND_LIBRARY: Record<string, SoundStep[]> = {
  "ui-start": [
    { frequency: 440, duration: 0.07, type: "square", volume: 0.03 },
    {
      frequency: 660,
      duration: 0.09,
      type: "square",
      volume: 0.028,
      delay: 0.05,
    },
  ],
  "snake-eat": [
    { frequency: 760, duration: 0.05, type: "square", volume: 0.028 },
    {
      frequency: 980,
      duration: 0.08,
      type: "square",
      volume: 0.026,
      delay: 0.04,
    },
  ],
  "snake-dead": [
    {
      frequency: 260,
      duration: 0.2,
      type: "sawtooth",
      volume: 0.03,
      slideTo: 140,
    },
  ],
  "pong-hit": [
    { frequency: 620, duration: 0.05, type: "square", volume: 0.025 },
  ],
  "pong-score": [
    { frequency: 300, duration: 0.08, type: "triangle", volume: 0.028 },
    {
      frequency: 520,
      duration: 0.12,
      type: "triangle",
      volume: 0.024,
      delay: 0.06,
    },
  ],
  "pong-win": [
    { frequency: 520, duration: 0.08, type: "square", volume: 0.028 },
    {
      frequency: 780,
      duration: 0.1,
      type: "square",
      volume: 0.026,
      delay: 0.06,
    },
    {
      frequency: 1040,
      duration: 0.14,
      type: "square",
      volume: 0.024,
      delay: 0.14,
    },
  ],
  "breakout-launch": [
    {
      frequency: 520,
      duration: 0.06,
      type: "square",
      volume: 0.025,
      slideTo: 700,
    },
  ],
  "breakout-paddle": [
    { frequency: 420, duration: 0.05, type: "triangle", volume: 0.023 },
  ],
  "breakout-brick": [
    { frequency: 760, duration: 0.04, type: "square", volume: 0.022 },
  ],
  "breakout-life": [
    {
      frequency: 260,
      duration: 0.15,
      type: "sawtooth",
      volume: 0.028,
      slideTo: 180,
    },
  ],
  "breakout-level": [
    { frequency: 660, duration: 0.07, type: "triangle", volume: 0.024 },
    {
      frequency: 880,
      duration: 0.08,
      type: "triangle",
      volume: 0.024,
      delay: 0.05,
    },
    {
      frequency: 1180,
      duration: 0.1,
      type: "triangle",
      volume: 0.022,
      delay: 0.11,
    },
  ],
  "breakout-gameover": [
    {
      frequency: 220,
      duration: 0.22,
      type: "sawtooth",
      volume: 0.03,
      slideTo: 130,
    },
  ],
  "invaders-shoot": [
    {
      frequency: 460,
      duration: 0.05,
      type: "square",
      volume: 0.02,
      slideTo: 560,
    },
  ],
  "invaders-hit": [
    { frequency: 920, duration: 0.05, type: "square", volume: 0.022 },
  ],
  "invaders-player-hit": [
    {
      frequency: 180,
      duration: 0.18,
      type: "sawtooth",
      volume: 0.03,
      slideTo: 110,
    },
  ],
  "invaders-level": [
    { frequency: 560, duration: 0.06, type: "square", volume: 0.024 },
    {
      frequency: 760,
      duration: 0.08,
      type: "square",
      volume: 0.024,
      delay: 0.05,
    },
    {
      frequency: 980,
      duration: 0.1,
      type: "square",
      volume: 0.022,
      delay: 0.11,
    },
  ],
  "invaders-gameover": [
    {
      frequency: 200,
      duration: 0.2,
      type: "sawtooth",
      volume: 0.03,
      slideTo: 120,
    },
  ],
};

type SoundName = keyof typeof SOUND_LIBRARY;

interface AudioEngine {
  unlock: () => void;
  play: (sound: SoundName) => void;
}

function createAudioEngine(): AudioEngine {
  let audioContext: AudioContext | null = null;

  const getContext = () => {
    if (audioContext) return audioContext;
    const audioWindow = window as Window &
      typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      };
    const AudioContextCtor =
      audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContext = new AudioContextCtor();
    return audioContext;
  };

  return {
    unlock: () => {
      const context = getContext();
      if (context?.state === "suspended") {
        void context.resume();
      }
    },
    play: (sound) => {
      const context = getContext();
      if (!context) return;
      if (context.state === "suspended") {
        void context.resume();
      }

      const steps = SOUND_LIBRARY[sound];
      const baseTime = context.currentTime;

      steps.forEach((step) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const startTime = baseTime + (step.delay ?? 0);
        const endFrequency = step.slideTo ?? step.frequency;
        const volume = step.volume ?? 0.025;

        oscillator.type = step.type;
        oscillator.frequency.setValueAtTime(step.frequency, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(60, endFrequency),
          startTime + step.duration,
        );

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          startTime + step.duration,
        );

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + step.duration + 0.02);
      });
    },
  };
}

export function GameScreen() {
  const emulatorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const { setRoomId, setConnectedPlayers, setConnected } = useGameStore();
  const [mode, setMode] = useState<ScreenMode>({ type: "menu" });
  const [selectedCore, setSelectedCore] = useState<CoreKey>("NES");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

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
      if (!(payload.sound in SOUND_LIBRARY)) return;
      audioEngineRef.current?.play(payload.sound as SoundName);
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

        {/* Menú de selección de juegos */}
        {mode.type === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-lg px-4 py-6 select-none">
              <p
                className="text-2xl tracking-widest uppercase text-center glow-text-primary mb-1"
                style={{ color: "var(--neon-primary)", opacity: 0.9 }}
              >
                SELECT GAME
              </p>
              <p
                className="text-xs tracking-wider text-center mb-5"
                style={{ color: "var(--text-muted)" }}
              >
                Juegos gratuitos integrados · También puedes cargar tu ROM
              </p>

              {/* Grid de juegos */}
              <div className="grid grid-cols-2 gap-3">
                {ARCADE_GAMES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handlePlayGame(game)}
                    className="group relative rounded-lg p-3 text-left transition-all hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, " + game.color + " 8%, #0a0a0f)",
                      border:
                        "1px solid color-mix(in srgb, " +
                        game.color +
                        " 30%, transparent)",
                    }}
                  >
                    <span className="text-2xl block mb-1">{game.icon}</span>
                    <span
                      className="text-sm font-bold tracking-wider block"
                      style={{ color: game.color }}
                    >
                      {game.name}
                    </span>
                    <span
                      className="text-[10px] tracking-wide block mt-0.5 leading-tight"
                      style={{ color: "#888" }}
                    >
                      {game.description}
                    </span>
                    <span
                      className="absolute top-2 right-2 text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                      style={{
                        color: game.color,
                        backgroundColor:
                          "color-mix(in srgb, " +
                          game.color +
                          " 15%, transparent)",
                      }}
                    >
                      {game.players}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
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
                ← MENU
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
                <option key={key} value={key}>
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
              <span>{mode.type === "emulator" ? "✓ ROM" : "▲ CARGAR ROM"}</span>
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

// ─── EmulatorJS Loader ────────────────────────────────────────────────────────

function loadEmulator(
  container: HTMLElement,
  romUrl: string,
  core: string,
  fileName: string,
) {
  // Eliminar script anterior de EmulatorJS si existe
  const oldScript = document.querySelector("script[data-emulatorjs]");
  if (oldScript) oldScript.remove();

  // Limpiar container
  container.innerHTML = "";

  const win = window as unknown as Record<string, unknown>;

  // Configurar variables globales que EmulatorJS espera
  win.EJS_player = "#emulator";
  win.EJS_gameUrl = romUrl;
  win.EJS_core = core;
  win.EJS_pathtodata =
    "https://cdn.jsdelivr.net/npm/@emulatorjs/emulatorjs@4.0.9/data/";
  win.EJS_startOnLoaded = true;
  win.EJS_DEBUG_XX = false;
  win.EJS_gameName = fileName.replace(/\.\w+$/, "");
  win.EJS_color = "#00d4ff";
  win.EJS_backgroundBlur = true;
  win.EJS_backgroundColor = "#0a0a0f";
  // Permitir controles por defecto (teclado) además del shim de gamepad
  win.EJS_defaultControls = true;
  // No requerir que esté conectado un segundo jugador
  win.EJS_multitap = false;
  // Inputs de teclado para jugador 1 (fallback local, funciona sin móvil)
  win.EJS_Buttons = [
    { value: "ArrowUp", player: 1, button: "up" },
    { value: "ArrowDown", player: 1, button: "down" },
    { value: "ArrowLeft", player: 1, button: "left" },
    { value: "ArrowRight", player: 1, button: "right" },
    { value: "KeyZ", player: 1, button: "b", input: "button" },
    { value: "KeyX", player: 1, button: "a", input: "button" },
    { value: "Enter", player: 1, button: "start", input: "button" },
    { value: "ShiftRight", player: 1, button: "select", input: "button" },
  ];

  // Cargar EmulatorJS desde CDN
  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/@emulatorjs/emulatorjs@4.0.9/data/loader.js";
  script.async = true;
  script.setAttribute("data-emulatorjs", "1");
  document.body.appendChild(script);
}

// ─── Virtual Gamepad Shim ─────────────────────────────────────────────────────

interface VirtualGamepadState {
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
  connected: boolean;
  id: string;
  index: number;
  mapping: string;
  timestamp: number;
}

function createEmptyGamepad(): VirtualGamepadState {
  return {
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    axes: [0, 0, 0, 0],
    connected: true,
    id: "NEOARCADE Virtual Gamepad",
    index: 0,
    mapping: "standard",
    timestamp: performance.now(),
  };
}

function installGamepadShim(gamepads: VirtualGamepadState[]) {
  // Asignar índices
  gamepads[0].index = 0;
  gamepads[1].index = 1;

  // Parchear navigator.getGamepads para EmulatorJS
  const originalGetGamepads = navigator.getGamepads.bind(navigator);

  Object.defineProperty(navigator, "getGamepads", {
    value: () => {
      const real = originalGetGamepads() ?? [];
      // Mezclar: los virtual gamepads tienen prioridad en slots 0 y 1
      const result: (Gamepad | VirtualGamepadState | null)[] = [
        gamepads[0],
        gamepads[1],
        real[2] ?? null,
        real[3] ?? null,
      ];
      return result;
    },
    configurable: true,
  });

  // Disparar evento genérico — EmulatorJS detecta gamepads via polling de getGamepads()
  // No usamos GamepadEvent porque requiere un Gamepad nativo del browser
  window.dispatchEvent(new Event("gamepadconnected"));
}

function handleRemoteInput(event: InputEvent, gamepads: VirtualGamepadState[]) {
  const playerIdx = (event.player ?? 1) - 1;
  const pad = gamepads[playerIdx];
  if (!pad) return;

  const isPressed = event.state === "pressed";

  // Botones directos (A, B, Start, Select)
  if (event.button in BUTTON_INDEX) {
    const idx = BUTTON_INDEX[event.button];
    pad.buttons[idx] = { pressed: isPressed, value: isPressed ? 1 : 0 };
  }

  // D-pad como ejes
  if (event.button in DPAD_AXIS) {
    const [axisIdx, dir] = DPAD_AXIS[event.button];
    if (isPressed) {
      pad.axes[axisIdx] = dir;
    } else {
      // Solo resetear si todavía apunta en la misma dirección
      if (pad.axes[axisIdx] === dir) {
        pad.axes[axisIdx] = 0;
      }
    }
  }

  // También marcar D-pad como botones (EmulatorJS los checkea así en algunos cores)
  const DPAD_BTN: Record<string, number> = {
    up: 12,
    down: 13,
    left: 14,
    right: 15,
  };
  if (event.button in DPAD_BTN) {
    const idx = DPAD_BTN[event.button];
    pad.buttons[idx] = { pressed: isPressed, value: isPressed ? 1 : 0 };
  }

  pad.timestamp = performance.now();
}
