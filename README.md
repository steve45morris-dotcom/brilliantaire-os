# 🌌 Brilliantaire OS

> **Identity Stack:** King on his own board, Knight in the universe's game.  
> **Origin:** Area Boy (Lagos Roots) | **Symbolism:** Mr. 2 Lighter (Survival + Creation)  
> **Mindset:** Brilliantier (Pressure-educated) | **Signature:** *"I build before burning."*  

Tactical execution platform operating with high-leverage local skills and autonomous decision-making loops under the **One System** mesh network.

---

## 🛰️ Phase 3A: Knowledge Ingestion & Obsidian Read-Only Gateway

The **Obsidian Read-Only Gateway** connects `brilliantaire-os` to local Obsidian vaults. It allows the system to recursively parse markdown notes, extract crucial tasks, blocker notes, decisions, and system signals, and compile actionable reports without ever modifying or risking vault data.

### 🔒 Read-Only Safety Rule
**The Gateway is strictly read-only.** It never writes back to your Obsidian vaults. All syncing, snapshotting, and report-generation occur locally within the repository's `outputs/` directory.

---

## 🔒 Phase 3B: Approved Obsidian Write Gateway

The **Approved Obsidian Write Gateway** provides a safe, highly-controlled mechanism to write staging summaries, snapshots, and operational briefs back to the Obsidian vault under a dedicated `brilliantaire-briefs/` subdirectory.

### 🛡️ Safe Write Policy & Staging Verification
1. **No Automatic Sync:** Full automatic bi-directional sync is strictly prohibited to prevent data loss or infinite loops.
2. **Explicit Staging Loop:** Files must first be generated and verified locally in the `outputs/write_staging/` folder.
3. **Approval Handshake:** No write is executed to the Obsidian vault until `npm run approve-write` is run explicitly.
4. **Collision Isolation (No Overwrites):** If a target file already exists in the Obsidian directory, the write script appends a unique UNIX timestamp suffix to prevent overriding existing notes.
5. **Obsidian Folder Isolation:** The gateway is restricted to writing ONLY to the `brilliantaire-briefs/` subfolder (which has dedicated folders: `daily/`, `next-actions/`, `decisions/`, `projects/`, and `logs/`).
6. **Rollback & Logs:** Every write generates timestamped records in both the repository's `outputs/write_logs/` and the vault's `brilliantaire-briefs/logs/`. If a rollback is needed, files can be restored from the staging folder or local repository backups.

---

## 🛠️ CLI Task Runner commands

Manage and execute operations using the following `task` commands:

| Command | Action | Description |
|---|---|---|
| `task init` | `npm install` | Install workspace dependencies |
| `task build` | `npm run build` | Compile TypeScript sources to `dist/` |
| `task audit` | `npm run audit` | Run workspace sanity checks and verify core file presence |
| `task brief` | `npm run brief` | Print a concise operational summary to the terminal |
| `task next` | `npm run next` | Generate a ranked next-action checklist |
| `task ingest` | `npm run ingest` | Recursively scan candidate Obsidian paths for key tags and signals |
| `task sync-status` | `npm run sync-status` | Sync parsed Obsidian snapshot into repository status files |
| `task daily-brief` | `npm run daily-brief` | Generate a daily operating brief markdown report |
| `task agents` | `npm run agents` | Print a clean summary of the active Agent Council |
| `task stage-write` | `npm run stage-write` | Stage markdown files into `write_staging` |
| `task approve-write` | `npm run approve-write` | Write staged files to safe Obsidian directory |
| `task write-log` | `npm run write-log` | Display write history timeline and warnings |
| `task command` | `npm run command -- <CLI_ARGS>` | Execute pre-approved CLI script via the safe command router |
| `task command-help` | `npm run command-help` | Print registry of all allowed command router configurations |
| `task campaign` | `npm run campaign -- <CLI_ARGS>` | Run campaign template actions safely |
| `task campaign-help` | `npm run campaign-help` | Print campaign CLI help |
| `task voice-queue` | `npm run voice-queue` | Process text-based voice commands queue safely |
| `task voice-help` | `npm run voice-help` | Print voice commands mapping table registry |
| `task voice-pending` | `npm run voice-pending` | List voice commands pending confirmation review |
| `task voice-confirm` | `npm run voice-confirm -- <CLI_ARGS>` | Approve and execute a pending voice command |
| `task voice-deny` | `npm run voice-deny -- <CLI_ARGS>` | Deny and discard a pending voice command |

---

## 🤖 Productivity Agent Layer

