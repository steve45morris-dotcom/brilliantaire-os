# NotebookLM MCP Readiness Setup Rerun Guide

Use this runbook to trigger all sandbox recheck loops sequentially after you finish editing `.env.local` to verify credentials safety and gate scores.

| Step | Command | Purpose | Expected Result | Pass Condition |
|---|---|---|---|---|
| 1 | `npm run notebooklm-mcp-auth -- "scan"` | Scan local files for GCP authorization profiles | Identify Google SA keys | Exit code 0 |
| 2 | `npm run notebooklm-mcp-auth -- "status"` | Report credential check states | Print profile details | Exit code 0 |
| 3 | `npm run notebooklm-mcp-harden -- "readiness-recheck"` | Re-audit codebase secrets safety | Scan repository files | Exit code 0 |
| 4 | `npm run notebooklm-mcp-readiness-gate -- "scan"` | Audit local configurations | Gate verification check | Exit code 0 |
| 5 | `npm run notebooklm-mcp-readiness-gate -- "decision"` | Compute gate score results | Final score decision | Exit code 0 |
| 6 | `npm run notebooklm-mcp-completion-review -- "env-check"` | Validate required variables mapping | Dynamic presence checklist | Exit code 0 |
| 7 | `npm run notebooklm-mcp-completion-review -- "review"` | Compile setup completion manual review | Readiness report generation | Exit code 0 |
| 8 | `npm run notebooklm-mcp-completion-review -- "eligibility"` | Check live adapter transition approval | Verify 90% score gates | Exit code 0 |
| 9 | `npm run notebooklm-mcp-fix-cycle -- "compare"` | Compare scores against prior runs | Track cleared blockers | Exit code 0 |
| 10 | `npm run notebooklm-mcp-fix-cycle -- "status"` | Print fix cycle checkpoint states | Dynamic CLI metrics logging | Exit code 0 |

> [!WARNING]
> **Safety Warning:** Ensure `ALLOW_LIVE_MCP_EXECUTION` is set to `false` in `config/notebooklm-mcp-readiness-gate.ts` before running these verification gates.
