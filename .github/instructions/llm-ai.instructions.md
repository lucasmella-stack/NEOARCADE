# LLM & AI Development Instructions

> Se aplica al trabajar con modelos de lenguaje, fine-tuning, inference, AI SDKs.

## Hugging Face

### Cargar modelos

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import torch

def load_model(
    model_id: str,
    quantize: bool = False,
    device: str = "auto",
) -> tuple[AutoModelForCausalLM, AutoTokenizer]:
    """Load HF model with optional quantization."""
    kwargs = {"device_map": device, "torch_dtype": torch.bfloat16}

    if quantize:
        kwargs["quantization_config"] = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_quant_type="nf4",
        )

    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id, **kwargs)
    return model, tokenizer
```

### Fine-tuning con LoRA

```python
from peft import LoraConfig, get_peft_model

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    task_type="CAUSAL_LM",
)

model = get_peft_model(base_model, lora_config)
model.print_trainable_parameters()
```

## OpenAI SDK pattern

```typescript
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateResponse(prompt: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
  });
  return completion.choices[0].message.content ?? "";
}
```

## Reglas para AI/LLM

- SIEMPRE manejar rate limits con retry exponencial
- Mensajes de sistema claros y concisos
- Temperature: 0 para tareas deterministas, 0.7 para creativas
- Streaming para respuestas largas (mejor UX)
- Guardar prompts como templates versionados, no hardcoded
- Logging de tokens consumidos para control de costes
- Validar outputs del modelo con Zod/Pydantic antes de usar
- NUNCA enviar datos sensibles al modelo (PII, secrets)

## Docker para GPU (Hetzner)

```dockerfile
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

RUN pip install torch transformers accelerate bitsandbytes

COPY . /app
WORKDIR /app

CMD ["python", "serve.py"]
```

```yaml
# docker-compose.gpu.yml
services:
  inference:
    build: .
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]
    ports: ["8000:8000"]
    volumes:
      - model-cache:/root/.cache/huggingface
volumes:
  model-cache:
```
