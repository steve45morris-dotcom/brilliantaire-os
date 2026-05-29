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

## 📂 Expected Outputs

All telemetry and compiler runs output to the local `outputs/` directory:
* **Obsidian Ingestion Reports:**
  * `outputs/obsidian_ingest/ingest_report.json` - Complete parsed file nodes and score metrics.
  * `outputs/obsidian_ingest/ingest_report.md` - Rendered Markdown summary of the top 10 relevant notes.
* **Daily Briefs:**
  * `outputs/daily_briefs/daily_brief_YYYY-MM-DD.md` - Unified Operating report containing active priorities, tech build details, money-making opportunities, and upcoming moves.
* **Backups:**
  * `outputs/backups/*.bak` - Secure snapshot backups of repository markdown files before any status synchronization runs.

---

## 🚀 Next Phase Recommendation
* **Phase 4: Autonomous Campaign Execution & Vocal Command Bridge**
  * Integrate direct vocal trigger pipelines matching VibeVoice commands and execute automated social media rollout campaigns.