Brilliantaire OS operates with a lean council of **7 conceptual agents** to segment duties, monitor boundaries, and maintain high-fidelity execution:
1. **OS Architect** — Core blueprints, roadmaps, and validation integrity.
2. **Workflow Auditor** — Space verification, duplication detection, and security sanity checks.
3. **Action Router** — Priority scheduler and status action item sorting.
4. **Knowledge Librarian** — Ingestion compiler and snapshots syncing manager.
5. **Prompt Engineer** — Standard instructions design and model templates compiler.
6. **Build Operator** — Builds compiler, typescript checks, and CLI executors.
7. **Creative Revenue Strategist** — Marketing launches, rollout briefs, and revenue tracker logic.

All roles are documented and mapped to specific owned files in [AGENTS.md](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/AGENTS.md).

---

## 🛠️ Phase 3D: Safe Command Router

The **Safe Command Router** provides a safe execution boundary that translates user inputs into strictly whitelisted commands without exposing the workspace to arbitrary shell execution.

### 🛡️ Safety & Execution Rules
1. **Zero Shell Command execution:** Direct invocation of commands is prohibited. Child processes are spawned directly using `child_process.spawn` with `shell: false`. No `eval` or shell injection vectors exist.
2. **Exact-Name Enforcement:** Pre-approved commands with `requiresExactName: true` (e.g. `ingest`, `sync-status`, `stage-write`, `approve-write`) block aliases. They must be typed exactly.
3. **High-Risk Confirmation Block:** High-risk commands (e.g. `approve-write`) require the `--confirm` flag to run. Without it, execution is safely blocked.
4. **Execution History Logging:** All command results, raw inputs, and execution statuses are appended to markdown logs inside `outputs/command_logs/`.

### 💻 Command Examples
* Run operational brief summary (accepts aliases):
  ```bash
  npm run command -- "report"
  ```
* Run medium-risk scanner (requires exact command name, alias blocked):
  ```bash
  npm run command -- "ingest"
  ```
* Run high-risk approved write (requires exact name and confirmation flag):
  ```bash
  npm run command -- "approve-write" --confirm
  ```
* View all registered router commands:
  ```bash
  npm run command-help
  ```

*Note: This clean command abstraction prepares the system for the hands-free VibeVoice bridge integration.*

---

## 📣 Phase 4A: Campaign Template Engine

The **Campaign Template Engine** compiles structured campaign assets for Tree Groove Records and Icyflamze brands. It operates entirely locally, creating content calendars, execution checklists, prompt logs, Lagos street challenge scripts, and briefs without calling external social APIs.

### 💻 Command Examples
* View campaign commands help:
  ```bash
  npm run campaign-help
  ```
* List registered rollout campaigns:
  ```bash
  npm run campaign -- "list"
  ```
* Generate launch checklist for the "Sporty" release (via the safe router):
  ```bash
  npm run command -- "campaign checklist sporty"
  ```
* Generate Lagos street challenge host interview script (via the safe router):
  ```bash
  npm run command -- "campaign street-script sporty"
  ```

---

## 🎙️ Phase 4B: Voice Command Queue

The **Voice Command Queue** provides a secure buffer separating speech-to-text transcription from active command execution. Normalized commands are stored as static transcripts in `voice_queue/inbox/` and processed sequentially against a mapped voice mapping registry.

### 💻 Command Examples
* View mapped voice phrases table:
  ```bash
  npm run command -- "voice-help"
  ```
* Execute queue scanning manually (medium risk, exact name required):
  ```bash
  npm run command -- "voice-queue"
  ```

---

## 🔒 Phase 4C: Voice Confirmation Layer

The **Voice Confirmation Layer** introduces a manual "Review-and-Release" confirmation workflow. Mapped voice actions flagged with medium-risk or high-risk are held in `voice_queue/pending_confirmation/` as metadata sidecar JSON and transcript files. Developers must explicitly release or reject them.

### 💻 Command Examples
* List all commands pending manual confirmation:
  ```bash
  npm run command -- "voice-pending"
  ```
* Release and execute a pending command (requires exact name and confirmation flag):
  ```bash
  npm run command -- "voice-confirm <pending-id> --confirm"
  ```
* Reject and discard a pending command:
  ```bash
  npm run command -- "voice-deny <pending-id> --reason 'not required'"
  ```

---

## 📂 Expected Outputs

All telemetry and compiler runs output to the local `outputs/` and `voice_queue/` directories:
* **Obsidian Ingestion Reports:**
  * `outputs/obsidian_ingest/ingest_report.json` - Complete parsed file nodes and score metrics.
  * `outputs/obsidian_ingest/ingest_report.md` - Rendered Markdown summary of the top 10 relevant notes.
