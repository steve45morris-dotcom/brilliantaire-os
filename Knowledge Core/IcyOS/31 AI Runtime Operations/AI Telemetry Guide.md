# 📊 AI Telemetry Guide: Release 0.2
`Status: Active` | `Scope: Telemetry & Monitoring`

This document outlines the telemetry fields tracked, cost calculations, and analytics integration steps for the IcyOS AI Runtime.

---

## 📋 Tracked Telemetry Fields
Every AI request executed by `AiRuntime` generates a structured telemetry object containing:

- `request_id`: Unique identifier matching decision logs.
- `provider`: Resolved provider identifier (`openai`, `anthropic`, `gemini`, `ollama`, `mock`).
- `capability`: Target profile profile (`fast`, `reasoning`, `heavy`, `local`).
- `latency_ms`: Duration of provider execution.
- `prompt_tokens`: Evaluated token usage count for query prompts.
- `completion_tokens`: Evaluated token usage count for completions response.
- `estimated_cost_usd`: Computed dollar cost based on model token rates.
- `fallback_event`: Flag indicating failover fallback occurred during routing.

---

## 💰 Cost Estimation Models
Pricing metrics are computed using base dollar rates per 1 million tokens:

- **OpenAI**: $2.50 prompt / $10.00 completion.
- **Anthropic**: $3.00 prompt / $15.00 completion.
- **Gemini**: $0.075 prompt / $0.30 completion.
- **Ollama / Local**: $0.00 prompt / $0.00 completion.

*I build before burning.*
