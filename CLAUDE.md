# Brilliantaire OS — Claude Code Project Intelligence

## Identity

**Brilliantaire OS** is a tactical execution platform within the **One System** mesh network, built by Icyflamze (Alexander Anthony). It operates a three-tier architecture: ASTRA (strategist), SID (engineer), GEMINI (validator).

## Tech Stack

- **Core Language:** TypeScript / Node.js (ES modules)
- **Build:** `tsc` for compilation, `Taskfile.yml` for task orchestration
- **Test:** Vitest (`npm run test`)
- **Scripts:** 208+ TypeScript CLI scripts in `scripts/` using `tsx` — zero runtime npm dependencies beyond `openai` and `zod`
- **Python:** `tools/ai_narrator.py` (Gemini 2.5 Flash), voice stress tests
- **Database:** PostgreSQL (`supernova` schema), Supabase (IcyOS)
- **Frontend:** Vite + React (dashboard), Next.js (IcyOS Knowledge Core)

## Project Structure

```
config/          # Command registry, workflow configs (commands.ts is 3,717 lines)
scripts/         # 208+ TypeScript CLI tools (all use tsx)
tools/           # Python AI narrator, TS bridges (higgsfield, inference, sentinel)
sentinel-os/     # STALE partial snapshot of the standalone sentinel-os repo (see below); do not edit here
orchestrator/    # Phase-based orchestration engine
Knowledge Core/  # IcyOS monorepo (Next.js, 6 packages, Supabase)
dashboard/       # Vite React dashboard
outputs/         # Generated reports, narrator audio queue
```

## Key Commands

```bash
task init          # Install dependencies
task build         # Compile TypeScript
task audit         # Run self-audit
npm run test       # Run Vitest suite
npm run brief      # Generate operational brief
npm run next       # Print ranked next actions
npm run audit      # Run system audit
npm run command    # Safe command router
```

## Safe Command Router

`config/commands.ts` enforces whitelisted commands with `shell: false`, risk tiers L0-L4, and exact-name routing. All CLI execution routes through this — never bypass it with raw shell commands in production paths.

## Conventions

- All scripts use Node.js built-ins only (no runtime npm deps beyond openai/zod)
- `shell: false` enforcement on all subprocess execution
- Human approval gates before destructive operations
- VNP (Voice Narrative Protocol) for task announcements
- Preview Handoff Rule: build production artifacts, no ephemeral localhost

## Adding API Keys

When the Commander needs to add a key (Gemini, GitHub, Stripe, etc.), give him the one command below. Never ask him to paste a key into chat.

- **Command:** `pjkkey KEY_NAME`, for example `pjkkey STRIPE_SECRET_KEY`. It's installed in `~/.zshrc`.
  - It prompts with hidden input, so the key never shows on screen or in shell history.
  - It saves the key to `~/sentinel-os/.env.local` (mode 600, git-ignored by both repos) and replaces any old value.
- **Then:** `npm run pjk:doctor -- --online` to confirm the key works, and `npm run pjk` to restart.
- **If `pjkkey` is missing** (a new Mac or a fresh shell config): give him the install snippet in `docs/PJKKEY.md`.

## Security Notes

- **`sentinel-os` lives in its own repo:** `steve45morris-dotcom/sentinel-os`, checked out at `~/sentinel-os`. That is also where P.J.K. lives (`/pjk`).
  - **This repo no longer tracks `sentinel-os/`.** Because this repo is rooted at `$HOME`, `~/sentinel-os` is that standalone checkout; it used to be tracked here too as a stale snapshot (38 files from around August 2026). It was untracked in October 2026 and the folder now falls under the deny-by-default root ignore, so nothing in it is picked up by this repo. Make sentinel-os changes in the standalone repo.
  - **Pulling this change on the Mac** removes the 38 files from this repo's index only; `git` leaves the working files alone because they are untracked afterwards, and `~/sentinel-os` stays a valid checkout of its own repo.
  - **Tools that read it** (`tools/sentinel_safety_gate.ts`, `tools/sentinel_safety_report.ts`) find the checkout through `SENTINEL_OS_ROOT`, default `~/sentinel-os` (`config/sentinel_os_root.ts`).
  - **SQL:** the standalone repo uses bound parameters for every statement (commit `170c829`, 2026-09-17).
  - **Access model:** local-only and single-operator by design, with no login. `proxy.ts` refuses non-localhost hosts and cross-site requests. Add real authentication before exposing it beyond localhost.
  - **Not in the real app:** the Supabase login, roles and rate limiting in this repo's snapshot (#6) were added to the stale copy only.
- **Authentication:**
  - **IcyOS:** Supabase Auth with admin/editor/viewer roles, enforced in `apps/web/middleware.ts` (#4).
  - **`sentinel-os`:** none by design. It is local-only (see above).
- **Rate limiting (IcyOS):** `/api/*` is limited per IP (300/min, checked before auth) and per user, by tier.
  - **IcyOS** (`apps/web/src/lib/api/rate-limit.ts`): AI generation 10/min, writes 60/min, reads 120/min.
  - **Limitation:** counters are in memory, one set per server instance. Use a shared store (e.g. Redis) before running more than one instance.
- **Licensing:** IcyOS is under a proprietary license (`Knowledge Core/IcyOS/LICENSE`), and the root `package.json` points to it. The old MIT license is gone.

## Installed Tools

### gstack (Claude Code Skills)
50+ skills installed at `~/.claude/skills/gstack/`. Provides: `/qa`, `/ship`, `/review`, `/spec`, `/investigate`, `/browse`, and more. Install on new machines:
```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

### skillopt (Python)
Sleep hygiene optimizer. Install: `pip install skillopt`. Run lifecycle:
```bash
skillopt-sleep dry-run    # Preview proposals
skillopt-sleep run        # Execute optimization
skillopt-sleep status     # Check current state
skillopt-sleep adopt      # Accept proposals
skillopt-sleep schedule   # Install daily cron (3:17 AM)
```
Requires an LLM API key for real optimization (runs in mock mode without one).

## IcyOS Knowledge Core

Located at `Knowledge Core/IcyOS/` — the most commercially valuable asset:
- 31,991 source LOC, 27,194 test LOC, 42 passing tests
- Provider-agnostic AI runtime (Anthropic, OpenAI, Gemini, Ollama, Mock)
- 13 Supabase migrations, 23 pages, GitHub Actions CI
- Founder Certification grade: 94/100

## Active Projects (PROJECTS.md)

10 active projects + 22 staged external repos. Key ones:
1. Brilliantaire OS (this repo)
2. IcyOS Knowledge Core
3. ICYFLAMZE CORE (IP Bible, Episode 1)
4. Tree Groove Records
5. Grinder's Keep

## Do Not

- Push to `main` without explicit approval
- Bypass the Safe Command Router
- Expose `.env*` or `mcp_secrets/` contents
- Re-track `sentinel-os/` here or edit it as part of this repo: change the standalone `sentinel-os` repo instead, and keep its SQL on bound parameters
- Treat agent role documents (AGENTS.md) as running code — they are conceptual
