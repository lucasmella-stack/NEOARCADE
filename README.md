<p align="center">
  <img src="public/logo.png" alt="NEOARCADE" width="120" />
</p>

<h1 align="center">NEOARCADE</h1>

<p align="center">
  Consola retro open source que corre juegos 2D arcade en el navegador.<br/>
  Los móviles se conectan como joysticks vía WebSocket escaneando un QR.<br/>
  Sin instalar apps. 2 jugadores simultáneos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Socket.io-4-white?logo=socket.io&logoColor=black" alt="Socket.io" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss" alt="Tailwind" />
</p>

---

## Demo

<video src="https://github.com/lucasmella-stack/NEOARCADE/raw/main/docs/demo.mp4" controls autoplay loop muted width="100%"></video>

---

## Qué es NEOARCADE

Una consola de arcade que corre enteramente en el navegador. Abrís la web en tu PC/TV, escaneás el QR con el celular, y el celular se convierte en un gamepad virtual con D-pad + botones A/B + Start/Select. Dos personas pueden jugar al mismo tiempo.

**Características:**

- 4 juegos JS integrados (Snake, Pong, Breakout, Space Invaders)
- Soporte para ROMs vía EmulatorJS (NeoGeo, SNES, NES, Arcade) — el usuario carga sus propias ROMs
- Controlador móvil con estética retro 3D (D-pad, A, B, Start, Select)
- Conexión en tiempo real vía Socket.io con latencia < 50ms en LAN
- Fullscreen + landscape lock automático en móvil
- Sin registro, sin instalación — sesiones anónimas por room ID

---

## Stack

| Tecnología                  | Uso                               |
| --------------------------- | --------------------------------- |
| **Next.js 15** (App Router) | Frontend + SSR                    |
| **React 19**                | UI                                |
| **Socket.io**               | Comunicación realtime (WebSocket) |
| **EmulatorJS**              | Emulación de consolas retro       |
| **Zustand**                 | Estado global (room, players)     |
| **Tailwind CSS 4**          | Estilos                           |
| **TypeScript** (strict)     | Tipado                            |
| **pnpm**                    | Gestor de paquetes                |

---

## Requisitos previos

- **Node.js** >= 18
- **pnpm** >= 8 (`npm install -g pnpm`)

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/lucasmella-stack/NEOARCADE.git
cd NEOARCADE

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local si es necesario (por defecto apunta a localhost:3000)
```

---

## Desarrollo

```bash
pnpm dev          # Servidor de desarrollo (custom server con tsx watch)
```

Esto levanta el servidor en `http://localhost:3000`.

Para probar el controlador móvil desde otro dispositivo, necesitás un tunnel:

```bash
# Opción 1: ngrok (requiere cuenta gratuita en ngrok.com)
ngrok http 3000

# Después actualizá NEXT_PUBLIC_SOCKET_URL en .env.local con la URL del tunnel
```

---

## Comandos disponibles

| Comando          | Descripción                              |
| ---------------- | ---------------------------------------- |
| `pnpm dev`       | Desarrollo (custom server con tsx watch) |
| `pnpm build`     | Build de producción                      |
| `pnpm start`     | Producción (`node server.js`)            |
| `pnpm test`      | Tests (Vitest)                           |
| `pnpm lint`      | ESLint                                   |
| `pnpm typecheck` | TypeScript check                         |

---

## Variables de entorno

| Variable                 | Descripción                        | Ejemplo                 |
| ------------------------ | ---------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SOCKET_URL` | URL pública del servidor Socket.io | `http://localhost:3000` |
| `PORT`                   | Puerto del servidor                | `3000`                  |

Ver `.env.example` para referencia.

---

## Arquitectura

```
src/
├── app/
│   ├── page.tsx              # Pantalla principal: emulador + QR lobby
│   ├── controller/
│   │   └── page.tsx          # Vista móvil: gamepad virtual
│   └── api/
├── components/
│   ├── emulator/             # Wrapper EmulatorJS + game screen
│   ├── controller/           # Gamepad virtual (D-pad, A, B, Start, Select)
│   └── lobby/                # QR code + estado de jugadores
├── lib/
│   └── socket.ts             # Cliente Socket.io singleton
├── hooks/
│   └── useGamepad.ts         # Hook para input del controlador
├── store/
│   └── game.store.ts         # Zustand: room, players, estado
└── types/
    └── gamepad.ts            # Tipos de inputs y eventos
server.ts                     # Custom Next.js server con Socket.io
```

---

## ROMs

NEOARCADE **no incluye ni distribuye ROMs**. Solo se distribuye el engine de emulación (EmulatorJS). El usuario debe cargar sus propias ROMs localmente a través de la interfaz.

---

## Contribuir

Las contribuciones son bienvenidas. Ver [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

---

## Licencia

NEOARCADE está publicado bajo **GNU Affero General Public License v3.0**.

Esto significa que si distribuís una versión modificada, o la ofrecés como servicio accesible por red, tenés que poner a disposición el código fuente correspondiente bajo la misma licencia.

Ver [LICENSE](LICENSE) para el texto completo.
