# Template Setup — Configurador Inteligente de Proyectos

> **TRIGGER**: El usuario dice "usa la template", "configura agentes", "setup",
> "armá la estructura", "configura copilot", "analiza este proyecto" o similar.
>
> Este archivo UNIFICA ambos flujos: proyecto nuevo y proyecto existente.
> El agente auto-detecta cuál aplicar y se lo confirma al usuario.

---

## Instrucciones para el agente

Cuando el usuario active este flujo, seguí estos pasos EN ORDEN:

---

### Paso 0: Auto-detectar tipo de proyecto

Escaneá el workspace buscando señales:

```
BUSCAR:
├── package.json           → ¿Existe? ¿Tiene dependencies reales?
├── pyproject.toml         → ¿Existe? ¿Tiene dependencias reales?
├── requirements.txt       → ¿Existe?
├── src/ o app/ o lib/     → ¿Hay archivos de código reales (no solo .gitkeep)?
├── tsconfig.json          → ¿Existe?
├── .github/copilot-instructions.md → ¿Contiene [PROJECT_NAME] (template sin configurar)?
├── README.md              → ¿Tiene contenido real o es placeholder?
└── .git/                  → ¿Es un repo con historial?
```

**Reglas de detección:**

| Señal                                                      | Resultado                         |
| ---------------------------------------------------------- | --------------------------------- |
| `copilot-instructions.md` contiene `[PROJECT_NAME]`        | → Template sin configurar (NUEVO) |
| No hay `package.json` NI `pyproject.toml`                  | → Proyecto vacío (NUEVO)          |
| `src/` tiene solo `.gitkeep` o no existe                   | → Proyecto vacío (NUEVO)          |
| `package.json` tiene `dependencies` con frameworks reales  | → Proyecto existente (RETROFIT)   |
| `src/` o `app/` tiene archivos `.ts`, `.tsx`, `.py` reales | → Proyecto existente (RETROFIT)   |
| Hay historial git con múltiples commits                    | → Proyecto existente (RETROFIT)   |

---

### Paso 1: Preguntar al usuario (SIEMPRE, incluso si la detección es clara)

Mostrá lo que detectaste y pedí confirmación:

**Si detectó NUEVO:**

```
🔍 Analicé tu workspace y parece un proyecto NUEVO (sin código fuente todavía).

¿Qué quieres hacer?

1. 🆕 Proyecto nuevo — Configurar desde cero (te pregunto stack, DB, auth, etc. y creo toda la estructura)
2. 🔄 Proyecto existente — Ya tiene código, solo necesita la infraestructura AI (analizo el código y genero configs)
3. 📋 Solo instrucciones — Copiar solo mis archivos .instructions.md (sin AGENTS.md ni skills)
```

**Si detectó EXISTENTE:**

```
🔍 Analicé tu workspace y encontré un proyecto existente con código.
   Detecté: [resumen rápido de lo que encontró — ej: "Next.js + Tailwind + Drizzle"]

¿Qué quieres hacer?

1. 🔄 Retrofit completo — Analizo todo tu código y genero copilot-instructions.md + AGENTS.md + instructions adaptadas
2. 🆕 Reset total — Ignorar el código existente y configurar como proyecto nuevo desde cero
3. 📋 Solo instrucciones — Copiar solo mis archivos .instructions.md personales (sin analizar el proyecto)
```

**ESPERAR RESPUESTA antes de continuar.**

---

### Flujo A: PROYECTO NUEVO (desde cero)

Si el usuario eligió "Proyecto nuevo":

#### A.1 — Preguntar stack completo

Hacé TODAS estas preguntas juntas (no una por una):

