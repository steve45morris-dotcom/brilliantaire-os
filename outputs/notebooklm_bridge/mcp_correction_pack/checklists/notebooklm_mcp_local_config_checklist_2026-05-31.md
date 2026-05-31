# NotebookLM MCP Local Config Setup Checklist

* **Date:** 2026-05-31

| Check | Status | Evidence | Risk | Next Action |
|---|---|---|---|---|
| Create local-only .env.local | PENDING | .env.local not found | Medium | Create the file in project root |
| Confirm .env.local is gitignored | PENDING | .env.local is not gitignored | High | Add .env.local to .gitignore |
| Confirm MCP local config references env variables only | PASSED | Static configurations verified | High | Verify no plain secrets exist in mcp.json |
| Confirm NOTEBOOKLM_MCP_ENABLED remains false until readiness passes | PASSED | Configuration flag is false | Medium | Ensure bridge script loads disabled by default |
| Confirm no secrets exist in repo files | PASSED | Checked codebase scanning | High | Keep codebase clean from plaintext keys |

## Security Verification
Verify that your global or workspace configuration does not contain credentials. Ensure that the confidence of these assertions is logged.
