"use client";

import { t } from "@/lib/i18n";

interface Props {
  show: boolean;
  onClose: () => void;
  lang: "es" | "en";
}

const CLOSE_BTN: React.CSSProperties = {
  color: "#58FAFD",
  background: "linear-gradient(180deg, #0a1a5c, #011246)",
  border: "2px solid #024DD6",
  boxShadow: "0 2px 0 #010224",
  fontFamily: '"Courier New", monospace',
};

export function InstructionsModal({ show, onClose, lang }: Props) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="relative rounded-xl p-8 max-w-md w-[90vw] flex flex-col gap-4"
        style={{
          background: "linear-gradient(180deg, #0a1a5c 0%, #011246 100%)",
          border: "2px solid #024DD6",
          boxShadow: "0 0 40px rgba(0,212,255,0.2), 0 8px 32px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
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
            style={CLOSE_BTN}
          >
            ✕
          </button>
        </div>

        <p
          className="text-sm leading-relaxed text-center"
          style={{
            color: "#a8cbde",
            fontFamily: '"Courier New", monospace',
          }}
        >
          {t[lang].instructionsContent}
        </p>
      </div>
    </div>
  );
}
