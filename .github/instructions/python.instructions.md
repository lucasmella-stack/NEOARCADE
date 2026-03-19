# Python Instructions

> Se aplica al escribir código Python: scripts, APIs, ML pipelines, CLI tools.

## Reglas estrictas

- Type hints SIEMPRE en funciones públicas y parámetros
- Docstrings Google style en clases y funciones públicas
- PEP 8: líneas ≤ 88 chars (black default)
- Import order: stdlib → third-party → local (isort lo aplica)
- `pathlib.Path` en vez de `os.path`
- f-strings en vez de `.format()` o `%`
- `dataclasses` o `Pydantic` para data containers, NUNCA dicts raw
- `async/await` para I/O bound, `multiprocessing` para CPU bound

## Estructura tipo

```
project/
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py            ← Pydantic Settings
│   ├── models/              ← Pydantic/dataclass models
│   ├── services/            ← Business logic
│   ├── api/                 ← FastAPI routes
│   └── utils/               ← Helpers
├── tests/
│   ├── conftest.py          ← Fixtures globales
│   ├── test_services/
│   └── test_api/
├── pyproject.toml
└── Dockerfile
```

## Patrones

### Pydantic config

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from env vars."""
    database_url: str
    api_key: str
    debug: bool = False

    model_config = ConfigDict(env_file=".env")
```

### FastAPI pattern

```python
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/items", tags=["items"])

@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str, db: Session = Depends(get_db)) -> ItemResponse:
    """Get item by ID."""
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

## Testing (SIEMPRE incluir)

```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.fixture
def sample_item():
    return Item(id="123", name="test")

class TestGetItem:
    async def test_happy_path(self, client, sample_item):
        response = await client.get(f"/items/{sample_item.id}")
        assert response.status_code == 200

    async def test_not_found(self, client):
        response = await client.get("/items/nonexistent")
        assert response.status_code == 404
```

## LLM/ML específico

```python
# Hugging Face pattern
from transformers import AutoModelForCausalLM, AutoTokenizer

def load_model(model_id: str, device: str = "cuda"):
    """Load a Hugging Face model with proper device mapping."""
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        device_map=device,
        torch_dtype="auto",
    )
    return model, tokenizer
```
