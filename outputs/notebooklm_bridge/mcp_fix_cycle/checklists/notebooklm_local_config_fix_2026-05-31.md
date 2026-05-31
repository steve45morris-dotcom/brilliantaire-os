# NotebookLM MCP Local Config Fix Checklist

* **Date:** 2026-05-31

| Check | Required State | Evidence | Risk Note | Manual Action Required |
|---|---|---|---|---|
| `.env.local File existence` | Must exist locally only in project root | 🔴 MISSING | Medium | Create `.env.local` file in root directory |
| `Gitignore rules checklist` | `.env.local` must be listed in `.gitignore` | 🟢 GITIGNORED | Critical | Append `.env.local` line to `.gitignore` |
| `No secrets in repository files` | Codebase must be clean of GCP/NotebookLM secrets | 🟢 CLEAN | Critical | Ensure no project keys are committed inside scripts |
| `MCP Configuration env references` | Configurations must map dynamically to env vars | 🟢 MAPPED | High | Verify config files do not use static credential values |
| `Live execution status` | `ALLOW_LIVE_MCP_EXECUTION` must be false | 🟢 LOCKED | High | Maintain safety gate toggle flag as false |

## 🔒 Configuration Hardening
Always verify that your MCP configuration templates are isolated and never leak credentials.
