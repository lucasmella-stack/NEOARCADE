# Repository Guidelines

> For AI agents that read AGENTS.md: Claude Code, Codex (OpenAI), Gemini CLI, etc.
> For GitHub Copilot: see `.github/copilot-instructions.md`

## Quick Reference

| Area     | Convention                       |
| -------- | -------------------------------- |
| Language | TypeScript + Python              |
| Frontend | Next.js 15, React 19, Tailwind 4 |
| Backend  | Node.js / FastAPI                |
| Testing  | Vitest + Playwright / pytest     |
| Commits  | Conventional commits             |
| Branches | feat/, fix/, chore/              |
| Docker   | Multi-stage, non-root user       |
| Hosting  | Hetzner                          |

## Instructions

Detailed coding instructions live in `.github/instructions/`:

| File                             | Purpose                         |
| -------------------------------- | ------------------------------- |
| `global-profile.instructions.md` | Developer profile & preferences |
| `react-nextjs.instructions.md`   | React/Next.js patterns          |
| `python.instructions.md`         | Python patterns                 |
| `testing.instructions.md`        | Testing rules                   |
| `git-workflow.instructions.md`   | Git conventions                 |
| `docker-devops.instructions.md`  | Docker & CI/CD                  |
| `llm-ai.instructions.md`         | LLM/AI development              |

## Critical Rules

- TypeScript strict: no `any`, explicit types
- Python: always type hints, Google-style docstrings
- Tests required for all new code
- Conventional commits mandatory
- Server Components by default (Next.js)
- Feature-based folder structure
- No secrets in code, always env vars
