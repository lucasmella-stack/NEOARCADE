# [PROJECT_NAME] — AI Instructions

> Copilot lee este archivo automáticamente. Describe TU proyecto aquí.

---

## Project Overview

- **Name**: [PROJECT_NAME]
- **Description**: [Qué hace este proyecto]
- **Stack**: [Next.js 15 / FastAPI / etc.]
- **DB**: [PostgreSQL / Redis / etc.]
- **Hosting**: [Hetzner / AWS / etc.]

---

## Architecture

```
src/
├── app/               # Pages & routes (Next.js App Router)
│   ├── (auth)/        # Auth pages
│   ├── (dashboard)/   # Main app pages
│   └── api/           # API routes (BFF)
├── components/
│   ├── ui/            # shadcn/ui base components
│   └── shared/        # Reusable components (2+ uses)
├── lib/               # Utilities, configs, constants
├── hooks/             # Custom React hooks
├── types/             # Shared TypeScript types
├── services/          # API clients, external services
└── tests/             # Test files
```

---

## Key Decisions

<!-- Documenta decisiones arquitectónicas importantes -->

- **State management**: Zustand para estado global, Server Components para data fetching
- **Auth**: NextAuth.js con [provider]
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Validation**: Zod for forms and API inputs

---

## Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

---

## Commands

```bash
pnpm dev              # Development server
pnpm build            # Production build
pnpm test             # Run Vitest
pnpm test:e2e         # Run Playwright
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check
```

---

## Conventions

- Feature-based folder structure
- Server Components by default
- Conventional commits required
- Tests required for new features
- No `any` in TypeScript
