# Brilliantaire OS

Brilliantaire OS is the operating system for ICYFLAMZE The Brilliantaire.

It treats ICYFLAMZE as a creative technologist, multimedia strategist, and cultural systems builder. Music remains a major public signal, but the backend engine is broader: software, AI workflows, brand systems, media, business, education, and cultural movement design.

## Core Thesis

Brilliance is the capital. Systems are the engine. Culture is the output. Impact is the goal.

## Project Structure

- `AGENTS.md` - project-level instructions for Antigravity/Codex-style agents.
- `ANTIGRAVITY_HANDOFF.md` - direct takeover brief for Antigravity CLI.
- `landing/` - public landing page prototype.
- `dashboard/` - private local operating dashboard.
- `brain/` - Obsidian-compatible Markdown brain.
- `docs/` - brand, OS, and execution architecture.
- `data/` - structured module map for future dashboards or apps.
- `scripts/` - local utility scripts.

## Operating Rule

Every idea must be routed into one or more lanes:

- Core identity
- Labs and technology
- Media and storytelling
- Strategy and brand systems
- Tree Groove Records and music
- Academy and education
- Ventures and monetization
- Culture and movement

## Next Build Targets

1. Turn the static landing page into a live portfolio.
2. Build a private OS dashboard for ideas, projects, campaigns, and revenue.
3. Connect the OS to weekly planning and project execution.
4. Package the first Brilliantaire offer for artists/builders.

## Local Use

Open the brain folder in Obsidian:

```text
/Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/brain
```

Run the local dashboard:

```sh
python3 scripts/serve.py
```

Then open:

- `http://127.0.0.1:8791/dashboard/`
- `http://127.0.0.1:8791/landing/`

Docker path:

```sh
docker compose up --build
```

## Antigravity Takeover

Run:

```sh
scripts/start_antigravity.sh
```

Or manually:

```sh
cd /Users/alexanderanthony/codex-workspace/projects/brilliantaire-os
agy --add-dir /Users/alexanderanthony/codex-workspace/projects/brilliantaire-os --add-dir /Users/alexanderanthony/Projects/awesome-design-md/design-md/brilliantaire -i --prompt "Read AGENTS.md and ANTIGRAVITY_HANDOFF.md, then rebuild Brilliantaire OS toward a premium creative technology command system."
```

## Phase 8A: Local Automation Runner
Built a safe local runner supporting:
- **`daily-check`**: Audit check, operational brief, pipeline next step, telemetry snapshots, and exports.
- **`campaign-check`**: Simulating active sporty campaigns and exporting visual telemetry.
- **`voice-check`**: Verifying vocal Bridge daemon and pending announcement queues.

All routines run through a Safe Command Router allowlist (`config/commands.ts`) which enforces agents' risk control limits. Run logs are saved daily under `outputs/automation/logs/` and runs are indexed at `outputs/automation/runs/`.

