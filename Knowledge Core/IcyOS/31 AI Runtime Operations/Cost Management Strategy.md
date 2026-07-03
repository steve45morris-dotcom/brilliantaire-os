# 💰 Cost Management Strategy: Release 0.2
`Status: Active` | `Scope: Operations & Finance`

This document defines cost ceilings, monitoring thresholds, and optimization strategies for running large language models in IcyOS.

---

## 🚦 Budget Ceiling Rules
- **Daily Budget Ceiling**: $2.00 per active test account.
- **Max Tokens Per Request**: 4,000 tokens for `fast`/`local` profiles; 16,000 tokens for `heavy` profiles.
- **Failover Cutoff**: Failover loops will cease trying alternative cloud provider routes if the cumulative query cost exceeds `cost_target` (default: 10 cents).

---

## ⚡ Cost Optimization Guidelines
1. **Deterministic Local Parsing First**: Always evaluate simple structured command patterns inside the Decision Engine to resolve queries locally without sending API request tokens.
2. **Local LLM Priority**: Route local tasks to the **Ollama** provider adapter when offline synchronization is active or local computation is sufficient, bypassing paid API endpoints.
3. **Prompt Compression**: Keep system prompts concise and strip redundant whitespace before sending payload queries.

*I build before burning.*
