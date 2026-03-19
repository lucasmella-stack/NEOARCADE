import { GameScreen } from "@/components/emulator/GameScreen";
import { Lobby } from "@/components/lobby/Lobby";

export default function GamePage() {
  return (
    <main
      className="relative w-screen min-h-screen overflow-auto flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-deep)" }}
    >
      {/* Fondo con gradiente radial */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, #001a2e 0%, var(--bg-deep) 100%)",
        }}
      />

      {/* Contenido principal */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center gap-6 p-4 py-8">
        {/* Logo */}
        <h1
          className="text-4xl font-bold tracking-[0.3em] uppercase glow-text-primary select-none"
          style={{ color: "var(--neon-primary)" }}
        >
          NEOARCADE
        </h1>
        <p
          className="text-xs tracking-[0.2em] uppercase -mt-4"
          style={{ color: "var(--text-muted)" }}
        >
          RETRO GAMING · MOBILE JOYSTICK · 2 PLAYERS
        </p>

        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Pantalla del emulador */}
          <div className="flex-1 min-w-0">
            <GameScreen />
          </div>

          {/* Panel lateral: lobby + QR */}
          <div className="w-full lg:w-72 shrink-0">
            <Lobby />
          </div>
        </div>

        {/* Footer */}
        <footer
          className="text-xs tracking-wider mt-4"
          style={{ color: "var(--text-muted)" }}
        >
          Open Source · Las ROMs no se distribuyen
        </footer>
      </div>
    </main>
  );
}
