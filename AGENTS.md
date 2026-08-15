# Brilliantaire OS Agent Instructions

## Project

This project is Brilliantaire OS for ICYFLAMZE The Brilliantaire.

Path:

`/Users/alexanderanthony/codex-workspace/projects/brilliantaire-os`

## Current Assessment

The existing static landing page and dashboard are scaffolds. The user has explicitly rejected the current visual quality as cheap and unprofessional.

Do not preserve the current UI direction out of politeness. Treat it as a temporary data/content scaffold and rebuild toward a premium, custom, high-status creative system.

## Mandatory Design Context

Before UI work, read:

`/Users/alexanderanthony/Projects/awesome-design-md/design-md/brilliantaire/README.md`

This is the source of truth for the Brilliantaire design direction.

## Brand Definition

ICYFLAMZE The Brilliantaire is a creative technologist, multimedia strategist, and cultural systems builder turning brilliance into systems, culture, products, and global impact.

Music is a public signal, not the whole brand.

## Product Model

Build this as:

- public landing/portfolio interface
- private creative command dashboard
- Obsidian-compatible brain
- local data layer
- future creator OS/product foundation

## Quality Bar

The next version must feel like a premium creative technology product, not a generic landing page.

Required qualities:

- custom visual language
- strong first viewport
- alive system graphics or interaction
- real dashboard information architecture
- mobile polish
- no generic template feel
- no random decorative blobs
- no cheap neon
- no overdone black/gold luxury cliche

## Existing Files

- `brain/` - Obsidian-compatible Markdown brain.
- `docs/` - brand and OS docs.
- `data/` - JSON module, project, and weekly data.
- `landing/` - current static public page scaffold.
- `dashboard/` - current static private dashboard scaffold.
- `scripts/serve.py` - local server.
- `Dockerfile` and `docker-compose.yml` - Docker scaffold.

## Suggested Next Build

Rebuild as a real app:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui only for primitives
- Motion/Framer Motion for interaction
- keep `brain/`, `docs/`, and `data/` as source material

If staying static temporarily, still redesign heavily rather than tweaking the current CSS.

## Local Preview

Current server command:

```sh
python3 scripts/serve.py
```

Current URLs:

```text
http://127.0.0.1:8791/landing/
http://127.0.0.1:8791/dashboard/
```

Direct static landing URL:

```text
file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/landing/index.html
```

## Project-Local Antigravity Skills

This project uses a dedicated, focused set of project-local Antigravity skills under `.agents/skills/` to guide developers and AI systems. These skills override any global configurations:

* **[nextjs-app-router-patterns](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/nextjs-app-router-patterns/SKILL.md)** — Next.js layouts, Server Components, and React 19 structure.
* **[typescript-pro](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/typescript-pro/SKILL.md)** — Types, interfaces, and code quality configurations.
* **[frontend-design](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/frontend-design/SKILL.md)** — Design system tokens, typographic hierarchy, and micro-interactions.
* **[api-design-principles](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/api-design-principles/SKILL.md)** — Robust FastAPI and REST integrations.
* **[backend-architect](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/backend-architect/SKILL.md)** — Service patterns and decoupled system architecture.
* **[postgres-best-practices](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/postgres-best-practices/SKILL.md)** — DB models, schema migrations, and indexing practices.
* **[security-auditor](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/security-auditor/SKILL.md)** — Security standards, validations, and audits.
* **[e2e-testing-patterns](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/e2e-testing-patterns/SKILL.md)** — Playwright testing patterns.
* **[deployment-procedures](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/deployment-procedures/SKILL.md)** — Multi-stage docker configs.
* **[context-driven-development](file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/context-driven-development/SKILL.md)** — Structured workspace documentation.
