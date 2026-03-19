# Contribuir a NEOARCADE

¡Gracias por tu interés en contribuir! Estas son las guías para hacerlo de forma ordenada.

---

## Cómo reportar un bug

1. Revisá que no exista ya un [issue abierto](https://github.com/lucasmella-stack/NEOARCADE/issues) con el mismo problema.
2. Usá la plantilla de bug report al crear un issue nuevo.
3. Incluí: pasos para reproducir, comportamiento esperado vs actual, navegador/dispositivo, y screenshots si aplica.

## Cómo proponer una feature

1. Abrí un issue con la plantilla de feature request.
2. Describí el problema que resuelve y cómo te imaginás la solución.

---

## Desarrollo local

```bash
# Clonar y configurar
git clone https://github.com/lucasmella-stack/NEOARCADE.git
cd NEOARCADE
pnpm install
cp .env.example .env.local
pnpm dev
```

---

## Pull Requests

1. Creá un branch desde `main`:
   ```bash
   git checkout -b feat/mi-feature
   ```
2. Hacé tus cambios siguiendo las convenciones del proyecto.
3. Verificá que pase el typecheck y lint:
   ```bash
   pnpm typecheck
   pnpm lint
   ```
4. Hacé commits siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: agregar soporte para 4 jugadores
   fix: corregir fullscreen en iOS Safari
   chore: actualizar dependencias
   ```
5. Abrí un PR contra `main` con una descripción clara.

---

## Convenciones de código

- **TypeScript strict**: sin `any`, tipos explícitos
- **Server Components** por defecto (Next.js App Router)
- **Tailwind CSS 4** para estilos
- **pnpm** como gestor de paquetes (no npm ni yarn)

---

## Branches

| Prefijo | Uso |
|---|---|
| `feat/` | Nueva funcionalidad |
| `fix/` | Corrección de bug |
| `chore/` | Tareas de mantenimiento |

---

## ROMs

NEOARCADE no incluye ni distribuye ROMs. No subas ROMs ni links a ROMs en ningún PR o issue.
