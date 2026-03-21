export interface ArcadeGame {
  id: string;
  name: string;
  src: string;
  players: string;
  color: string;
  icon: string;
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: "slug",
    name: "METAL SLUG (NeoGeo)",
    src: "/games/slug/index.html",
    players: "1-2P",
    color: "#ff9900",
    icon: "🔫",
  },
  {
    id: "sidekicks",
    name: "SUPER SIDEKICKS (NeoGeo)",
    src: "/games/sidekicks/index.html",
    players: "1-2P",
    color: "#44ff88",
    icon: "⚽",
  },
  {
    id: "mario",
    name: "MARIO",
    src: "/games/mario/index.html",
    players: "1P",
    color: "#ff5c5c",
    icon: "🍄",
  },
  {
    id: "pacman",
    name: "PACMAN",
    src: "/games/pacman.html",
    players: "1P",
    color: "#ffe45c",
    icon: "🟡",
  },
  {
    id: "pong",
    name: "PONG",
    src: "/games/pong.html",
    players: "1-2P",
    color: "#58FAFD",
    icon: "🏓",
  },
  {
    id: "snake",
    name: "SNAKE",
    src: "/games/snake.html",
    players: "1P",
    color: "#44ff88",
    icon: "🐍",
  },
  {
    id: "breakout",
    name: "BREAKOUT",
    src: "/games/breakout.html",
    players: "1P",
    color: "#c080ff",
    icon: "🧱",
  },
  {
    id: "invaders",
    name: "SPACE INVADERS",
    src: "/games/invaders.html",
    players: "1P",
    color: "#ff4466",
    icon: "👾",
  },
];
