# 🛠️ Command Router Interface

This document specifies the safe execution gateway and router rules for **Brilliantaire OS**.

---

## 1. Purpose of the Command Router

The **Command Router** serves as the single safe entry point to execute scripts and functions across the OS ecosystem. It provides an intermediate translation layer, mapping normalized text strings (inputs) to strictly defined, pre-approved npm scripts.

---

## 2. Safe Execution Policy

To ensure complete control and system safety, the router enforces the following security boundaries:
* **No Arbitrary Shell Command execution:** The router does not use `child_process.exec` or shell expansion. It strictly maps string inputs to exact arguments in `child_process.spawn` executing pre-compiled Node scripts.
* **Strict Whitelisting:** Any input that does not match an entry in the pre-approved [config/commands.ts](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/config/commands.ts) registry is immediately blocked, exiting with code 1.
* **Audit Logging:** Every command execution, whether successful, failed, or blocked, is logged with metadata to `outputs/command_logs/command_log_YYYY-MM-DD.md`.
* **Medium-Risk Alias Restriction:** Medium-risk commands (e.g. `ingest` or `sync-status`) cannot be run via aliases. They must be typed exactly to ensure explicit developer intent.

---

## 3. Allowed Commands Registry

| Command | Aliases | Owning Agent | Risk Level | Description |
|---|---|---|---|---|
| `audit` | `check`, `verify` | Workflow Auditor | Low | Runs workspace structural checks and verification checks. |
| `brief` | `report`, `summary` | OS Architect | Low | Compiles and prints active projects, priorities, and actions. |
| `next` | `actions`, `next-actions` | Action Router | Low | Lists grouped action checklists. |
| `agents` | `council`, `roster` | OS Architect | Low | Shows active council properties. |
| `ingest` | `scan-notes`, `obsidian` | Knowledge Librarian | Medium | Recursively scans Obsidian vault notes (Read-Only). |
| `daily-brief` | `daily`, `today` | Action Router | Low | Compiles daily briefs markdown file outputs. |
| `sync-status` | `sync` | Knowledge Librarian | Medium | Backs up status pages and syncs Obsidian snapshots. |
| `build` | `compile` | Build Operator | Low | Compiles TypeScript workspace. |

---

## 4. Execution Examples

* Run local brief summary:
  ```bash
  npm run command -- "brief"
  # or using alias:
  npm run command -- "report"
  ```
* Run medium-risk scanner (requires exact command name):
  ```bash
  npm run command -- "ingest"
  ```

---

## 5. Preparation for Voice Control (VibeVoice Bridge)

By centralizing execution into a normalized command parser, the OS is fully prepared for future voice integration. Once active, the VibeVoice ASR voice bridge can transcribe spoken audio commands (e.g. *"Show daily brief"*), map the normalized text to the Command Router, and execute tasks hands-free safely within pre-defined security boundaries.
