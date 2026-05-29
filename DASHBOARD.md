# 📊 Lightweight Local Dashboard (Phase 7B)

This document specifies the design, read-only principles, and compilation workflows for the **Lightweight Local Dashboard** in **Brilliantaire OS**.

---

## 1. Purpose

The **Local Dashboard** is a static single-page application built on top of Vite, React, and TypeScript. It reads the local file `dashboard/public/dashboard-data.json` to visualize:
1. Current system phase and capabilities.
2. Campaign schedule files readiness.
3. Command execution activity stats (blocked vs successful).
4. Text-based voice confirmations queue metrics.
5. Backlog action items.

---

## 2. Strictly Read-Only Policy

To prevent vulnerability surface expansion and preserve the Command Router integrity:
* **No Action Triggers:** The user interface does not feature any input buttons, forms, terminal emulators, or execute buttons.
* **No Shell Access:** The client-side application is entirely static and cannot spawn processes, run CLI tasks, or talk to system interfaces.
* **No Auto-Sync DBs:** The UI fetches from a pre-compiled telemetry export dump. It acts strictly as a viewer.
* **CLI remains the source of truth:** All file operations, ingestion, validation audits, scheduler actions, and approvals must continue to be driven explicitly through the developer's sandboxed terminal.

---

## 3. Operations & Command Reference

### Step 1: Export Data Snapshot
Before viewing, compile the latest repository details and telemetry metrics to the public folder:
```bash
npm run command -- "dashboard-export"
# or
npm run dashboard:export
```

### Step 2: Build / Preview the UI
You can compile the static production bundle or spin up the local development web server:
* **Compile Build Assets:**
  ```bash
  npm run command -- "dashboard-build"
  # or
  npm run dashboard:build
  ```
* **Spin up Vite Local Server:**
  ```bash
  npm run dashboard:dev
  ```

---

## 4. Future Dashboard Boundaries

Any modifications or features added to the dashboard in future phases must respect the read-only gate. The UI must never request writes directly to the codebase, git, or Obsidian vault directories. All control systems must remain isolated.
