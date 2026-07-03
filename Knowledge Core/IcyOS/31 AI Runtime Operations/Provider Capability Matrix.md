# 🎨 Provider Capability Matrix: Release 0.2
`Status: Active` | `Scope: Provider Registry`

This matrix details the capability profiles assigned to registered provider adapters within `@icyos/ai`.

---

## 🗺️ Capability Alignment Ledger

| Provider ID | Target Profile | Execution Mode | Optimized Scope | Latency Class |
|---|---|---|---|---|
| **openai** | `fast`, `heavy` | Cloud API | Fast structured text outputs and summaries | Medium |
| **anthropic** | `reasoning`, `heavy` | Cloud API | Heavy planning analysis and logical queries | High |
| **gemini** | `fast`, `reasoning` | Cloud API | Multi-turn chat reasoning and fast lookups | Low |
| **ollama** | `local` | Offline Model | Private task parsing on local machine hardware | Medium |
| **mock** | `fast`, `reasoning`, `heavy`, `local` | Simulated | Instant local validation of client UI logic | Ultra-fast |

---

## ⚙️ Registry Resolution Rule
When a request demands a target capability (e.g. `reasoning`), the registry scans for active providers supporting that profile and orders them based on average latency history before launching execution cycles.

*I build before burning.*
