# Testing Instructions

> Se aplica cuando se escriben tests o cuando se crea código nuevo (SIEMPRE sugerir test).

## Regla de oro

**Cada función/componente nuevo DEBE tener al menos:**

1. Un test de happy path
2. Un test de error/edge case

## Vitest (JS/TS)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de módulos
vi.mock("@/lib/api", () => ({
  fetchData: vi.fn(),
}));

describe("featureName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return data on success", async () => {
    const result = await featureName("valid-input");
    expect(result).toEqual({ id: "1", name: "test" });
  });

  it("should throw on invalid input", () => {
    expect(() => featureName("")).toThrow("Input required");
  });

  it("should handle null gracefully", () => {
    expect(featureName(null)).toBeNull();
  });
});
```

### Component testing

```typescript
import { render, screen, fireEvent } from "@testing-library/react";

describe("Button", () => {
  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when loading", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

## pytest (Python)

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.fixture
def mock_db():
    """Provide a mock database session."""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    return db

class TestCreateUser:
    def test_creates_user_successfully(self, mock_db):
        result = create_user(mock_db, name="Lucas", email="l@test.com")
        assert result.name == "Lucas"
        mock_db.add.assert_called_once()

    def test_raises_on_duplicate_email(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = existing
        with pytest.raises(ValueError, match="already exists"):
            create_user(mock_db, name="Lucas", email="existing@test.com")

    @pytest.mark.parametrize("email", ["", "invalid", "@no-domain"])
    def test_rejects_invalid_email(self, mock_db, email):
        with pytest.raises(ValueError):
            create_user(mock_db, name="Lucas", email=email)
```

## Playwright (E2E)

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "user@test.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "wrong@test.com");
    await page.fill('[name="password"]', "wrong");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });
});
```

## Cuándo testear qué

| Tipo de código   | Framework                | Qué testear                       |
| ---------------- | ------------------------ | --------------------------------- |
| Utility function | Vitest/pytest            | Input/output, edge cases          |
| React component  | Vitest + Testing Library | Render, interacción, estados      |
| API route        | Vitest/pytest            | Status codes, response body, auth |
| Server action    | Vitest                   | Validation, side effects          |
| Full user flow   | Playwright               | Login, CRUD, navigation           |
