# 🗃️ Provider Registry: Release 0.2
`Status: Active` | `Version: 1.0.0`

This document details the configuration, discovery mechanisms, and failover behavior of the provider registry in `@icyos/ai`.

---

## 🛠️ Registered Adapters
The registry is initialized inside `AiRuntime` and dynamically discovery-enables model adapters:

1. **OpenAI Provider (`openai`)**
   - **Capability Profiles**: `fast`, `heavy`
   - **Availability Check**: Verifies `process.env.OPENAI_API_KEY`.
2. **Anthropic Provider (`anthropic`)**
   - **Capability Profiles**: `reasoning`, `heavy`
   - **Availability Check**: Verifies `process.env.ANTHROPIC_API_KEY`.
3. **Gemini Provider (`gemini`)**
   - **Capability Profiles**: `fast`, `reasoning`
   - **Availability Check**: Verifies `process.env.GEMINI_API_KEY`.
4. **Ollama Provider (`ollama`)**
   - **Capability Profiles**: `local`
   - **Availability Check**: Active localhost port connection validation.
5. **Mock Provider (`mock`)**
   - **Capability Profiles**: `fast`, `reasoning`, `heavy`, `local`
   - **Availability Check**: Always `true`. Used as offline default.

---

## ⚡ Failover Fallback Logic
When a client triggers a capability profile request:
1. The registry resolves a priority-ordered list of active, enabled candidate providers.
2. The runtime iterates execution loops down the candidate chain.
3. If an execution errors or overruns its latency budget, the registry increments fallback counters and fails over to the next candidate provider.

*I build before burning.*
