# SKILLS_MANIFEST.md

This manifest lists all project-local agent skills installed for this repository. Using project-local skills avoids cluttering the global Antigravity environment and keeps agent commands aligned with the repository's stack.

## 📋 Install Metadata
* **Install Date:** 2026-05-29
* **Target Repository:** `/Users/alexanderanthony/codex-workspace/projects/brilliantaire-os`
* **Original Global Source Path:** `/Users/alexanderanthony/.agents/skills`
* **Project-Local Target Path:** `/Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills`
* **Purpose:** Target Brilliantaire OS development (Next.js, TypeScript, Postgres, E2E QA, API security) in a clean, self-contained workspace.
* **Risk Level:** Low. No active background daemon scripts or third-party executable bin binaries exist in the local skills catalog.

---

## ⚡ Installed Agent Skills

| Skill | Source Path | Local Path | Purpose | Scripts | Risk |
|---|---|---|---|---|---|
| **nextjs-app-router-patterns** | `/Users/alexanderanthony/.agents/skills/nextjs-app-router-patterns` | `.agents/skills/nextjs-app-router-patterns` | Best practices for Next.js 14+ layouts & server components. | None | Low |
| **typescript-pro** | `/Users/alexanderanthony/.agents/skills/typescript-pro` | `.agents/skills/typescript-pro` | Typing patterns, generics, compile options, and error handling. | None | Low |
| **frontend-design** | `/Users/alexanderanthony/.agents/skills/frontend-design` | `.agents/skills/frontend-design` | Professional HSL tokens, animations, layout design. | None | Low |
| **api-design-principles** | `/Users/alexanderanthony/.agents/skills/api-design-principles` | `.agents/skills/api-design-principles` | REST API endpoint structure, pagination, security, headers. | Safe template script `assets/rest-api-template.py` | Low |
| **backend-architect** | `/Users/alexanderanthony/.agents/skills/backend-architect` | `.agents/skills/backend-architect` | Backend architecture patterns & service workers. | None | Low |
| **postgres-best-practices** | `/Users/alexanderanthony/.agents/skills/postgres-best-practices` | `.agents/skills/postgres-best-practices` | Schema migration strategies, DB indexing, Neon best-practices. | None (falsely flagged keys files are docs) | Low |
| **security-auditor** | `/Users/alexanderanthony/.agents/skills/security-auditor` | `.agents/skills/security-auditor` | Securing endpoints, Host-header validation, credentials audit. | None | Low |
| **e2e-testing-patterns** | `/Users/alexanderanthony/.agents/skills/e2e-testing-patterns` | `.agents/skills/e2e-testing-patterns` | Clean Playwright integration tests and validation workflows. | None | Low |
| **deployment-procedures** | `/Users/alexanderanthony/.agents/skills/deployment-procedures` | `.agents/skills/deployment-procedures` | Docker containers multi-stage builds and release check lists. | None | Low |
| **context-driven-development** | `/Users/alexanderanthony/.agents/skills/context-driven-development` | `.agents/skills/context-driven-development` | Standardized agent workspace tracking and state management. | None | Low |

---

## 🛠️ Maintenance & Lifecycle Operations

### Maintenance Notes
1. When upgrading libraries (e.g. Next.js major releases), review `SKILL.md` rules inside the local folder and update guidelines accordingly to keep code generation instructions accurate.
2. If new skills are discovered in the local cache at `~/codex-workspace/antigravity-skill-sources/`, copy them individually to this manifest instead of installing whole bundles.

### Uninstall Procedure
To completely wipe the local agent skill system, delete the local `.agents` folder:
```sh
rm -rf /Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents
```
This leaves the home folder configuration untouched.