* **Daily Briefs:**
  * `outputs/daily_briefs/daily_brief_YYYY-MM-DD.md` - Unified Operating report containing active priorities, tech build details, money-making opportunities, and upcoming moves.
* **Backups:**
  * `outputs/backups/*.bak` - Secure snapshot backups of repository markdown files before any status synchronization runs.
* **Campaign Telemetry Outputs:**
  * `outputs/campaigns/briefs/` - Standard campaign briefs markdown files.
  * `outputs/campaigns/content_calendars/` - 3-week multi-platform daily posting grids.
  * `outputs/campaigns/prompt_packs/` - AI generation prompt packs (Sora, Veo, Claude).
  * `outputs/campaigns/checklists/` - Staged checklist steps.
  * `outputs/campaigns/scripts/` - Lagos street interview script markdown files.
* **Voice Confirmation Outputs:**
  * `voice_queue/pending_confirmation/` - Mapped voice commands held for manual review.
  * `voice_queue/confirmed/` - Executed and confirmed voice phrase transcripts.
  * `voice_queue/denied/` - Discarded and denied voice commands transcripts.
  * `outputs/voice_confirmation_logs/` - Release and denial audit trail logs.
* **VibeVoice Ingestion Outputs:**
  * `voice_input/transcripts/` - Local backup archive of successfully ingested raw text transcripts.
  * `outputs/vibevoice_logs/vibevoice_log_YYYY-MM-DD.md` - Ingest log tracking staged and rejected files.
* **Live ASR Bridge Outputs:**
  * `voice_input/live_sessions/` - Archive folders storing successfully imported live ASR transcripts.
  * `voice_input/live_logs/rejected/` - Direct storage of validation rejected files.
  * `outputs/live_asr_logs/live_asr_log_YYYY-MM-DD.md` - Chronological import audit logs.
* **Campaign Scheduler Outputs:**
  * `outputs/campaigns/schedules/` - Staged 21-day timeline schedules.
  * `outputs/campaigns/posting_queue/` - Daily posting queue scripts.
  * `outputs/campaigns/execution_logs/` - Verification posting sheets.
* **Campaign Simulation & Validation Outputs:**
  * `outputs/campaigns/simulations/` - Campaign simulation reports.
  * `outputs/campaigns/validation_reports/` - Validation audit reports.
* **Mesh Telemetry Outputs:**
  * `outputs/mesh_telemetry/snapshots/` - System configuration snapshots.
  * `outputs/mesh_telemetry/reports/` - Unified system telemetry reports and campaign specific metric sheets.

---

## 🎙️ Phase 5A: VibeVoice Transcript Producer

The **VibeVoice Transcript Producer** serves as the ingestion bridge that stages plain text voice transcripts into the safe pipeline without triggering live actions directly from audio inputs.

### 🛡️ Safety & Ingestion Rules
1. **Zero Direct Execution:** Transcripts cannot invoke scripts or run commands directly.
2. **Inbox Decoupling:** Transcripts are written exclusively to `voice_input/manual/` and staged to `voice_queue/inbox/` with a `vibevoice_` prefix.
3. **Length and Format Checks:** Inputs must be plain text (.txt), strictly shorter than 500 characters, and non-empty.

### 💻 Command Examples
* View VibeVoice safety menu:
  ```bash
  npm run command -- "vibevoice-help"
  ```
* Ingest and stage manual transcripts (requires exact command name):
  ```bash
  npm run command -- "vibevoice-transcript"
  ```
* Prepare test transcripts in the manual staging folder:
  ```bash
  npm run command -- "vibevoice-test"
  ```

---

## 🎙️ Phase 5B: Live Microphone ASR Bridge

The **Live Microphone ASR Bridge** is the ingestion adapter for live ASR output text, enforcing validation checks before moving them into the VibeVoice queue pipeline.

### 🛡️ Safety & Flow Rules
1. **No Microphone Direct execution:** Audio feeds do not execute OS commands directly.
2. **Decoupled Imports:** Imports transcript `.txt` files from `voice_input/live/` into `voice_input/manual/` for review.
3. **Strict Validation:** Empty or overly long inputs (> 500 characters) are rejected and stored under `voice_input/live_logs/rejected/`.

### 💻 Command Examples
* View Live ASR safety guide:
  ```bash
  npm run command -- "live-asr-help"
  ```
* Import valid transcripts from live directory (requires exact command name):
  ```bash
  npm run command -- "live-asr-import"
  ```
