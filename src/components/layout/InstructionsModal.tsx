"use client";

import { NEON_BTN } from "@/components/layout/layoutStyles";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import Image from "next/image";

interface Props {
  show: boolean;
  onClose: () => void;
  lang: Lang;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold tracking-widest uppercase mt-2"
      style={{
        color: "#58FAFD",
        fontFamily: '"Courier New", monospace',
        textShadow: "0 0 8px #20E9FB",
        borderBottom: "1px solid rgba(0,212,255,0.25)",
        paddingBottom: 6,
      }}
    >
      {children}
    </p>
  );
}

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] tracking-wider uppercase mt-2 mb-1"
      style={{ color: "#4a7f9f", fontFamily: '"Courier New", monospace' }}
    >
      {children}
    </p>
  );
}

export function InstructionsModal({ show, onClose, lang }: Props) {
  if (!show) return null;

  const suffix = lang === "es" ? "ES" : "EN";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="relative rounded-xl p-6 max-w-lg w-[92vw] flex flex-col gap-4 max-h-[90vh]"
        style={{
          background: "linear-gradient(180deg, #0a1a5c 0%, #011246 100%)",
          border: "2px solid #024DD6",
          boxShadow: "0 0 40px rgba(0,212,255,0.2), 0 8px 32px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{
              color: "#58FAFD",
              fontFamily: '"Courier New", monospace',
              textShadow: "0 0 10px #20E9FB",
            }}
          >
            {t[lang].instructionsTitle}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm cursor-pointer"
            style={NEON_BTN}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex flex-col gap-3 pr-1">
          {/* ── ALL GAMES ─────────────────────────────── */}
          <SectionTitle>{t[lang].instrAllGames}</SectionTitle>
          <Image
            src={`/instructions/1-${suffix}-joystick.png`}
            alt={t[lang].instrAllGames}
            width={800}
            height={500}
            className="w-full rounded-lg"
            style={{ border: "1px solid rgba(0,212,255,0.2)" }}
          />

          {/* ── NEOGEO ────────────────────────────────── */}
          <SectionTitle>{t[lang].instrNeoGeo}</SectionTitle>
          <StepLabel>{t[lang].instrNeoStep1}</StepLabel>
          <Image
            src={`/instructions/2-N-${suffix}-CONF.png`}
            alt={t[lang].instrNeoStep1}
            width={800}
            height={500}
            className="w-full rounded-lg"
            style={{ border: "1px solid rgba(0,212,255,0.2)" }}
          />
          <StepLabel>{t[lang].instrNeoStep2}</StepLabel>
          <Image
            src={`/instructions/3-N-${suffix}-CONF.png`}
            alt={t[lang].instrNeoStep2}
            width={800}
            height={500}
            className="w-full rounded-lg"
            style={{ border: "1px solid rgba(0,212,255,0.2)" }}
          />
        </div>
      </div>
    </div>
  );
}
