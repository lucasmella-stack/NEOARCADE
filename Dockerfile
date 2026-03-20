# ─────────────────────────────────────────────────────────────────────────────
# NEOARCADE — Multi-stage Dockerfile
#
# Stages:
#   sf-builder   → Compiles Street Fighter (Pygame) to WebAssembly via Pygbag
#   slug-builder → Copies Unity WebGL build (pre-built, see scripts/build-slug.sh)
#   deps         → Installs Node.js dependencies
#   builder      → Builds Next.js app
#   runner       → Lean production image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build Street Fighter with Pygbag ─────────────────────────────────
FROM python:3.12-slim AS sf-builder

WORKDIR /game

# System libs required for pygame headless (SDL2 in headless mode for Pygbag)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsdl2-dev \
    libsdl2-image-dev \
    libsdl2-mixer-dev \
    libsdl2-ttf-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (numpy needed by main.py, pygame + pygbag for build)
RUN pip install --no-cache-dir \
    pygame==2.6.1 \
    numpy==1.26.4 \
    pygbag==0.9.2

# Copy game source
COPY games-src/sf/ .

# Build: Pygbag packages main.py + assets → build/web/index.html + .apk + wasm
# SDL_VIDEODRIVER=dummy: headless build (no display needed for --build)
RUN SDL_VIDEODRIVER=dummy python -m pygbag \
    --build \
    --width 1280 \
    --height 720 \
    --ume_block 0 \
    .

# Inject NEOARCADE joystick bridge into the built HTML
COPY scripts/inject-bridge.py /inject-bridge.py
RUN python /inject-bridge.py build/web/index.html

# ── Stage 2: Metal Slug WebGL (Unity pre-built) ───────────────────────────────
# The Unity WebGL build is generated separately (see scripts/build-slug.sh).
# If public/games/slug/ contains a WebGL build it will be included.
# Otherwise the existing Phaser.js html5-slug fallback is used.
FROM scratch AS slug-builder
# This stage intentionally left minimal — assets come from the COPY below.

# ── Stage 3: Node.js dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 4: Build Next.js ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Compile server.ts → server.cjs so "node server.cjs" works at runtime
RUN pnpm exec esbuild server.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --format=cjs \
      --outfile=server.cjs \
      --external:next \
      --external:socket.io \
      --external:socket.io-client \
      --external:uuid \
      --external:react \
      --external:react-dom

RUN pnpm build

# ── Stage 5: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

# Node.js runtime dependencies only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Next.js output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Compiled server bundle (esbuild output from builder stage)
COPY --from=builder /app/server.cjs ./server.cjs

# Config
COPY next.config.* ./
COPY tsconfig.json ./

# ── Copy game assets ──────────────────────────────────────────────────────────

# Street Fighter: Pygbag WebAssembly build
COPY --from=sf-builder /game/build/web/ ./public/games/sf/

# Metal Slug: comes from public/games/slug/ (html5-slug Phaser.js, or Unity WebGL if built)
# (already included via COPY public above)

EXPOSE 3000

CMD ["node", "server.cjs"]
