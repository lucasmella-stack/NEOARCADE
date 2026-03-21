"use client";

import { ARCADE_GAMES, type ArcadeGame } from "@/data/games";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  onPlay: (game: ArcadeGame) => void;
  lang: Lang;
}

export function GameMenu({ onPlay, lang }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto">
      <div className="w-full max-w-lg px-4 py-6 select-none">
        <p
          className="text-2xl tracking-widest uppercase text-center glow-text-primary mb-1"
          style={{ color: "var(--neon-primary)", opacity: 0.9 }}
        >
          SELECT GAME
        </p>
        <p
          className="text-xs tracking-wider text-center mb-5"
          style={{ color: "var(--text-muted)" }}
        >
          Juegos integrados para seleccionar y jugar · Tambien puedes cargar tu
          ROM
        </p>

        <div className="grid grid-cols-2 gap-3">
          {ARCADE_GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => onPlay(game)}
              className="group relative rounded-lg p-3 text-left transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{
                backgroundColor:
                  "color-mix(in srgb, " + game.color + " 8%, #0a0a0f)",
                border:
                  "1px solid color-mix(in srgb, " +
                  game.color +
                  " 30%, transparent)",
              }}
            >
              <span className="text-2xl block mb-1">{game.icon}</span>
              <span
                className="text-sm font-bold tracking-wider block"
                style={{ color: game.color }}
              >
                {game.name}
              </span>
              <span
                className="text-[10px] tracking-wide block mt-0.5 leading-tight"
                style={{ color: "#888" }}
              >
                {game.description}
              </span>
              <span
                className="absolute top-2 right-2 text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                style={{
                  color: game.color,
                  backgroundColor:
                    "color-mix(in srgb, " + game.color + " 15%, transparent)",
                }}
              >
                {game.players}
              </span>
            </button>
          ))}
        </div>

        <p
          className="text-[10px] tracking-wide text-center mt-4 leading-relaxed"
          style={{ color: "#6f7f8f" }}
        >
          {t[lang].neogeoNote}
        </p>
      </div>
    </div>
  );
}
