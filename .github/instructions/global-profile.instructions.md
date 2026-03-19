# Lucas — Global AI Coding Instructions

> Este archivo se aplica a TODOS tus proyectos en VS Code.
> Es tu "personalidad de desarrollo" que cualquier modelo (Copilot, Claude, Gemini) hereda.
> Los archivos `.github/copilot-instructions.md` de cada proyecto AÑADEN contexto específico encima de esto.

---

## Sobre mí

- **Rol**: Frontend developer, fullstack JS/TS, ML/LLM engineer
- **Stack principal**: React/Next.js, Node.js, Python, Docker
- **Infra**: Hetzner, GitHub, Hugging Face
- **Testing**: Vitest (JS/TS), pytest (Python)
- **Package managers**: pnpm (JS), uv/pip (Python)
- **OS**: Windows (PowerShell como terminal principal)

---

## Cómo quiero que el agente trabaje

### Estilo de código

- Código LIMPIO: funciones pequeñas, nombres descriptivos, single responsibility
- TypeScript estricto: nunca `any`, siempre tipos explícitos
- Python: siempre type hints, docstrings Google style
- Prefiere composición sobre herencia
- DRY pero no a costa de la claridad — duplicar es OK si simplifica la lectura
- Comentarios: solo PARA QUÉ, nunca QUÉ (el código debe ser auto-explicativo)

### Respuestas del agente

- Responde en español cuando te hable en español, inglés cuando sea en inglés
- Código y nombres de variables/funciones SIEMPRE en inglés
- Sé directo, sin rodeos. No expliques lo obvio
- Si hay múltiples formas, elige la más moderna/idiomática y justifica brevemente
- Cuando corrijas un error, explica la CAUSA raíz, no solo el fix
- Incluye edge cases y error handling siempre

### Arquitectura

- Feature-based folder structure (no agrupar por tipo)
- Separar lógica de negocio de la presentación
- Server Components por defecto en Next.js, "use client" solo cuando sea necesario
- API routes para BFF (Backend for Frontend) pattern
- Env vars: nunca hardcoded, siempre `.env` o secrets

### Testing (ÁREA DE MEJORA — FORZAR)

- SIEMPRE sugiere tests cuando creo código nuevo
- Mínimo: 1 test happy path + 1 test de error/edge case
- JS/TS: Vitest + Testing Library para componentes
- Python: pytest con fixtures
- E2E: Playwright con Page Object Model
- Si creo una función, sugiere el test. Si creo un componente, sugiere el test

### Git workflow

- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- Commits atómicos: un cambio lógico por commit
- Branch naming: `feat/descripcion`, `fix/descripcion`, `chore/descripcion`
- PR description: qué cambia, por qué, cómo testear

### Performance

- Lazy loading de componentes pesados
- Optimización de imágenes (next/image, WebP, responsive)
- Bundle analysis cuando agregue dependencias grandes
- Caching strategies (ISR, SWR, React Query)
- Python: async cuando sea I/O bound, multiprocessing cuando sea CPU bound

### Seguridad

- Input validation siempre (Zod en TS, Pydantic en Python)
- Sanitizar outputs (XSS)
- CORS explícito, nunca wildcard en producción
- Secrets: nunca en código, siempre variables de entorno
- Deps: alertar si una dependencia tiene vulnerabilidades conocidas

---

## Stack técnico detallado

### Frontend

```
Framework:    Next.js 14/15 (App Router)
UI:           React 19, Tailwind CSS 4, shadcn/ui
State:        Zustand, React Server Components
Forms:        React Hook Form + Zod
Testing:      Vitest + Testing Library + Playwright
Styling:      Tailwind + cn() utility, NUNCA CSS-in-JS
```

### Backend

```
Runtime:      Node.js (Express/Fastify) o Python (FastAPI/Django)
ORM:          Drizzle (Node) o SQLAlchemy/Django ORM (Python)
Auth:         NextAuth.js / JWT
Queue:        Bull (Node) o Celery (Python)
DB:           PostgreSQL, Redis
```

### AI / ML / LLMs

```
Training:     Python, PyTorch, Hugging Face Transformers
Inference:    ONNX, vLLM, TGI
APIs:         OpenAI SDK, LangChain
Fine-tuning:  LoRA/QLoRA, PEFT
Deployment:   Docker + Hetzner GPU
```

### DevOps

```
Containers:   Docker, Docker Compose
CI/CD:        GitHub Actions
Hosting:      Hetzner (VPS + dedicated)
Registry:     GitHub Container Registry
Monitoring:   Sentry, Prometheus + Grafana (básico)
```

---

## Patrones que uso frecuentemente

### Next.js App Router

```typescript
// Server Component (default)
export default async function Page() {
  const data = await getData();
  return <ClientComponent data={data} />;
}

// Server Action
"use server";
export async function createItem(formData: FormData) {
  const validated = schema.parse(Object.fromEntries(formData));
  await db.item.create({ data: validated });
  revalidatePath("/items");
}
```

### Vitest

```typescript
import { describe, it, expect, vi } from "vitest";

describe("functionName", () => {
  it("should handle happy path", () => {
    expect(fn(input)).toBe(expected);
  });

  it("should throw on invalid input", () => {
    expect(() => fn(null)).toThrow();
  });
});
```

### Python con type hints

```python
from typing import TypeVar, Generic
from pydantic import BaseModel

class APIResponse(BaseModel, Generic[T := TypeVar("T")]):
    """Standard API response wrapper."""
    data: T
    success: bool = True
    message: str = ""
```

---

## Anti-patterns (NUNCA hacer)

- `any` en TypeScript
- `import React` (usar named imports)
- `useMemo`/`useCallback` innecesarios (React Compiler lo maneja)
- CSS-in-JS (usar Tailwind)
- `var` en JavaScript (usar `const`/`let`)
- Funciones de más de 50 líneas
- Archivos de más de 300 líneas
- `console.log` en producción (usar logger)
- Secrets en código fuente
- Tests que dependen del orden de ejecución
