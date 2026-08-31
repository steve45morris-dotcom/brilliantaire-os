# 🛡️ SENTINEL SAFETY GATE & KNOWLEDGE ROUTER SPECIFICATION

## 🌌 Overview & Mandate
To maintain architectural separation, secure execution boundaries, and absolute privacy safeguards in the One System ecosystem. The Sentinel Safety Gate acts as a validation proxy between untrusted execution domains (such as public tunnels, voice transcription buffers, or unverified external knowledge feeds) and the core control plane.

---

## 🔒 Safety Assertions
1. **Public Tunnel Lockdown:** All public tunneling processes default to disabled. Manual user confirmation via UI or CLI is mandatory for session start. No automated script can initiate a session bypass.
2. **Voice Control Air-gap:** Voice commands are restricted to L0 and L1 levels of risk (read-only diagnostic requests or local reports). Voice dispatcher cannot start tunnels, execute high-risk operations, or modify credentials.
3. **Knowledge Ingestion Quarantine:** Direct database writes, YouTube scrapers, Obsidian vault modifications, NotebookLM sidecar API executions, Higgsfield AI API calls, and Local Inference autonomous calls are locked. Intake resources must be staged in dedicated folders with human review gates.
4. **Collision Protection (CIP):** Any namespace or path collision between local agent skills and global configuration assets triggers a validation failure, halting bootstrap routines until resolved.

---

## 📋 System Risk Matrix

| Risk Level | Target Classification | Allowed Auto-execution | Confirmation Gate | System Impact |
| :--- | :--- | :---: | :---: | :--- |
| **L0** | Status checks, read-only queries, command help displays | 🟢 YES | 🟢 NONE | Pure diagnostic readouts with zero write access. |
| **L1** | Local report compilation, linting checks, status synchronization | 🟢 YES | 🟢 NONE | Compiles read-only files to disk. |
| **L2** | Local staging, manual file creation, ingestion buffering | 🔴 NO | 🔴 USER | Updates local cache or staging directories. |
| **L3** | Port exposure, tunnel activations, Obsidian vault writes, MCP sidecar syncs | 🔴 NO | 🔴 CRITICAL | Interacts with external APIs or changes live vault files. |
| **L4** | Credential management, environment modifications, destructive operations | 🔴 NO | 🔴 MAXIMUM | Destructive commands, secret changes, or wide network access. |

---

## 🛠️ CLI Task Toolchain

Execute the safety gates and routers from the terminal using the standard workspace task runners:

| Command | Action | Output Artifact |
| :--- | :--- | :--- |
| `npm run sentinel:safety` | Validates configuration flags & CIP checks | `reports/sentinel_safety/sentinel_safety_gate_*.md` |
| `npm run sentinel:tunnel-log` | Appends tunnel sessions and authorization records | `reports/tunnel_sessions/tunnel_session_log_*.md` |
| `npm run sentinel:voice-risk` | Generates risk level parameters mapping report | `reports/voice_dispatch/voice_risk_registry.md` |
| `npm run sentinel:knowledge-router` | Allocates directories and logs staging boundaries | `reports/knowledge_intake/knowledge_intake_router_status_*.md` |
| `npm run sentinel:safety-report` | Aggregates all safety sub-logs into a unified brief | `reports/sentinel_safety/sentinel_safety_summary_*.md` |

---
*Authorized by Chief Systems Architect under One System Governance Protocol.*
