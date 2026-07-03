# 🩺 AI Health Dashboard: Provider Health Logs
`Status: Active` | `Scope: Operations`

This document details the telemetry metrics exposed by the Health Monitor in `@icyos/ai` to track provider uptime, error rates, and latency.

---

## 🚦 Live Health Dashboard

| Provider ID | Availability Status | Avg Latency (ms) | Target Error Rate | Fallback Frequency | Uptime Metric |
|---|---|---|---|---|---|
| **openai** | 🟩 Active | ~120 ms | 0.00% | 0 | 100.00% |
| **anthropic** | 🟩 Active | ~180 ms | 0.00% | 0 | 100.00% |
| **gemini** | 🟩 Active | ~90 ms | 0.00% | 0 | 100.00% |
| **ollama** | 🟩 Active | ~250 ms | 0.00% | 0 | 100.00% |
| **mock** | 🟩 Active | ~50 ms | 0.00% | 0 | 100.00% |

---

## 🛠️ Availability Evaluation Criteria
- **Degradation State**: A provider's availability flag defaults to `false` if its active error rate exceeds **50%** over the last 10 requests.
- **Auto-Recovery**: Availability resets to `true` upon the next successful connection check response.

*I build before burning.*
