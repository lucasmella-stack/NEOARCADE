"use client";

import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/game.store";
import type { InputEvent, RoomUpdateEvent } from "@/types/gamepad";
import { useEffect, useRef, useState } from "react";

// EmulatorJS cores disponibles
const CORES = {
  NeoGeo: "fbneo",
  Arcade: "fbneo",
  SNES: "snes9x",
  NES: "fceumm",
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

export function GameScreen() {
  const emulatorRef = useRef<HTMLDivElement>(null);
  const { setRoomId, setConnectedPlayers, setConnected } = useGameStore();
  const [romLoaded, setRomLoaded] = useState(false);
  const [selectedCore, setSelectedCore] = useState<CoreKey>("NeoGeo");
  const virtualGamepadsRef = useRef<VirtualGamepadState[]>([
    createEmptyGamepad(),
    createEmptyGamepad(),
  ]);

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
      handleRemoteInput(event, virtualGamepadsRef.current);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-update");
      socket.off("input");
      socket.disconnect();
    };
  }, [setRoomId, setConnectedPlayers, setConnected]);

  // Instalar gamepad interceptor para EmulatorJS
  useEffect(() => {
    installGamepadShim(virtualGamepadsRef.current);
  }, []);

  const handleRomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !emulatorRef.current) return;

    const url = URL.createObjectURL(file);
    loadEmulator(emulatorRef.current, url, CORES[selectedCore], file.name);
    setRomLoaded(true);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Pantalla del emulador */}
      <div
        className="relative rounded-lg overflow-hidden scanlines"
        style={{
          border: "1px solid color-mix(in srgb, var(--neon-primary) 30%, transparent)",
          boxShadow:
            "0 0 30px color-mix(in srgb, var(--neon-primary) 15%, transparent), inset 0 0 60px rgba(0,0,0,0.5)",
          aspectRatio: "4/3",
          backgroundColor: "#000",
        }}
      >
        <div
          ref={emulatorRef}
          id="emulator"
          className="w-full h-full"
          style={{ display: romLoaded ? "block" : "none" }}
        />

        {/* Placeholder cuando no hay ROM */}
        {!romLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center select-none">
              <p
                className="text-2xl tracking-widest uppercase glow-text-primary"
                style={{ color: "var(--neon-primary)", opacity: 0.8 }}
              >
                INSERT COIN
              </p>
              <p
                className="text-sm mt-3 tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Sube una ROM para comenzar a jugar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controles: selector de core + upload ROM */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Selector de sistema */}
        <select
          value={selectedCore}
          onChange={(e) => setSelectedCore(e.target.value as CoreKey)}
          disabled={romLoaded}
          className="h-9 px-3 rounded text-xs font-bold tracking-wider uppercase outline-none cursor-pointer disabled:opacity-40"
          style={{
            backgroundColor: "var(--bg-card)",
            color: "var(--neon-primary)",
            border: "1px solid color-mix(in srgb, var(--neon-primary) 30%, transparent)",
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
            backgroundColor: romLoaded
              ? "color-mix(in srgb, var(--neon-primary) 10%, var(--bg-card))"
              : "color-mix(in srgb, var(--neon-primary) 15%, var(--bg-card))",
            color: "var(--neon-primary)",
            border: "1px solid color-mix(in srgb, var(--neon-primary) 40%, transparent)",
            boxShadow:
              "0 0 10px color-mix(in srgb, var(--neon-primary) 15%, transparent)",
          }}
        >
          <span>{romLoaded ? "✓ ROM CARGADA" : "▲ CARGAR ROM"}</span>
          <input
            type="file"
            accept=".zip,.7z,.nes,.smc,.sfc,.gba,.bin,.rom,.md"
            onChange={handleRomUpload}
            className="hidden"
            disabled={romLoaded}
          />
        </label>

        {romLoaded && (
          <button
            onClick={() => {
              setRomLoaded(false);
              // Limpiar EmulatorJS
              if (emulatorRef.current) {
                emulatorRef.current.innerHTML = "";
              }
              // Limpiar variables globales de EmulatorJS
              const win = window as unknown as Record<string, unknown>;
              delete win.EJS_player;
              delete win.EJS_gameUrl;
              delete win.EJS_core;
            }}
            className="h-9 px-4 rounded text-xs font-bold tracking-wider uppercase cursor-pointer"
            style={{
              backgroundColor: "color-mix(in srgb, #ff3366 10%, var(--bg-card))",
              color: "#ff3366",
              border: "1px solid color-mix(in srgb, #ff3366 30%, transparent)",
            }}
          >
            ✕ CAMBIAR ROM
          </button>
        )}
      </div>
    </div>
  );
}

// ─── EmulatorJS Loader ────────────────────────────────────────────────────────

function loadEmulator(container: HTMLElement, romUrl: string, core: string, fileName: string) {
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
  win.EJS_defaultControls = true;

  // Cargar EmulatorJS desde CDN
  const script = document.createElement("script");
  script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
  script.async = true;
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

  // Disparar gamepadconnected para que EmulatorJS detecte
  window.dispatchEvent(
    new GamepadEvent("gamepadconnected", {
      gamepad: gamepads[0] as unknown as Gamepad,
    })
  );
  window.dispatchEvent(
    new GamepadEvent("gamepadconnected", {
      gamepad: gamepads[1] as unknown as Gamepad,
    })
  );
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
  const DPAD_BTN: Record<string, number> = { up: 12, down: 13, left: 14, right: 15 };
  if (event.button in DPAD_BTN) {
    const idx = DPAD_BTN[event.button];
    pad.buttons[idx] = { pressed: isPressed, value: isPressed ? 1 : 0 };
  }

  pad.timestamp = performance.now();
}
