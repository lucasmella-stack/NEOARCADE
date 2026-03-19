# React & Next.js Instructions

> Se aplica al escribir componentes React, pages, layouts, server actions.

## Reglas estrictas

- Server Components por defecto. Solo `"use client"` cuando necesites hooks o eventos
- `import { useState, useEffect } from "react"` — NUNCA `import React`
- NUNCA `useMemo` ni `useCallback` — React Compiler los optimiza
- Tipos como const objects:
  ```typescript
  const Status = { Active: "active", Inactive: "inactive" } as const;
  type Status = (typeof Status)[keyof typeof Status];
  ```
- NUNCA `type Status = "active" | "inactive"`
- Interfaces: máximo 1 nivel de profundidad. Objetos anidados → interfaz dedicada
- Styling: `cn()` para mergear clases, `style={{}}` para valores dinámicos
- NUNCA `var()` en className, NUNCA hex colors en Tailwind

## Estructura de archivos

```
app/
├── (feature)/
│   ├── page.tsx              ← Server Component
│   ├── layout.tsx
│   ├── actions.ts            ← Server Actions
│   ├── components/           ← Client Components del feature
│   └── types.ts              ← Tipos locales
├── api/                      ← API routes (BFF)
components/
├── ui/                       ← shadcn/ui components
├── shared/                   ← Componentes usados 2+ veces
hooks/                        ← Custom hooks compartidos
lib/                          ← Utilidades compartidas
types/                        ← Tipos globales
```

## Patrones

### Data fetching

```typescript
// En Server Component - fetch directo
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 3600 }, // ISR
});

// En Client Component - SWR/React Query
const { data, error, isLoading } = useSWR("/api/data", fetcher);
```

### Forms

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

type FormData = z.infer<typeof schema>;
```

## Testing (SIEMPRE incluir)

Para cada componente nuevo, sugerir test:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("ComponentName", () => {
  it("renders correctly", () => {
    render(<ComponentName />);
    expect(screen.getByText("expected")).toBeInTheDocument();
  });
});
```