```
¡Perfecto! Vamos a configurar tu proyecto. Respondé todo junto:

1. 📦 Nombre del proyecto:
2. 📝 Descripción (1-2 frases):
3. 🏗️ Tipo:
   a) Web app fullstack (Next.js)
   b) API backend (FastAPI / Express)
   c) CLI tool
   d) LLM/AI app
   e) Landing / Marketing site
   f) SaaS platform
4. ⚛️ Frontend:
   a) Next.js 15 + React 19 + Tailwind 4 + shadcn/ui
   b) Next.js 15 + React 19 + Tailwind 4
   c) React + Vite
   d) Ninguno (solo backend)
5. 🔧 Backend:
   a) Next.js API Routes (sin backend separado)
   b) FastAPI (Python)
   c) Express / Fastify (Node.js)
   d) Django
   e) Ninguno
6. 🗄️ Base de datos:
   a) PostgreSQL
   b) MongoDB
   c) SQLite
   d) Supabase
   e) Ninguna
7. 🔐 Auth:
   a) NextAuth.js / Auth.js
   b) Clerk
   c) Supabase Auth
   d) JWT manual
   e) Ninguna
8. ☁️ Hosting:
   a) Hetzner (Docker)
   b) Railway / Fly.io
   c) AWS / GCP / Azure
   d) Otro
9. 🧩 Extras (elegí todos los que apliquen):
   - AI/LLM integration
   - Real-time (WebSockets)
   - File uploads
   - Payments (Stripe)
   - Email (Resend)
   - i18n
   - PWA
   - Ninguno
```

#### A.2 — Crear todo

Con las respuestas, ejecutar TODO esto sin pedir confirmación extra:

**Archivos de configuración AI:**

1. `.github/copilot-instructions.md` — Llenar con datos reales (reemplazar todos los `[PROJECT_NAME]` etc.)
2. `AGENTS.md` — Tabla Quick Reference con el stack elegido
3. `.github/instructions/` — Conservar solo los que aplican al stack:
   - SIEMPRE: `global-profile`, `git-workflow`, `testing`
   - Si JS/TS: + `react-nextjs`
   - Si Python: + `python`
   - Si Docker: + `docker-devops`
   - Si AI/LLM: + `llm-ai`
   - BORRAR los que no aplican
4. `.vscode/settings.json` — Adaptar al stack
5. `.vscode/extensions.json` — Extensiones relevantes

**Estructura de código:** 6. Crear carpetas y archivos starter según el stack elegido:

**Next.js fullstack:**

```
src/
├── app/
│   ├── layout.tsx          ← Con metadata real
│   ├── page.tsx            ← Landing básica
│   ├── globals.css         ← Tailwind imports
│   └── api/health/route.ts ← Health check
├── components/ui/.gitkeep
├── components/shared/.gitkeep
├── lib/utils.ts            ← cn() helper
├── lib/constants.ts
├── hooks/.gitkeep
├── types/index.ts
└── services/.gitkeep
```

**FastAPI:**

```
src/
├── __init__.py
├── main.py                 ← App con health endpoint
├── config.py               ← Pydantic Settings
├── models/__init__.py
├── services/__init__.py
├── api/routes/__init__.py
└── utils/__init__.py
tests/conftest.py
```

**LLM/AI app:**

```
src/
├── __init__.py
├── main.py
├── config.py
├── models/__init__.py
├── training/__init__.py
├── inference/__init__.py
└── data/.gitkeep
notebooks/.gitkeep
tests/conftest.py
```

7. `package.json` / `pyproject.toml` — Con dependencias del stack elegido
8. `.env.example` — Variables según servicios elegidos
9. `docker-compose.yml` — Si eligió Docker/DB local
10. `README.md` — Script de setup, comandos, descripción real
11. `.github/workflows/ci.yml` — CI básico (lint + typecheck + test)

#### A.3 — Confirmar

```
✅ Proyecto [NOMBRE] configurado desde cero:

📁 Estructura creada: [resumen]
🤖 AI instructions: copilot-instructions.md + AGENTS.md + [N] instruction files
📋 Instrucciones activas: [lista]

Próximos pasos:
  1. [pnpm install / pip install / etc.]
  2. cp .env.example .env && editar variables
  3. [pnpm dev / uvicorn / etc.]
```

#### A.4 — Auto-eliminar archivos de setup

Borrar `template-setup.instructions.md` y `project-setup.instructions.md` (si existe).
El proyecto ya está configurado, no se necesitan más.

---

### Flujo B: PROYECTO EXISTENTE (retrofit)

Si el usuario eligió "Retrofit" / "Proyecto existente":

#### B.1 — Análisis profundo

Leer TODOS estos archivos para entender el proyecto:

