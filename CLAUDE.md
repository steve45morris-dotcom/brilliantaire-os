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
sentinel-os/     # Mesh layer, multi-tenant SaaS backend
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

## Security Notes

- **SQL in `sentinel-os`:** every query uses bound parameters.
  - **`lib/settlement-bridge.ts` and `lib/solar-scheduler.ts`:** go through `runQuery`/`runExecute` in `lib/db.ts`.
  - **`lib/mesh_layer.ts`:** uses its own `better-sqlite3` connection. It no longer shells out to the `sqlite3` CLI.
  - **Database path:** `mesh_layer.ts` defaults to `~/supernova.db`, but `lib/db.ts` falls back to a path based on the working directory. Set `SUPERNOVA_DB_PATH` so both use the same file.
  - **History:** settlement-bridge had an open injection reachable from `POST /api/mesh/settle` (fixed).
- **Authentication:**
  - **IcyOS:** Supabase Auth with admin/editor/viewer roles, enforced in `apps/web/middleware.ts` (#4).
  - **`sentinel-os`:** Supabase Auth, enforced in `sentinel-os/middleware.ts`, with the rules in `lib/auth/policy.ts`. Pages and GET requests need a signed-in viewer. Mesh POSTs need editor. Billing, settle and provision need admin. Roles are read from Supabase `app_metadata.role`, which users cannot edit. There is no self-signup: admins invite operators.
- **Rate limiting:** IcyOS `/api/*` is limited per IP and per user (`apps/web/src/lib/api/rate-limit.ts`). Counters are in memory, one set per server instance, so use a shared store (e.g. Redis) before running more than one. `sentinel-os` has none.
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
- Build SQL from strings in `sentinel-os/`: always pass values as bound parameters
- Treat agent role documents (AGENTS.md) as running code — they are conceptual
