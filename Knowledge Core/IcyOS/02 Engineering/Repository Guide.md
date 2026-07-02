# 📂 Repository Guide: Execution Layer Mapping
`Version: 1.0.0` | `Status: Active` | `Scope: Engineering`

This document details the directories, folder scopes, packages, and scripts inside the execution layer (`Repository/`) of **IcyOS**.

---

## 🏗️ Repository Layout

- **`apps/`**: Complete client or runtime applications (CLI tools, desktop bridges).
- **`packages/`**: Shared npm libraries, design system JSON tokens, and database models.
- **`frontend/`**: Web UI source code (Vite, Next.js).
- **`backend/`**: Node.js workers, Redis schedulers, and API server source code.
- **`database/`**: SQL migration scripts, PostgreSQL schemas, and seeds.
- **`api/`**: OpenAPI models, Zod schema contracts, and tRPC configurations.
- **`integrations/`**: Webhook and SDK handlers for external interfaces (Google Calendar, Obsidian, Slack).
- **`scripts/`**: Automation scripts (sync, database migrations, voice bridge, backups).
- **`tests/`**: Global integrations tests and Playwright E2E configurations.
- **`deployment/`**: Dockerfiles, Docker Compose configs, and CI pipeline descriptors.

---

## 📋 Document Metadata
- **Purpose**: Describe the directory structures and build flows of the codebase.
- **Responsibilities**: Enforces directory naming guidelines and import bounds.
- **Dependencies**: [Engineering Standards](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Engineering%20Standards.md)
- **Relationships**: Child of Engineering Standards.
- **Version**: 1.0.0
- **Revision History**:
  - `2026-07-02`: Created initial Repository Guide.
- **Future Expansion**: Add monorepo package reference flowcharts.
- **Cross References**:
  - [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md)
  - [Engineering Standards](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Engineering%20Standards.md)

*I build before burning.*
