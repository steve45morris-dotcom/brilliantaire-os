# Antigravity Handoff: Brilliantaire OS

## User Intent

The user wants to continue this project in Antigravity CLI because the current version looks too cheap and unprofessional. The next phase should focus on a premium, unique, brilliant build.

## Do Not Do

- Do not only adjust colors on the current static pages.
- Do not produce a generic SaaS dashboard.
- Do not make it look like a basic rapper/music landing page.
- Do not make music dominate the whole brand.
- Do not use a template unless it is heavily transformed into the Brilliantaire visual system.

## Desired Outcome

Create a million-dollar-feeling Brilliantaire OS experience:

- Public page: cinematic creative technology identity.
- Private dashboard: command center for ideas, projects, campaigns, Labs, Strategy, Media, Music, Academy, Ventures.
- Obsidian brain: Markdown source of truth.
- Data: local JSON first, database later.

## Required Reading

1. `AGENTS.md`
2. `/Users/alexanderanthony/Projects/awesome-design-md/design-md/brilliantaire/README.md`
3. `docs/brand-system.md`
4. `docs/os-blueprint.md`
5. `data/modules.json`
6. `data/projects.json`
7. `brain/README.md`

## Current Project URLs

```text
http://127.0.0.1:8791/landing/
http://127.0.0.1:8791/dashboard/
```

## Recommended Rebuild Plan

1. Create a `web/` app using Next.js, TypeScript, and Tailwind.
2. Migrate core brand/data content from `data/` and `docs/`.
3. Build a premium landing page with system visuals, module maps, and strong identity.
4. Build a private dashboard view with command center, modules, projects, weekly outcomes, and idea pipeline.
5. Add motion and interaction only where it makes the system feel alive.
6. Validate desktop and mobile layout.
7. Keep old `landing/` and `dashboard/` as legacy scaffold until the new app is better.

## Antigravity Starter Prompt

Use this prompt with `agy` from the project directory:

```text
You are taking over Brilliantaire OS for ICYFLAMZE The Brilliantaire. Read AGENTS.md and ANTIGRAVITY_HANDOFF.md first. The current static UI has been rejected as cheap and unprofessional. Rebuild toward a premium creative technology command system. Before UI work, read /Users/alexanderanthony/Projects/awesome-design-md/design-md/brilliantaire/README.md. Propose a concrete implementation plan, then start by creating a serious Next.js/TypeScript/Tailwind app under web/ while preserving brain/, docs/, and data/ as source material.
```
