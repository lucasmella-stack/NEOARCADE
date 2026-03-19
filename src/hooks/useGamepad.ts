"use client";

import { getSocket } from "@/lib/socket";
import type { Button, InputState } from "@/types/gamepad";
import { useCallback } from "react";

export function useGamepad() {
  const sendInput = useCallback((button: Button, state: InputState) => {
    const socket = getSocket();
    if (!socket.connected) return;

    socket.emit("input", {
      type: "input",
      button,
      state,
    });
  }, []);

  const press = useCallback(
    (button: Button) => sendInput(button, "pressed"),
    [sendInput]
  );

  const release = useCallback(
    (button: Button) => sendInput(button, "released"),
    [sendInput]
  );

  return { press, release };
}
