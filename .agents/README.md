# Project-Local Antigravity Agent Configuration

This directory contains the local agent configurations, prompt instructions, and project-specific skills for **Brilliantaire OS**.

## 📂 Folder Purpose
By housing these skills directly under the project root (`.agents/skills/`), we ensure that any AI agent loaded by the Antigravity CLI utilizes project-specific guidelines matching the exact technology stack of this repository (Next.js, TypeScript, Postgres, and FastAPI backend). This prevents:
- Pollution of the global `~/.agents/` folder.
- Collision between different projects using different versions of the same skill.
- Bloat of global skill registries that slow down AI reasoning.

---

## 🚀 Installed Local Skills Summary
We have installed a highly-focused catalog of 10 skills:
1. `nextjs-app-router-patterns` — Next.js 14+ layouts & server component rules.
2. `typescript-pro` — Generics and type checking rules.
3. `frontend-design` — Aesthetics, custom design systems, and Motion.
4. `api-design-principles` — FastAPI and REST security principles.
5. `backend-architect` — Queues and backend systems.
6. `postgres-best-practices` — Postgres schemas and Neon connections.
7. `security-auditor` — Securing endpoints and headers.
8. `e2e-testing-patterns` — Playwright testing patterns.
9. `deployment-procedures` — Production multi-stage Docker builds.
10. `context-driven-development` — Workspace context rules.

---

## ⚡ Running Antigravity for this Repo

To launch Antigravity with this repo directory registered locally, use:
```sh
agy --add-dir "/Users/alexanderanthony/codex-workspace/projects/brilliantaire-os" -i --prompt "Read AGENTS.md, inspect .agents/skills, then help me work on this repo."
```

### Smoke Test Command
To verify that Antigravity is reading the setup correctly:
```sh
agy --add-dir "/Users/alexanderanthony/codex-workspace/projects/brilliantaire-os" --print "Read AGENTS.md and list the installed repo-local skills."
```

---

## 🔄 Management Operations

### Adding Skills Later
If you want to add more skills later from the local cache:
1. Locate the skill in `~/codex-workspace/antigravity-skill-sources/`.
2. Inspect any scripts in the skill folder to ensure they are safe.
3. Copy the folder to `.agents/skills/<skill-name>/`.
4. Update `SKILLS_MANIFEST.md`.

### Removing Skills
Delete the folder of the specific skill:
```sh
rm -rf /Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/<skill-name>
```

> [!WARNING]
> Do not install giant global bundles or run untrusted setup scripts inside this folder. Keep the skills registry focused and verified to ensure maximum AI execution quality and speed.
