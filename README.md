# dev-template

Tu template base para proyectos profesionales con configuración AI integrada.

## Qué incluye

```
.github/
├── copilot-instructions.md              ← Editar por proyecto
└── instructions/
    ├── global-profile.instructions.md   ← Tu perfil (universal)
    ├── react-nextjs.instructions.md     ← React/Next.js patterns
    ├── python.instructions.md           ← Python patterns
    ├── testing.instructions.md          ← Testing rules
    ├── git-workflow.instructions.md     ← Commits & PRs
    ├── docker-devops.instructions.md    ← Docker & CI/CD
    └── llm-ai.instructions.md          ← LLM/AI patterns
.vscode/
├── settings.json                        ← Editor config
└── extensions.json                      ← Extensiones recomendadas
AGENTS.md                                ← Para Claude/Codex/Gemini
```

## Uso

### Opción 1: CLI Automático (Recomendado)

La forma más fácil de inyectar este template en un proyecto nuevo o existente es usando el CLI. Detectará automáticamente tu stack (Next.js, Python, etc.) y configurará las reglas de IA, extensiones y Git Hooks.

```bash
npx github:lucasmella-stack/dev-template
```

### Opción 2: GitHub Template

1. Push este repo a GitHub con la opción "Template repository" activada
2. Cada proyecto nuevo: **Use this template** → Create new repository

### Opción 3: Manual (sin GitHub)

```powershell
# Clonar el template
Copy-Item -Recurse "C:\Users\lucas\Documents\Be Web\dev-template" "C:\mi-proyecto"
cd C:\mi-proyecto
Remove-Item -Recurse .git
git init
```

## Después de crear el proyecto

1. Si usaste el CLI, el archivo `.github/copilot-instructions.md` ya estará consolidado y listo.
2. Abrir en VS Code → Copilot ya te conoce.

## Personalización

- **Tu perfil**: Edita `global-profile.instructions.md` — se aplica a todo
- **Agregar stack**: Crea `nombre.instructions.md` en `.github/instructions/`
- **Proyecto específico**: Todo va en `copilot-instructions.md`
