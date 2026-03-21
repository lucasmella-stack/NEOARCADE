"use client";

import { NEON_BTN } from "@/components/layout/layoutStyles";
import { Lobby } from "@/components/lobby/Lobby";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  show: boolean;
  onClose: () => void;
  lang: Lang;
}

export function QrPanel({ show, onClose, lang }: Props) {
  return (
    <div
      className="absolute top-0 right-0 h-full z-30 transition-transform duration-300 ease-in-out"
      style={{
        width: 320,
        transform: show ? "translateX(0)" : "translateX(100%)",
      }}
    >
      {show && (
        <div
          className="fixed inset-0 z-[-1]"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={onClose}
        />
      )}

      <div
        className="h-full overflow-y-auto p-4"
        style={{
          background: "linear-gradient(180deg, #0a1a5c, #011246)",
          borderLeft: "3px solid #024DD6",
          boxShadow:
            "-4px 0 30px rgba(0,0,0,0.6), inset 1px 0 0 rgba(88,250,253,0.08)",
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
            {t[lang].connect}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm cursor-pointer"
            style={NEON_BTN}
          >
            ✕
          </button>
        </div>

        <Lobby />
      </div>
    </div>
  );
}
