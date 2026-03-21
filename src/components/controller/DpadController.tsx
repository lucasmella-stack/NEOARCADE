"use client";

import type { Button } from "@/types/gamepad";
import { useCallback, useRef } from "react";

// ─── DpadArrow ────────────────────────────────────────────────────────────────

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

// ─── DpadController ───────────────────────────────────────────────────────────

interface Props {
  onPress: (btn: Button) => void;
  onRelease: (btn: Button) => void;
}

export function DpadController({ onPress, onRelease }: Props) {
  const dpadRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Set<string>>(new Set());

  const getDirections = useCallback(
    (touch: { clientX: number; clientY: number }): Set<string> => {
      const el = dpadRef.current;
      if (!el) return new Set();
      const rect = el.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / rect.width - 0.5;
      const y = (touch.clientY - rect.top) / rect.height - 0.5;
      const deadzone = 0.08;
      const dirs = new Set<string>();

      // In portrait mode the CSS applies rotate(90deg) to .pad-root, which
      // rotates the layout 90° CW visually, but getBoundingClientRect() returns
      // coords in screen (unrotated) space. We must invert the rotation so that
      // touching the visual "up" arrow actually maps to logical "up".
      // Inverse of rotate(90°CW): logical_dx = screen_dy, logical_dy = -screen_dx
      if (window.matchMedia("(orientation: portrait)").matches) {
        if (x > deadzone) dirs.add("up"); // screen right  → logical up
        if (x < -deadzone) dirs.add("down"); // screen left   → logical down
        if (y < -deadzone) dirs.add("left"); // screen top    → logical left
        if (y > deadzone) dirs.add("right"); // screen bottom → logical right
      } else {
        if (y < -deadzone) dirs.add("up");
        if (y > deadzone) dirs.add("down");
        if (x < -deadzone) dirs.add("left");
        if (x > deadzone) dirs.add("right");
      }
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
