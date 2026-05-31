# 🔄 NOTEBOOKLM MCP SETUP FIX CYCLE SPECIFICATION

## 🌌 Purpose & Rationale
The **NotebookLM MCP Setup Fix Cycle** is a local sandbox correction loop designed to guide users through fixing configuration errors, environmental variables discrepancies, and path boundary leaks outside of the version-tracked Git tree.

This procedure follows any **Completion Review Failure** (e.g. when the system readiness score is below 90% or live eligibility is marked as **No**). 

---

## 🛡️ Critical Safety Policies (No-Secret Rule)
1. **Absolute Git Hygiene (No-Secret Rule):** Under no circumstances should real secret values, API keys, or GCP credentials be written inside the version-controlled repository files. 
2. **Local-Only Staging:** All configuration overrides must be staged strictly inside local-only, gitignored files (such as `.env.local`).
3. **Execution Block:** Live adapter execution remains strictly disabled (`ALLOW_LIVE_MCP_EXECUTION = false`) until the readiness recheck score successfully reaches **90%** or higher, and the live eligibility report generates a manual signoff approval signature.

---

## 📋 The Staging Correction Loop
The fix loop consists of repeating the correction, readiness, and completion review process until the NotebookLM MCP setup reaches live-adapter eligibility:

1. **Scan Gate**: Run readiness gate re-check to audit environment state.
2. **Verify Review**: Perform manual setup completion review to evaluate current integration status.
3. **Identify Blocker**: If score is < 90% or blockers remain, generate fix tasks list.
4. **Compare Score**: Run comparison to measure score improvements and track cleared blockers.
5. **Stage Corrections**: Execute steps in next-pass runbook sequentially in local sandbox.
6. **Stop Condition**: Stop loop only when setup reaches 90%+ readiness score, all blockers are cleared, and live adapter eligibility is approved.

---

## 📊 Score Comparison & Stop Condition
- **Score Delta:** Track progress by comparing current review score against previous readiness scores.
- **Stop Condition:** Stop the fix cycle only when the readiness score is `>= 90%` and no blockers remain.
- **Live Eligibility:** Once the score is `>= 90%`, the live adapter is eligible for safe testing.

---

## 🛠️ CLI Task Runner Commands

Run the fix cycle and checklist generators using standard workspace task commands:

| Task Command | Action | Output File Location |
| :--- | :--- | :--- |
| `npm run notebooklm-mcp-fix-cycle -- "tasks"` | Generates fix checklist with status | `outputs/notebooklm_bridge/mcp_fix_cycle/checklists/notebooklm_mcp_fix_tasks_YYYY-MM-DD.md` |
| `npm run notebooklm-mcp-fix-cycle -- "compare"` | Compares current score against previous | `outputs/notebooklm_bridge/mcp_fix_cycle/reports/notebooklm_mcp_readiness_comparison_YYYY-MM-DD.md` |
| `npm run notebooklm-mcp-fix-cycle -- "next-pass"` | Generates sequential manual runbook for next pass | `outputs/notebooklm_bridge/mcp_fix_cycle/reports/notebooklm_mcp_next_pass_YYYY-MM-DD.md` |
| `npm run notebooklm-mcp-fix-cycle -- "status"` | Logs status metrics directly to console | (stdout readout) |

---
*Authorized by Knowledge Librarian under One System Governance Protocol.*
