# Docker & DevOps Instructions

> Se aplica al escribir Dockerfiles, docker-compose, CI/CD, infra.

## Docker

### Dockerfile best practices

```dockerfile
# Multi-stage build SIEMPRE
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S app && adduser -S app -u 1001
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
```

### Reglas

- Multi-stage builds para reducir tamaño
- Non-root user SIEMPRE
- `.dockerignore` actualizado (node_modules, .git, .env)
- `--frozen-lockfile` / `--no-dev` en producción
- Health checks en docker-compose
- Logs a stdout/stderr, NUNCA a archivos dentro del container

### Docker Compose

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

volumes:
  pgdata:
```

## GitHub Actions

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run test
```

## Hetzner deployment

- Usar Docker Compose en VPS
- Traefik o Caddy como reverse proxy (auto-SSL)
- Backups automáticos de volumes PostgreSQL
- Firewall: solo 80, 443, 22 (cambiar puerto SSH)
