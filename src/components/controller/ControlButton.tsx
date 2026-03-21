"use client";

import type { Button } from "@/types/gamepad";
import { useCallback, useRef } from "react";

export interface ControlButtonProps {
  button: Button;
  label: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onPress: (btn: Button) => void;
  onRelease: (btn: Button) => void;
}

export function ControlButton({
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
