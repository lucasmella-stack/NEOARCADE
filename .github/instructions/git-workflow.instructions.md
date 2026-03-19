# Git Workflow Instructions

> Se aplica al hacer commits, crear branches, PRs, y cualquier operación git.

## Conventional Commits (OBLIGATORIO)

```
<type>[scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Cuándo                                         |
| ---------- | ---------------------------------------------- |
| `feat`     | Nueva funcionalidad                            |
| `fix`      | Corrección de bug                              |
| `docs`     | Solo documentación                             |
| `style`    | Formato, punto y coma, etc. (no cambia lógica) |
| `refactor` | Reestructuración sin cambiar funcionalidad     |
| `perf`     | Mejora de rendimiento                          |
| `test`     | Agregar o corregir tests                       |
| `chore`    | Mantenimiento, deps, config                    |
| `ci`       | Cambios en CI/CD                               |

### Ejemplos

```bash
feat(auth): add Google OAuth login
fix(api): handle null response from external service
test(users): add edge case tests for email validation
refactor(dashboard): extract chart component
chore(deps): update next.js to 15.1
docs(readme): add deployment section
```

## Branch naming

```
feat/add-google-oauth
fix/null-response-handling
chore/update-dependencies
refactor/extract-chart-component
```

## Workflow

```bash
# 1. Crear branch desde main/develop
git checkout -b feat/feature-name

# 2. Hacer commits atómicos (1 cambio lógico por commit)
git add -p                    # Stage parcial — revisar lo que se agrega
git commit -m "feat: initial implementation"

# 3. Push y PR
git push -u origin feat/feature-name
# Crear PR con descripción clara

# 4. Después del merge, limpiar
git checkout main
git pull
git branch -d feat/feature-name
```

## PR Description template

```markdown
## Qué cambia

<!-- Descripción breve del cambio -->

## Por qué

<!-- Contexto y motivación -->

## Cómo testear

<!-- Pasos para verificar que funciona -->

## Screenshots (si aplica)

<!-- Capturas de UI -->
```

## Reglas

- NUNCA `git push --force` a main/develop
- NUNCA commits con "WIP", "fix", "asdf" — ser descriptivo
- Commits firmados cuando sea posible (`git commit -S`)
- `.gitignore` actualizado: `.env`, `node_modules`, `__pycache__`, `.next`, `dist`
