# ─────────────────────────────────────────────────────────────────────────────
# NEOARCADE — Multi-stage Dockerfile
#
# Stages:
#   deps         → Installs Node.js dependencies
#   builder      → Builds Next.js app
#   runner       → Lean production image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Node.js dependencies ────────────────────────────────────────────
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

# Metal Slug: comes from public/games/slug/ (EmulatorJS + ROM picker)
# (already included via COPY public above)

EXPOSE 3000

CMD ["node", "server.cjs"]
