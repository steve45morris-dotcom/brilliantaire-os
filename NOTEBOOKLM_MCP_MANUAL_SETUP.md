# 📖 NotebookLM MCP Manual Setup Instructions (Phase 11G)

This document establishes the safety guidelines, manual configuration boundaries, and rollback procedures required to integrate NotebookLM MCP safely into the host operating system without committing credentials, running live OAuth flows, or automated file writes.

## 🎯 Purpose
Manual Setup instructions decouple credential input from version control, requiring the human operator to manually verify environment variables and configuration sidecars outside the repository boundaries.

## 🛡️ Decoupled Configuration & Setup Rules

1. **Why Manual Setup Follows Hardening:**
   Configuration Hardening (Phase 11F) scans the codebase and provides secure templates. Manual Setup (Phase 11G) instructs the operator on how to deploy those template models onto the host system securely, avoiding hardcoded secrets or auto-modification errors.

2. **No-Secret Rule:**
   No plaintext API keys, Cloud Service Account files, or Client Secrets must ever be written or committed to code repositories.

3. **Local-Only `.env.local` Boundary:**
   Real variable definitions must live in `.env.local` which is permanently excluded via `.gitignore`. 

4. **MCP Config Copy Boundary:**
   The OS never auto-writes configuration objects into live Claude, Cursor, or global environment paths. The final migration of parameters must be executed manually by a human operator under strict privilege verification.

5. **Readiness Rerun Flow:**
   A sequence of validation runs verify if the newly configured variables and client sidecars are functional.

6. **Rollback Flow:**
   A deactivation script runbook removes variables and sidecar definitions to restore the repository back to a zero-credentials offline baseline.

---

## 💻 Available Commands

You can run these tasks safely via the Safe Command Router:

* View manual setup help menu:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide-help"
  ```
* Compile the manual setup runbook:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide runbook"
  ```
* Compile the `.env.local` instructions document:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide env-instructions"
  ```
* Compile the client config copy guide:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide config-copy"
  ```
* Compile the readiness rerun check guide:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide readiness-rerun"
  ```
* Compile the deactivation rollback plan:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide rollback"
  ```
* Generate all four setup documents at once:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide all"
  ```
* Print overall setup status summary:
  ```bash
  npm run command -- "notebooklm-mcp-setup-guide status"
  ```

---

## 🚀 Live Integration Decoupled Boundary
Live execution capability remains disabled (`ALLOW_LIVE_MCP_EXECUTION = false`). Live integration may only be considered after achieving 100% on the readiness checks, verifying a zero-findings secret hygiene report, and completing manual client sidecar verification tests.
