# NEOARCADE — AI Instructions

> Copilot lee este archivo automáticamente.

---

## Project Overview

- **Name**: NEOARCADE
- **Description**: Consola retro open source que corre juegos 2D arcade en el navegador. Los móviles se conectan como joysticks vía WebSocket escaneando un QR. Sin instalar apps. 2 jugadores simultáneos.
- **Stack**: Next.js 15 (App Router) + Socket.io + EmulatorJS
- **Realtime**: Socket.io con rooms por sesión de juego
- **Hosting**: Hetzner VPS (custom Next.js server)
- **Package manager**: pnpm

---

## Architecture

```
src/
├── app/
│   ├── (game)/           # Pantalla principal: emulador + QR lobby
│   │   └── page.tsx
│   ├── controller/       # Vista móvil: joystick neon azul
│   │   └── page.tsx
│   └── api/
│       └── socket/       # No se usa — Socket.io va en server.ts
├── components/
│   ├── emulator/         # Wrapper EmulatorJS
│   ├── controller/       # Gamepad virtual (D-pad, A, B, Start)
│   └── lobby/            # QR code + estado de jugadores
├── lib/
│   └── socket.ts         # Cliente Socket.io singleton
├── hooks/
│   └── useGamepad.ts     # Hook para input del controlador
├── store/
│   └── game.store.ts     # Zustand: room, players, estado
└── types/
    └── gamepad.ts        # Tipos de inputs y eventos
server.ts                 # Custom Next.js server con Socket.io
```

---

## Key Decisions

- **Emulador**: EmulatorJS — soporta NeoGeo (Metal Slug), Arcade, SNES, NES
- **Realtime**: Socket.io en custom server (no API routes — necesita conexión persistente)
- **Controller identity**: cada móvil se identifica como Player 1 o Player 2 según orden de conexión
- **ROMs**: NO se distribuyen. El usuario las carga localmente. Solo se distribuye el engine.
- **Styling**: Tailwind CSS 4. Tema neon: fondo oscuro #0a0a0f, azul neon #00d4ff, glow effects via box-shadow
- **No auth**: sesiones anónimas por room ID (UUID)
- **State management**: Zustand para estado de la sesión (room, players), Socket.io para eventos realtime
- **Latencia objetivo**: < 50ms en LAN, < 150ms por internet

---

## Input Events (Socket.io)

```typescript
// Móvil → Servidor → Pantalla
{ type: "input", player: 1 | 2, button: Button, state: "pressed" | "released" }

type Button = "up" | "down" | "left" | "right" | "a" | "b" | "start"
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
PORT=3000
```

---

## Commands

```bash
pnpm dev              # Desarrollo (custom server con tsx watch)
pnpm build            # Build producción
pnpm start            # Producción (node server.js)
pnpm test             # Vitest
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check
```

---

## Aesthetic (IMPORTANTE)

- **Fondo**: `#0a0a0f` (negro azulado profundo)
- **Neon primario**: `#00d4ff` (cyan eléctrico)
- **Neon secundario**: `#0080ff` (azul eléctrico)
- **Glow**: `box-shadow: 0 0 20px #00d4ff, 0 0 40px #00d4ff40`
- **Botones**: bordes con glow, fondo semitransparente, presión con scale + glow intenso
- **Fuente**: monospace / tecnológica
- **D-pad**: forma de cruz con bordes redondeados, glow azul al tocar
- **ROMs**: el usuario las sube, no se incluyen en el repo
