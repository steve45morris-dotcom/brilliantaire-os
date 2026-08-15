# ADR 008: Centralized ModelRouter Gateway

- **Status:** APPROVED
- **Date:** 2026-07-15
- **Author:** Lead Platform Engineer

## Context
Directly calling specific AI providers inside feature modules couples the code to provider-specific SDKs, making it hard to rotate API models, handle rate limits, adjust safety parameters, or implement global retries and timeouts.

## Decision
Route all AI requests through a single canonical `ModelRouter` gateway. The gateway handles provider abstraction (OpenAI, Gemini, Anthropic), timeouts, automatic retry backoffs, token telemetry, and central markdown logging.

## Consequences
- Decouples business logic from specific AI provider SDKs.
- Simplifies debugging and audit logging of AI requests.
- Prompts are loaded dynamically from a centralized template registry.
