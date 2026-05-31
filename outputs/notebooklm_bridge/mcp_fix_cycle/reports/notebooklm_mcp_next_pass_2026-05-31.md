# NotebookLM MCP Next Pass Runbook

- **Date:** 2026-05-31

| Step | Manual Action | Command To Rerun | Expected Result | Stop Condition |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Map missing env variables in local override file | Define expected keys (e.g. NOTEBOOKLM_MCP_ENABLED) inside `.env.local` | Keys are successfully parsed | All 6 env vars detected |
| 2 | Confirm .env.local is properly gitignored | Verify `.env.local` is in `.gitignore` | File is ignored | git check-ignore returns file path |
| 3 | Configure Claude/Cursor MCP client settings | Add sidecar connector block to local configuration path | 'notebooklm-mcp' detected | Client setup matches command |
| 4 | Run local readiness gate validation re-check | `npm run notebooklm-mcp-readiness-gate -- scan` | Readiness score increases | Readiness Score is >= 90% |
| 5 | Compile setup manual review check | `npm run notebooklm-mcp-completion-review -- review` | Setup Completion Review report is created | Review Score reaches >= 90% |
| 6 | Check fix cycle status and compare progress | `npm run notebooklm-mcp-fix-cycle -- status` | Progress metrics printed | Live eligibility is confirmed |

> [!WARNING]
> **Safety Note:** DO NOT enable live execution. The toggle ALLOW_LIVE_MCP_EXECUTION must remain set to false in config/notebooklm-mcp-readiness-gate.ts to prevent any external API queries, OAuth launch, or secret exposure in production/CI environments.