* Prepare test transcripts under live folder:
  ```bash
  npm run command -- "live-asr-test"
  ```
* Check recording device interface info (requires exact command name):
  ```bash
  npm run command -- "live-asr-record"
  ```

---

## 📅 Phase 6A: Campaign Scheduler Draft Engine

The **Campaign Scheduler Draft Engine** converts compiled campaign templates and briefs into local platform timelines, daily queues, and manual execution tracking sheets.

### 🛡️ Safety & Operations Rules
1. **Zero Live Publishing:** Strictly offline local compilation. No connection is made to platform API keys.
2. **Decoupled Processing:** Output scripts stage posting queues for human review.
3. **Safety Locks:** Built-in safeguards check file conflicts and preserve state via timestamp suffixing.

### 💻 Command Examples
* View Campaign Scheduler help menu:
  ```bash
  npm run command -- "campaign-scheduler-help"
  ```
* Compile 21-day Sporty rollout timeline (requires exact command name):
  ```bash
  npm run command -- "campaign-scheduler create sporty"
  ```
* Generate daily posting queue (requires exact command name):
  ```bash
  npm run command -- "campaign-scheduler queue sporty"
  ```
* Check current campaign schedule statuses:
  ```bash
  npm run command -- "campaign-scheduler status sporty"
  ```

---

## 📊 Phase 6B: Campaign Simulation & Mesh Validation

The **Campaign Simulation & Mesh Validation Engine** runs auditing checks against draft campaign files. It calculates platform coverage, CTA integrity, and asset readiness scores before executing tasks.

### 🛡️ Safety & Auditing Rules
1. **Zero API Integration:** The simulator is completely offline.
2. **Strict Score Grading:** Readiness is rated on 6 criteria (each 0 to 100), determining readiness level.
3. **Quarantine checks:** Reports structural checklist failures without modifying original assets.

### 💻 Command Examples
* View Campaign Simulator help menu:
  ```bash
  npm run command -- "campaign-simulate-help"
  ```
* Run full Sporty campaign simulation (requires exact command name):
  ```bash
  npm run command -- "campaign-simulate sporty"
  ```
* Run Sporty checklist validation audits (requires exact command name):
  ```bash
  npm run command -- "campaign-simulate validate sporty"
  ```
* Print latest simulation validation statuses:
  ```bash
  npm run command -- "campaign-simulate status sporty"
  ```

---

## 📊 Phase 7A: Safe Mesh Telemetry Logger

The **Safe Mesh Telemetry Logger** aggregates command history, voice confirmations, simulation audits, and approved write counts into unified telemetry logs.

### 🛡️ Safety & Telemetry Rules
1. **Completely Local:** Never uploads or broadcasts logs over networks.
2. **Read-Only Operations:** Performs audit operations non-destructively.
3. **Verification locks:** Preserves historical telemetry reports using timestamp suffix protections.

### 💻 Command Examples
* View Telemetry help menu:
  ```bash
  npm run command -- "mesh-telemetry-help"
  ```
* Compile current system capabilities snapshot (requires exact command name):
  ```bash
  npm run command -- "mesh-telemetry snapshot"
  ```
* Generate unified system telemetry metrics (requires exact command name):
  ```bash
  npm run command -- "mesh-telemetry report"
  ```
* Generate campaign specific metrics for the Sporty Single (requires exact command name):
  ```bash
  npm run command -- "mesh-telemetry campaign sporty"
  ```
* Check latest telemetry statuses:
  ```bash
  npm run command -- "mesh-telemetry status"
  ```

---

## 📊 Phase 7B: Lightweight Local Dashboard

The **Lightweight Local Dashboard** compiles static status lists and telemetry logs into a read-only Vite React TypeScript client application.

### 🛡️ Safety & Dashboard Rules
1. **Strictly Read-Only:** The dashboard operates 100% on statically exported JSON logs. No execution controls or database mutations exist in the UI.
2. **Offline Boundaries:** Runs entirely locally; does not invoke external metrics APIs.
3. **Double Isolation:** All command tasks are triggered strictly via CLI command router steps.

### 💻 Command Examples
* Export current telemetry variables to JSON (via safe router):
  ```bash
  npm run command -- "dashboard-export"
  ```
* Compile Vite static production bundle (via safe router):
  ```bash
  npm run command -- "dashboard-build"
  ```
* Spin up local Vite preview/development server:
  ```bash
  npm run dashboard:dev
  ```

---

## 🚀 Next Phase Recommendation
* **Phase 8A: Autonomous Post-Release Verification**
  - Implement automated sanity loops checking production artifacts after campaigns launch.```
