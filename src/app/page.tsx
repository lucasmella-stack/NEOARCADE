"use client";

import { GameScreen } from "@/components/emulator/GameScreen";
import { InstructionsModal } from "@/components/layout/InstructionsModal";
import { QrPanel } from "@/components/layout/QrPanel";
import { TopBar } from "@/components/layout/TopBar";
import { useLangStore } from "@/store/lang.store";
import { useState } from "react";

export default function GamePage() {
  const [showPanel, setShowPanel] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { lang, setLang } = useLangStore();

  return (
    <main
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: "#010224" }}
    >
      <TopBar
        lang={lang}
        onToggleLang={() => setLang(lang === "es" ? "en" : "es")}
        showPanel={showPanel}
        onTogglePanel={() => setShowPanel((v) => !v)}
        onOpenInstructions={() => setShowInstructions(true)}
      />

      <div className="relative flex-1 min-h-0">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, #001a2e 0%, #010224 100%)",
          }}
        />
        <div className="relative z-10 w-full h-full p-3">
          <GameScreen />
        </div>
        <QrPanel
          show={showPanel}
          onClose={() => setShowPanel(false)}
          lang={lang}
        />
      </div>

      <InstructionsModal
        show={showInstructions}
        onClose={() => setShowInstructions(false)}
        lang={lang}
      />
    </main>
  );
}