```
ANALIZAR:
├── package.json          → name, description, dependencies, devDependencies, scripts
├── pyproject.toml        → name, dependencies, scripts
├── requirements.txt      → deps Python
├── tsconfig.json         → paths, target, module
├── next.config.*         → Next.js version, config
├── vite.config.*         → Vite config
├── tailwind.config.*     → Tailwind version, theme
├── docker-compose.*      → Servicios (DB, Redis, etc.)
├── Dockerfile            → Deploy method
├── .env.example          → Variables de entorno
├── src/db/schema.ts      → DB models
├── README.md             → Descripción, setup, docs
├── .github/workflows/    → CI/CD existente
├── .eslintrc* / eslint.config.* → Lint rules
├── prettier.config.*     → Format rules
└── src/ app/ lib/        → Estructura real de código
```

Extraer:

| Dato             | Fuente                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **Nombre**       | `package.json → name` / `pyproject.toml → name` / carpeta                                 |
| **Descripción**  | `description` field / README primer párrafo                                               |
| **Frontend**     | `next`, `react`, `vue`, `svelte`, `astro` en deps                                         |
| **Backend**      | `fastapi`, `django`, `express`, `fastify`, `hono` en deps                                 |
| **DB**           | `drizzle`, `sqlalchemy`, `mongoose`, `pg` en deps / docker-compose                        |
| **Auth**         | `next-auth`, `@clerk`, `@supabase/auth`, `passport`, `lucia` en deps                      |
| **Testing**      | `vitest`, `jest`, `pytest`, `playwright`, `cypress` en devDeps                            |
| **Styling**      | `tailwindcss`, `sass`, `styled-components`, `@emotion` en deps                            |
| **AI/LLM**       | `openai`, `langchain`, `@ai-sdk/*`, `transformers`, `huggingface`                         |
| **State**        | `zustand`, `redux`, `jotai`, `@tanstack/react-query`                                      |
| **ORM**          | `drizzle-orm`, `typeorm`, `sqlalchemy`, `sequelize`                                       |
| **Hosting**      | Dockerfile, `fly.toml`, `railway.toml`                                                    |
| **Pkg manager**  | `pnpm-lock.yaml` → pnpm / `yarn.lock` → yarn / `package-lock.json` → npm / `uv.lock` → uv |
| **Estructura**   | Árbol de `src/`, `app/`, `pages/`, `components/`, `lib/`, `api/`                          |
| **Convenciones** | Naming patterns, import style, component patterns del código existente                    |
| **Scripts**      | `package.json → scripts` / README → Commands section                                      |
| **Env vars**     | `.env.example` / `.env.local.example` / `.env.*`                                          |

#### B.2 — Presentar hallazgos y preguntar lo mínimo

```
🔍 Análisis completo de tu proyecto:

📦 Nombre: [detectado]
📝 Descripción: [detectado]
⚛️ Frontend: [detectado con versiones]
🔧 Backend: [detectado]
🗄️ Database: [detectado]
🔐 Auth: [detectado]
🧪 Testing: [detectado]
🎨 Styling: [detectado]
📊 State: [detectado]
🐳 Docker: [sí/no]
☁️ Hosting: [detectado o "?"]
📦 Package manager: [detectado]

¿Es correcto? ¿Algo para ajustar?

Solo necesito saber:
[Listar SOLO lo que no pudo inferir — si pudo inferir todo, no preguntar nada]

¿Nivel de configuración AI?
  a) Básico — copilot-instructions + AGENTS.md + instructions relevantes
  b) Completo — Lo anterior + AGENTS.md por componente + skills/ con patrones reales del código
```

#### B.3 — Generar infraestructura AI

**Nivel básico:**

1. `.github/copilot-instructions.md` — Con datos REALES del proyecto:

   ```markdown
   # [NOMBRE REAL] — AI Instructions

   ## Project Overview

   - **Name**: [real]
   - **Description**: [real]
   - **Stack**: [real, con versiones]
   - **DB**: [real]
   - **Hosting**: [real]

   ## Architecture

   [Estructura REAL escaneada del código]

   ## Key Decisions

   [Extraídas del README / inferidas del código]

   ## Environment Variables

   [De .env.example]

   ## Commands

   [De package.json scripts / README]

   ## Conventions

   [Inferidas: naming, import style, component patterns, etc.]
   ```

