# 🤖 Local Automation Runner (Phase 8A)

This document specifies the design, safety boundaries, and routine execution rules for the **Local Automation Runner** in **Brilliantaire OS**.

---

## 1. Purpose

The **Local Automation Runner** executes approved command chains in a controlled, sequential manner. It simplifies routine system checks, telemetry builds, and data exports by running multiple Command Router steps with a single trigger.

---

## 2. Safe Execution Policy

To maintain system integrity:
* **Route Everything through Safe Command Router:** The automation runner *never* executes direct scripts or bypasses router validations. It calls the Command Router gateway via `npm run command -- "<cmd>"` for every step. This preserves exact-name rules, confirmation-lock checks, and command execution logs.
* **No Direct NPM Script Invocations:** Direct execution of internal files is forbidden.
* **No Arbitrary Shell Command execution:** Only routines defined in the hardcoded configuration allowlist ([config/automation.ts](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/config/automation.ts)) can be loaded.
* **Offline-Only:** The engine makes zero API queries, database updates, or remote network notifications.
* **Fail-Fast Safety:** If any command exits with a non-zero exit code, execution halts immediately to prevent error cascade. Succeeding steps are labeled as skipped.

---

## 3. Allowed Routines Registry

The runner supports three low-risk maintenance routines:
1. **`daily-check`:** Runs structural audits, operating briefs, next action items checklist compiles, telemetry reports, and updates the local dashboard export JSON.
2. **`campaign-check`:** Runs Sporty campaign simulations checks, compiles campaign-specific metrics sheets, and exports dashboard JSON.
3. **`voice-check`:** Checks voice commands pending confirmation review, regenerates telemetry reports, and exports dashboard JSON.

---

## 4. Execution Commands

* **Show Routines Help Menu:**
  ```bash
  npm run command -- "automation-help"
  # or
  npm run automation-help
  ```
* **Run Daily Check Routine:**
  ```bash
  npm run command -- "automation-runner daily-check"
  ```
* **Run Campaign Simulation Check:**
  ```bash
  npm run command -- "automation-runner campaign-check"
  ```
* **Run Voice Queue Pending Audit:**
  ```bash
  npm run command -- "automation-runner voice-check"
  ```

---

## 5. Future Scheduling Boundary

Any future background automation or cron execution must:
1. Load schedules strictly through a sandbox task scheduler (e.g. `Taskfile`).
2. Directly invoke the `automation-runner` with a target routine.
3. Keep all write buffers non-destructive and isolated.

---

## 6. Bootstrap & Startup

The system is configured to boot automatically on user login using a macOS LaunchAgent.

### Plist File Placement
The LaunchAgent configuration plist file is saved at:
`/Users/alexanderanthony/Library/LaunchAgents/com.sentinel.boot.plist`

### LaunchAgent Details
- **Label:** `com.sentinel.boot`
- **Program:** Runs `/Users/alexanderanthony/sentinel-os/sentinel_boot.sh` using `/bin/bash`.
- **RunAtLoad:** Set to `true` (executes when user logs in).
- **Logging:** Stdout and Stderr are redirected to `/Users/alexanderanthony/sentinel_boot.log`.

### Manual Commands
To register and start the daemon manually:
```bash
launchctl bootstrap gui/501 /Users/alexanderanthony/Library/LaunchAgents/com.sentinel.boot.plist
```

To stop and unregister the daemon manually:
```bash
launchctl bootout gui/501 /Users/alexanderanthony/Library/LaunchAgents/com.sentinel.boot.plist
```
