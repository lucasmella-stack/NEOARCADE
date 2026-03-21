export const LangValues = { es: "es", en: "en" } as const;
export type Lang = (typeof LangValues)[keyof typeof LangValues];

export const t = {
  es: {
    // TopBar
    instructions: "INSTRUCCIONES",
    joystick: "JOYSTICK",
    // Panel header
    connect: "CONECTAR",
    // Lobby
    connectJoystick: "CONECTAR JOYSTICK",
    connOn: "ON",
    connOff: "OFF",
    players: "Jugadores",
    ready: "READY",
    waiting: "WAITING",
    scanQr: "Escanea el QR con tu móvil para conectarte como joystick",
    loading: "Cargando…",
    // GameScreen
    loadRom: "▲ CARGAR ROM",
    romLoaded: "✓ ROM",
    neogeoNote:
      "Algunos sistemas como Neo Geo pueden requerir BIOS del usuario para el primer arranque.",
    backMenu: "← MENÚ",
    // Controller
    noRoom: "Escanea el QR desde la consola para conectarte",
    connected: "● CONECTADO",
    connecting: "○ CONECTANDO…",
    expand: "⛶ AMPLIAR",
    // Instructions modal
    instructionsTitle: "INSTRUCCIONES",
    instrAllGames: "TODOS LOS JUEGOS",
    instrNeoGeo: "JUEGOS NEOGEO",
    instrNeoStep1: "PASO 1 — CONFIGURACIÓN",
    instrNeoStep2: "PASO 2 — CONFIGURACIÓN",
  },
  en: {
    // TopBar
    instructions: "INSTRUCTIONS",
    joystick: "JOYSTICK",
    // Panel header
    connect: "CONNECT",
    // Lobby
    connectJoystick: "CONNECT JOYSTICK",
    connOn: "ON",
    connOff: "OFF",
    players: "Players",
    ready: "READY",
    waiting: "WAITING",
    scanQr: "Scan the QR with your phone to connect as a joystick",
    loading: "Loading…",
    // GameScreen
    loadRom: "▲ LOAD ROM",
    romLoaded: "✓ ROM",
    neogeoNote:
      "Some systems like Neo Geo may require user BIOS for the first boot.",
    backMenu: "← MENU",
    // Controller
    noRoom: "Scan the QR from the console to connect",
    connected: "● CONNECTED",
    connecting: "○ CONNECTING…",
    expand: "⛶ EXPAND",
    // Instructions modal
    instructionsTitle: "INSTRUCTIONS",
    instrAllGames: "ALL GAMES",
    instrNeoGeo: "NEOGEO GAMES",
    instrNeoStep1: "STEP 1 — SETUP",
    instrNeoStep2: "STEP 2 — SETUP",
  },
} as const;