2. `AGENTS.md` — Con stack real detectado

3. `.github/instructions/` — Solo los que aplican:
   - SIEMPRE: `global-profile`, `git-workflow`, `testing`
   - Si detectó JS/TS: + `react-nextjs`
   - Si detectó Python: + `python`
   - Si detectó Docker: + `docker-devops`
   - Si detectó AI/LLM: + `llm-ai`

   Para copiar los archivos, leer de `C:\Users\lucas\Documents\Be Web\dev-template\.github\instructions\`
   o clonar desde `https://github.com/lucasmella-stack/dev-template`

4. `.vscode/settings.json` (si no existe) — Adaptado al stack
5. `.vscode/extensions.json` (si no existe) — Extensiones relevantes

**Nivel completo** (solo si el usuario lo pidió):

6. `AGENTS.md` por componente — En cada subcarpeta principal (`frontend/`, `backend/`, `api/`, etc.)
7. `skills/` — Con patrones del código REAL:

   ```
   skills/
   ├── {proyecto}/SKILL.md              ← Overview del proyecto
   ├── {proyecto}-{componente}/SKILL.md ← Skill por componente con código real
   └── README.md
   ```

   Cada skill DEBE incluir:
   - Cuándo usarlo (auto-invoke triggers)
   - Patrones críticos del componente
   - Ejemplos de código REALES (no genéricos)

**NO tocar código existente del proyecto. Solo crear archivos de config AI.**

#### B.4 — Confirmar

```
✅ Infraestructura AI configurada para [NOMBRE]:

📁 Archivos creados:
  .github/copilot-instructions.md    ← Identidad del proyecto
  .github/instructions/
    ├── [lista de los que se crearon]
  .vscode/settings.json              ← (si se creó)
  .vscode/extensions.json            ← (si se creó)
  AGENTS.md                          ← Para Claude/Codex/Gemini
  [skills/ si nivel completo]

🔍 Stack detectado: [resumen]
📋 Instrucciones activas: [N] archivos

El agente ahora conoce tu proyecto. Empezá a codear.
```

#### B.5 — Auto-eliminar

Borrar `template-setup.instructions.md` y `retrofit-existing.instructions.md` (si existen).

---

### Flujo C: SOLO INSTRUCCIONES (copia rápida)

Si el usuario eligió "Solo instrucciones":

1. Copiar a `.github/instructions/` los archivos del template que aplican:
   - `global-profile.instructions.md` (SIEMPRE)
   - `git-workflow.instructions.md` (SIEMPRE)
   - `testing.instructions.md` (SIEMPRE)
   - Preguntar cuáles de los opcionales quiere:
     - `react-nextjs.instructions.md`
     - `python.instructions.md`
     - `docker-devops.instructions.md`
     - `llm-ai.instructions.md`

2. NO crear `copilot-instructions.md` ni `AGENTS.md`

3. Confirmar:

   ```
   ✅ Instrucciones copiadas:
   .github/instructions/
     ├── [lista]

   Solo se copiaron las instrucciones personales.
   No se creó copilot-instructions.md ni AGENTS.md.
   ```

4. Auto-eliminar `template-setup.instructions.md`

---

## Notas para el agente

- **Auto-detectar PRIMERO, preguntar DESPUÉS** — Nunca empieces pidiendo datos que podés inferir
- **Una sola interacción** — Mostrá todo lo detectado + todas las preguntas en un solo mensaje
- **Crear todo de una vez** — No pidas confirmación archivo por archivo
- **NO tocar código existente** — Solo archivos de configuración AI
- **Adaptar al proyecto real** — No copies templates literalmente, ajustalos
- **Usar patrones reales** — Si el proyecto usa cierto naming, hooks, o estructura, reflejalo
- **Este archivo se auto-destruye** — Borrarlo al final del setup
- **Si hay README.md bueno**, usalo como fuente principal de verdad
- **Si hay .eslintrc o prettier config**, incluir convenciones en copilot-instructions
- **Los instructions files se leen de** `C:\Users\lucas\Documents\Be Web\dev-template\.github\instructions\` (local) o `https://github.com/lucasmella-stack/dev-template` (remote)
