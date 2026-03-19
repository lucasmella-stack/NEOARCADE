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
      style={{ backgroundColor: "#010224" }}
    >
      {/* ── TopBar — 3D retro style ── */}
      <header
        className="relative z-20 flex items-center gap-3 px-4 shrink-0"
        style={{
          height: 52,
          background: "linear-gradient(180deg, #0a1a5c 0%, #011246 100%)",
          borderBottom: "3px solid #024DD6",
          boxShadow: "0 4px 0 #010224, 0 6px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(88,250,253,0.1)",
        }}
      >
        {/* Logo */}
        <Image src="/logo.webp" alt="NEOARCADE" width={32} height={32} className="shrink-0" />
        <span
          className="text-sm font-bold tracking-[0.25em] uppercase select-none hidden sm:block"
          style={{
            color: "#58FAFD",
            textShadow: "0 0 10px #20E9FB, 0 2px 0 #024DD6",
            fontFamily: '"Courier New", monospace',
          }}
        >
          NEOARCADE
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Botón abrir QR panel — gamepad icon */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="h-9 px-4 rounded-lg text-xs font-bold tracking-wider uppercase cursor-pointer transition-all flex items-center gap-2"
          style={{
            background: showPanel
              ? "linear-gradient(180deg, #024DD6, #011246)"
              : "linear-gradient(180deg, #0a1a5c, #011246)",
            color: "#58FAFD",
            border: "2px solid #024DD6",
            boxShadow: showPanel
              ? "0 0 14px rgba(88,250,253,0.4), 0 3px 0 #010224, inset 0 1px 0 rgba(88,250,253,0.15)"
              : "0 3px 0 #010224, inset 0 1px 0 rgba(88,250,253,0.1)",
            fontFamily: '"Courier New", monospace',
            textShadow: "0 0 6px #20E9FB80",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6m0 2a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2z" />
            <path d="M6 12h4m-2 -2v4" />
            <path d="M15 11l0 .01" />
            <path d="M18 13l0 .01" />
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
              "radial-gradient(ellipse 80% 60% at 50% 40%, #001a2e 0%, #010224 100%)",
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
              background: "linear-gradient(180deg, #0a1a5c, #011246)",
              borderLeft: "3px solid #024DD6",
              boxShadow: "-4px 0 30px rgba(0,0,0,0.6), inset 1px 0 0 rgba(88,250,253,0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{
                  color: "#58FAFD",
                  fontFamily: '"Courier New", monospace',
                  textShadow: "0 0 8px #20E9FB80",
                }}
              >
                CONECTAR
              </span>
              <button
                onClick={() => setShowPanel(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm cursor-pointer"
                style={{
                  color: "#58FAFD",
                  background: "linear-gradient(180deg, #0a1a5c, #011246)",
                  border: "2px solid #024DD6",
                  boxShadow: "0 2px 0 #010224",
                  fontFamily: '"Courier New", monospace',
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
