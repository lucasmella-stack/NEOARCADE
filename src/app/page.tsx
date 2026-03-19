"use client";

import { GameScreen } from "@/components/emulator/GameScreen";
import { Lobby } from "@/components/lobby/Lobby";
import Image from "next/image";
import { useState } from "react";

export default function GamePage() {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--bg-deep)" }}
    >
      {/* ── TopBar ── */}
      <header
        className="relative z-20 flex items-center gap-3 px-4 shrink-0"
        style={{
          height: 52,
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid color-mix(in srgb, var(--neon-primary) 20%, transparent)",
          boxShadow: "0 2px 20px color-mix(in srgb, var(--neon-primary) 10%, transparent)",
        }}
      >
        {/* Logo */}
        <Image src="/logo.webp" alt="NEOARCADE" width={32} height={32} className="shrink-0" />
        <span
          className="text-sm font-bold tracking-[0.25em] uppercase select-none hidden sm:block"
          style={{ color: "var(--neon-primary)", textShadow: "0 0 10px var(--neon-primary)" }}
        >
          NEOARCADE
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Botón abrir QR panel */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="h-8 px-4 rounded text-xs font-bold tracking-wider uppercase cursor-pointer transition-all flex items-center gap-2"
          style={{
            backgroundColor: showPanel
              ? "color-mix(in srgb, var(--neon-primary) 20%, var(--bg-card))"
              : "color-mix(in srgb, var(--neon-primary) 10%, var(--bg-card))",
            color: "var(--neon-primary)",
            border: "1px solid color-mix(in srgb, var(--neon-primary) 40%, transparent)",
            boxShadow: showPanel ? "0 0 12px color-mix(in srgb, var(--neon-primary) 30%, transparent)" : "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          JOYSTICK
        </button>
      </header>

      {/* ── Game area (takes all remaining space) ── */}
      <div className="relative flex-1 min-h-0">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, #001a2e 0%, var(--bg-deep) 100%)",
          }}
        />

        {/* GameScreen fills available space */}
        <div className="relative z-10 w-full h-full p-3">
          <GameScreen />
        </div>

        {/* ── Slide-out QR Panel (right side) ── */}
        <div
          className="absolute top-0 right-0 h-full z-30 transition-transform duration-300 ease-in-out"
          style={{
            width: 320,
            transform: showPanel ? "translateX(0)" : "translateX(100%)",
          }}
        >
          {/* Backdrop */}
          {showPanel && (
            <div
              className="fixed inset-0 z-[-1]"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              onClick={() => setShowPanel(false)}
            />
          )}
          {/* Panel content */}
          <div
            className="h-full overflow-y-auto p-4"
            style={{
              backgroundColor: "var(--bg-deep)",
              borderLeft: "1px solid color-mix(in srgb, var(--neon-primary) 20%, transparent)",
              boxShadow: "-4px 0 30px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "var(--neon-primary)" }}
              >
                CONECTAR
              </span>
              <button
                onClick={() => setShowPanel(false)}
                className="w-7 h-7 rounded flex items-center justify-center text-sm cursor-pointer"
                style={{
                  color: "var(--text-muted)",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid color-mix(in srgb, var(--text-muted) 20%, transparent)",
                }}
              >
                ✕
              </button>
            </div>
            <Lobby />
          </div>
        </div>
      </div>
    </main>
  );
}
