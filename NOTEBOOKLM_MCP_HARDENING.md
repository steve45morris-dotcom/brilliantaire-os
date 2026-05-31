# 🔒 NotebookLM MCP Connector Hardening (Phase 11F)

This document outlines the safety architecture, offline templates, configuration schemas, and scanning utilities designed to prepare and secure the environment prior to launching NotebookLM MCP integration.

## 🎯 Purpose
The configuration hardening layer establishes a secure interface pattern for NotebookLM MCP without generating active secret values, running OAuth, contacting external endpoints, or auto-modifying global configurations.

## 🛡️ Decoupled Configuration & Hardening Principles

1. **Why Hardening Follows Auth Validation:**
   Authorization validation (Phase 11E) checks for the existence of expected environmental variable keys. Configuration Hardening (Phase 11F) constructs clean, staged template profiles and scans the local codebase to guarantee no plaintext credentials have leaked or been hardcoded.

2. **No-Real-Secrets Rule:**
   No real secrets or active keys are allowed inside version control. All generated templates must utilize placeholder tags or environment variable mapping symbols.

3. **Staged Configuration Workflow:**
   Configuration templates are generated exclusively inside `outputs/notebooklm_bridge/mcp_hardening/staged_config/`. This directory is intended to be inspected by humans.

4. **Manual Copy Boundary:**
   The OS never auto-writes configuration objects into live Claude, Cursor, or global environment paths. The final migration of parameters must be executed manually by a human operator under strict privilege verification.

5. **Secret Hygiene Scan:**
   Scans workspace text files to identify any high-entropy strings, potential credentials, or hardcoded GCloud API keys.

6. **Readiness Recheck:**
   Merges previous authentication validation flags with the presence of staged files to verify compliance prior to final authorization signoff.

---

## 💻 Available Commands

You can run these tasks safely via the Safe Command Router:

* View hardening help menu:
  ```bash
  npm run command -- "notebooklm-mcp-harden-help"
  ```
* Generate the staged environment variable template:
  ```bash
  npm run command -- "notebooklm-mcp-harden create-env-template"
  ```
* Generate the staged MCP connector json template:
  ```bash
  npm run command -- "notebooklm-mcp-harden create-mcp-template"
  ```
* Run the secret hygiene sweep:
  ```bash
  npm run command -- "notebooklm-mcp-harden secret-hygiene"
  ```
* Run the readiness reconciliation check:
  ```bash
  npm run command -- "notebooklm-mcp-harden readiness-recheck"
  ```
* Print overall hardening and status summary:
  ```bash
  npm run command -- "notebooklm-mcp-harden status"
  ```

---

## 🚀 Future Live Adapter Boundary
Live execution capability remains disabled (`ALLOW_LIVE_MCP_EXECUTION = false`). Transitioning to active queries is contingent on a successful 100% readiness score, clean secret hygiene report, and manual operator authorization.
