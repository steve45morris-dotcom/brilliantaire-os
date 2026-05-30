# 🛰️ Controlled Background Automation (Phase 8B)

This document specifies the design, security controls, and scheduling rules for the **Controlled Background Automation** in **Brilliantaire OS**.

---

## 1. Purpose

The **Background Automation** layer enables periodic and scheduled checks using local process triggers (e.g. `cron` or `launchd`). It is structured as a decoupled controller that calls the `automation-runner` to run pre-approved checks sequentially.

---

## 2. Safety Design & Double Lock Mechanism

To protect user sovereignty, the background automation system employs a strict double-lock mechanism:
1. **Global Disabled Default:** The system configuration toggle `ENABLE_BACKGROUND_AUTOMATION` defaults to `false`. When locked, *no* background executions are allowed to run.
2. **Routine Disable Default:** Every available schedule (morning, afternoon, evening) is disabled by default (`enabled: false`).
3. **Dry-Run Default:** Global dry-run is enabled by default (`DRY_RUN_DEFAULT = true`).
4. **Router and Confirmation Gates:** Execution requires both the explicit `--confirm` CLI flag and exact-name matching.

---

## 3. Operations & Safety Rules

* **No External Connections:** The layer runs completely offline. No analytics trackers or telemetry reporting are sent over external networks.
* **No Social Auto-Posting:** Social media API connections are hard-blocked to avoid unintended publication errors.
* **No Destructive Commands:** Destructive script commands (e.g., file deletes, log clear routines) are blocked.
* **Router Gateway Mandate:** All commands invoke the Safe Command Router under the hood. No tasks bypass routing checks.

---

## 4. Execution Commands

* **Print Available Schedules Manual:**
  ```bash
  npm run background-help
  ```
* **Simulate Schedule Dry Run:**
  ```bash
  npm run background-dry-run -- "morning-daily-check"
  ```
* **Execute Live Schedule Routine (Blocked if config is locked):**
  ```bash
  npm run background-run -- "morning-daily-check" --confirm
  ```
* **Check Diagnostics Status Matrix:**
  ```bash
  npm run background-status
  ```

---

## 5. Cron / Launchd Integration Examples

To integrate with system scheduling, configure cron or launchd to call the Safe Command Router:
* **Cron Example:**
  ```text
  0 9 * * * cd /path/to/brilliantaire-os && npm run command -- "background-run morning-daily-check" --confirm
  ```
* **Launchd Configuration:** Create a plist file calling `/usr/local/bin/npm` with the argument structure `run command -- "background-run morning-daily-check" --confirm` pointing to the repository path.
