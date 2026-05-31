# NotebookLM MCP Readiness Verification Rerun Sequence

* **Date:** 2026-05-31

| Step | Command | Purpose | Expected Result | Pass Condition |
|---|---|---|---|---|
| Step 1 | `npm run notebooklm-mcp-auth -- "scan"` | Scan for local Google GCP authorization keys | Scans local files outside repo | `Exit code 0` |
| Step 2 | `npm run notebooklm-mcp-auth -- "status"` | Report GID authorization profiles check status | Identifies local credentials configuration | `Exit code 0` |
| Step 3 | `npm run notebooklm-mcp-harden -- "readiness-recheck"` | Recheck codebase secrets hygiene compliance | Assesses sandbox secret leaks | `Exit code 0` |
| Step 4 | `npm run notebooklm-mcp-readiness-gate -- "scan"` | Execute primary readiness gate validator scan | Verifies basic sandbox compliance | `Exit code 0` |
| Step 5 | `npm run notebooklm-mcp-readiness-gate -- "decision"` | Outputs MCP server activation score metrics | Calculates gate readiness checks | `Exit code 0` |
| Step 6 | `npm run notebooklm-mcp-completion-review -- "env-check"` | Assert required variables presence locally | Verifies required key maps | `Exit code 0` |
| Step 7 | `npm run notebooklm-mcp-completion-review -- "review"` | Generate setup completion review report | Updates setup completion logs | `Exit code 0` |
| Step 8 | `npm run notebooklm-mcp-completion-review -- "eligibility"` | Verify live adapter integration eligibility status | Checks 90% score gates | `Exit code 0` |
| Step 9 | `npm run notebooklm-mcp-completion-review -- "status"` | Logs overall status metrics to CLI console | Status summary report compiled | `Exit code 0` |

## 🚀 Execution Instructions
Execute these commands sequentially. Each step must return an exit status code of `0` to qualify the local workspace for live NotebookLM MCP adapter eligibility.
