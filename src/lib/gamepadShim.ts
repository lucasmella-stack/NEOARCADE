import type { InputEvent } from "@/types/gamepad";

export interface VirtualGamepadState {
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
  connected: boolean;
  id: string;
  index: number;
  mapping: string;
  timestamp: number;
}

const BUTTON_INDEX: Record<string, number> = {
  b: 0,
  a: 1,
  x: 2,
  y: 3,
  select: 8,
  start: 9,
};

const DPAD_AXIS: Record<string, [number, number]> = {
  left: [0, -1],
  right: [0, 1],
  up: [1, -1],
  down: [1, 1],
};

const DPAD_BTN: Record<string, number> = {
  up: 12,
  down: 13,
  left: 14,
  right: 15,
};

export function createEmptyGamepad(): VirtualGamepadState {
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

export function installGamepadShim(gamepads: VirtualGamepadState[]) {
  gamepads[0].index = 0;
  gamepads[1].index = 1;

  const originalGetGamepads = navigator.getGamepads.bind(navigator);

  Object.defineProperty(navigator, "getGamepads", {
    value: () => {
      const real = originalGetGamepads() ?? [];
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

  // EmulatorJS detects gamepads via polling — no GamepadEvent constructor needed
  window.dispatchEvent(new Event("gamepadconnected"));
}

export function handleRemoteInput(
  event: InputEvent,
  gamepads: VirtualGamepadState[],
) {
  const playerIdx = (event.player ?? 1) - 1;
  const pad = gamepads[playerIdx];
  if (!pad) return;

  const isPressed = event.state === "pressed";

  if (event.button in BUTTON_INDEX) {
    const idx = BUTTON_INDEX[event.button];
    pad.buttons[idx] = { pressed: isPressed, value: isPressed ? 1 : 0 };
  }

  if (event.button in DPAD_AXIS) {
    const [axisIdx, dir] = DPAD_AXIS[event.button];
    if (isPressed) {
      pad.axes[axisIdx] = dir;
    } else if (pad.axes[axisIdx] === dir) {
      pad.axes[axisIdx] = 0;
    }
  }

  // Some EmulatorJS cores also poll D-pad as buttons (indices 12-15)
  if (event.button in DPAD_BTN) {
    const idx = DPAD_BTN[event.button];
    pad.buttons[idx] = { pressed: isPressed, value: isPressed ? 1 : 0 };
  }

  pad.timestamp = performance.now();
}
