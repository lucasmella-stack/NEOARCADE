"use client";

import { NEON_BTN } from "@/components/layout/layoutStyles";
import { KofiWidget } from "@/components/shared/KofiWidget";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import Image from "next/image";

interface Props {
  lang: Lang;
  onToggleLang: () => void;
  showPanel: boolean;
  onTogglePanel: () => void;
  onOpenInstructions: () => void;
}

export function TopBar({
  lang,
  onToggleLang,
  showPanel,
  onTogglePanel,
  onOpenInstructions,
}: Props) {
  return (
    <header
      className="relative z-20 flex items-center gap-3 px-4 shrink-0"
      style={{
        height: 52,
        background: "linear-gradient(180deg, #0a1a5c 0%, #011246 100%)",
        borderBottom: "3px solid #024DD6",
        boxShadow:
          "0 4px 0 #010224, 0 6px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(88,250,253,0.1)",
      }}
    >
      <Image
        src="/logo.webp"
        alt="NEOARCADE"
        width={32}
        height={32}
        className="shrink-0"
      />
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

      {/* Portal target for game-specific controls */}
      <div id="topbar-controls" className="flex items-center gap-2" />

      <div className="flex-1" />

      <button
        onClick={onToggleLang}
        className="h-9 px-3 rounded-lg text-xs font-bold tracking-wider uppercase cursor-pointer transition-all hover:brightness-125 active:scale-95 shrink-0"
        style={NEON_BTN}
      >
        {lang === "es" ? "EN" : "ES"}
      </button>

      <KofiWidget />

      <button
        onClick={onOpenInstructions}
        className="h-9 px-4 rounded-lg text-xs font-bold tracking-wider uppercase cursor-pointer transition-all flex items-center gap-2 hover:brightness-125 active:scale-95 hidden sm:flex"
        style={{ ...NEON_BTN, textShadow: "0 0 6px #20E9FB80" }}
      >
        {t[lang].instructions}
      </button>

      <button
        onClick={onTogglePanel}
        className="h-9 px-4 rounded-lg text-xs font-bold tracking-wider uppercase cursor-pointer transition-all flex items-center gap-2"
        style={{
          ...NEON_BTN,
          background: showPanel
            ? "linear-gradient(180deg, #024DD6, #011246)"
            : NEON_BTN.background,
          boxShadow: showPanel
            ? "0 0 14px rgba(88,250,253,0.4), 0 3px 0 #010224, inset 0 1px 0 rgba(88,250,253,0.15)"
            : "0 3px 0 #010224, inset 0 1px 0 rgba(88,250,253,0.1)",
          textShadow: "0 0 6px #20E9FB80",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6m0 2a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2z" />
          <path d="M6 12h4m-2 -2v4" />
          <path d="M15 11l0 .01" />
          <path d="M18 13l0 .01" />
        </svg>
        JOYSTICK
      </button>
    </header>
  );
}
