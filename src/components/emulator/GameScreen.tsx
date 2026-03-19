"use client";

import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/game.store";
import type { InputEvent, RoomUpdateEvent } from "@/types/gamepad";
import { useCallback, useEffect, useRef, useState } from "react";

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
  NES: "fceumm",
  SNES: "snes9x",
  NeoGeo: "fbneo",
  Arcade: "fbneo",
  GBA: "mgba",
  Genesis: "genesis_plus_gx",
} as const;

type CoreKey = keyof typeof CORES;

// Mapeo de botones NEOARCADE → índice EmulatorJS gamepad
const BUTTON_INDEX: Record<string, number> = {
  b: 0,
  a: 1,
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

export function GameScreen() {
  const emulatorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { setRoomId, setConnectedPlayers, setConnected } = useGameStore();
  const [mode, setMode] = useState<ScreenMode>({ type: "menu" });
  const [selectedCore, setSelectedCore] = useState<CoreKey>("NES");
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
    // Limpiar EmulatorJS si estaba activo
    cleanupEmulator();
    setMode({ type: "jsgame", game });
  };

  const handleRomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            sandbox="allow-scripts allow-same-origin"
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

      {/* ── Game controls bar — overlaid at bottom ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center gap-2 px-3 z-20"
        style={{
          height: 42,
          background: "linear-gradient(to top, rgba(1,2,36,0.95), rgba(1,2,36,0.7))",
        }}
      >
        {/* Botón volver al menú (visible cuando hay un juego activo) */}
        {mode.type !== "menu" && (
          <button
            onClick={handleBackToMenu}
            className="h-9 px-4 rounded text-xs font-bold tracking-wider uppercase cursor-pointer transition-all"
            style={{
              backgroundColor:
                "color-mix(in srgb, #ff3366 10%, var(--bg-card))",
              color: "#ff3366",
              border: "1px solid color-mix(in srgb, #ff3366 30%, transparent)",
            }}
          >
            ← MENU
          </button>
        )}

        {/* Nombre del juego activo */}
        {mode.type === "jsgame" && (
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: mode.game.color }}
          >
            ▶ {mode.game.name}
          </span>
        )}

        {/* Separador visual */}
        {mode.type === "menu" && (
          <span
            className="text-xs tracking-wider uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            O CARGA TU PROPIA ROM →
          </span>
        )}

        {/* Selector de sistema (para ROM) */}
        <select
          value={selectedCore}
          onChange={(e) => setSelectedCore(e.target.value as CoreKey)}
          disabled={mode.type !== "menu"}
          title="Sistema de emulación"
          className="h-9 px-3 rounded text-xs font-bold tracking-wider uppercase outline-none cursor-pointer disabled:opacity-40"
          style={{
            backgroundColor: "var(--bg-card)",
            color: "var(--neon-primary)",
            border:
              "1px solid color-mix(in srgb, var(--neon-primary) 30%, transparent)",
          }}
        >
          {Object.keys(CORES).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>

        {/* Botón subir ROM */}
        <label
          className="h-9 px-4 rounded flex items-center gap-2 text-xs font-bold tracking-wider uppercase cursor-pointer transition-all"
          style={{
            backgroundColor:
              mode.type === "emulator"
                ? "color-mix(in srgb, var(--neon-primary) 10%, var(--bg-card))"
                : "color-mix(in srgb, var(--neon-primary) 15%, var(--bg-card))",
            color: "var(--neon-primary)",
            border:
              "1px solid color-mix(in srgb, var(--neon-primary) 40%, transparent)",
            boxShadow:
              "0 0 10px color-mix(in srgb, var(--neon-primary) 15%, transparent)",
          }}
        >
          <span>
            {mode.type === "emulator" ? "✓ ROM CARGADA" : "▲ CARGAR ROM"}
          </span>
          <input
            type="file"
            accept=".zip,.7z,.nes,.smc,.sfc,.gba,.bin,.rom,.md"
            onChange={handleRomUpload}
            className="hidden"
            disabled={mode.type === "emulator"}
          />
        </label>
      </div>
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
  win.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
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
  script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
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
