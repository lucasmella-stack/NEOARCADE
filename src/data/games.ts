export interface ArcadeGame {
  id: string;
  name: string;
  description: string;
  src: string;
  players: string;
  color: string;
  icon: string;
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: "slug",
    name: "METAL SLUG (NeoGeo)",
    description:
      "1-2P co-op. Si no hay BIOS instalado, te pide neogeo.zip una sola vez.",
    src: "/games/slug/index.html",
    players: "1-2P",
    color: "#ff9900",
    icon: "🔫",
  },
  {
    id: "sidekicks",
    name: "SUPER SIDEKICKS (NeoGeo)",
    description:
      "Futbol arcade 2P. Usa el mismo BIOS NeoGeo y abre desde el menu.",
    src: "/games/sidekicks/index.html",
    players: "1-2P",
    color: "#44ff88",
    icon: "⚽",
  },
  {
    id: "mario",
    name: "MARIO",
    description: "Plataformas clásico con salto, carrera y tuberías.",
    src: "/games/mario/index.html",
    players: "1P",
    color: "#ff5c5c",
    icon: "🍄",
  },
  {
    id: "pacman",
    name: "PACMAN",
    description: "Come puntos, esquiva fantasmas y limpia el laberinto.",
    src: "/games/pacman.html",
    players: "1P",
    color: "#ffe45c",
    icon: "🟡",
  },
  {
    id: "pong",
    name: "PONG",
    description: "El clásico. 2 jugadores con joysticks móviles.",
    src: "/games/pong.html",
    players: "1-2P",
    color: "#58FAFD",
    icon: "🏓",
  },
  {
    id: "snake",
    name: "SNAKE",
    description: "Come, crece, no te muerdas la cola.",
    src: "/games/snake.html",
    players: "1P",
    color: "#44ff88",
    icon: "🐍",
  },
  {
    id: "breakout",
    name: "BREAKOUT",
    description: "Rompe todos los bloques con la bola.",
    src: "/games/breakout.html",
    players: "1P",
    color: "#c080ff",
    icon: "🧱",
  },
  {
    id: "invaders",
    name: "SPACE INVADERS",
    description: "Defiende la tierra de oleadas alienígenas.",
    src: "/games/invaders.html",
    players: "1P",
    color: "#ff4466",
    icon: "👾",
  },
];
