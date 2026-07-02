# 📝 Task Type Classification Rules
`Version: 1.0.0` | `Status: Active`

This document defines parameters, reading lists, outputs, testing obligations, and ADR requirements for each category of task.

---

## 🚦 Task Categories Matrix

### 1. Documentation
- **Required Read**: [Global Context](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/11%20Memory/Global%20Context.md), Target Specification.
- **Required Outputs**: Updated Markdown specifications files.
- **Required Updates**: [Recent Changes](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/Recent%20Changes.md).
- **ADR Required**: No.
- **Tests Required**: No.

### 2. Architecture
- **Required Read**: [Technical Design Document](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Technical%20Design%20Document.md), [System Architecture](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/System%20Architecture.md).
- **Required Outputs**: Technical architecture blueprints or maps updates.
- **Required Updates**: [Decision Log](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/13%20Decisions/Decision%20Log.md), [Recent Changes](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/Recent%20Changes.md).
- **ADR Required**: Yes.
- **Tests Required**: No.

### 3. Database
- **Required Read**: [Database Architecture](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Database%20Architecture.md).
- **Required Outputs**: Migration SQL or schema typescript entities.
- **Required Updates**: [Current State](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/11%20Memory/Current%20State.md).
- **ADR Required**: Yes (for table additions).
- **Tests Required**: Yes (migrations test cases).

### 4. API
- **Required Read**: [API Architecture](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/API%20Architecture.md).
- **Required Outputs**: OpenAPI schema descriptor or Zod validator maps.
- **Required Updates**: [Recent Changes](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/Recent%20Changes.md).
- **ADR Required**: Yes (for breaking version increments).
- **Tests Required**: Yes (Vitest endpoint tests).

### 5. Frontend
- **Required Read**: [Frontend Architecture](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Frontend%20Architecture.md), [Design System](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/04%20Design/Design%20System.md).
- **Required Outputs**: Responsive React UI components.
- **Required Updates**: [Session Summaries Log](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/11%20Memory/Session%20Summaries.md).
- **ADR Required**: No.
- **Tests Required**: Yes (Playwright E2E and unit UI test cases).

### 6. Backend
- **Required Read**: [Backend Architecture](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Backend%20Architecture.md).
- **Required Outputs**: Express route handlers, queue processors.
- **Required Updates**: [Current State](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/11%20Memory/Current%20State.md).
- **ADR Required**: No.
- **Tests Required**: Yes (unit handlers tests with >80% coverage).

### 7. AI Engine
- **Required Read**: Target Engine spec in `03 AI Department/`.
- **Required Outputs**: Prompt pack files, router logics.
- **Required Updates**: [AI Status](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/AI%20Status.md).
- **ADR Required**: Yes.
- **Tests Required**: Yes (mock verify scripts).

### 8. Testing
- **Required Read**: Target tests spec.
- **Required Outputs**: New test suite assertions.
- **Required Updates**: [Repository Health](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/Repository%20Health.md).
- **ADR Required**: No.
- **Tests Required**: Yes.

### 9. Deployment
- **Required Read**: Deployment configuration files.
- **Required Outputs**: Updated Dockerfiles or workflow charts.
- **Required Updates**: [Recent Changes](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/Recent%20Changes.md).
- **ADR Required**: Yes.
- **Tests Required**: Yes (integration run cases).

### 10. Refactor
- **Required Read**: Target files.
- **Required Outputs**: Surgical code changes with identical functionality.
- **Required Updates**: [Session Summaries Log](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/11%20Memory/Session%20Summaries.md).
- **ADR Required**: No.
- **Tests Required**: Yes (verify zero regression on existing suites).

### 11. Audit
- **Required Read**: Entire workspace directories paths.
- **Required Outputs**: Cleaned duplicate files list or formatted status reports.
- **Required Updates**: [Repository Health](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/Repository%20Health.md).
- **ADR Required**: No.
- **Tests Required**: No.

---

## 📋 Document Metadata
- **Purpose**: Record task categories boundaries.
- **Version**: 1.0.0

*I build before burning.*
