# Capability Evidence Matrix
`Status: Verified` | `Date: 2026-07-05` | `Method: Repository Inspection`

Every row maps a documented capability to its implementation evidence.

---

## Frontend Pages (apps/web)

| Capability | Route | Source File | Has Tests | Verdict |
|---|---|---|---|---|
| Dashboard | /dashboard | (dashboard)/dashboard/page.tsx | No | VERIFIED |
| Timeline | /timeline | (dashboard)/timeline/page.tsx | Yes (3 test files) | VERIFIED |
| Focus Sessions | /focus | (dashboard)/focus/page.tsx | Yes (focus.test.ts) | VERIFIED |
| Inbox Capture | /inbox | (dashboard)/inbox/page.tsx | Yes (inbox.test.ts) | VERIFIED |
| Review & Reflection | /review | (dashboard)/review/page.tsx | Yes (review.test.ts) | VERIFIED |
| Knowledge Base | /knowledge | (dashboard)/knowledge/page.tsx | No | VERIFIED |
| Settings | /settings | (dashboard)/settings/page.tsx | No | VERIFIED |

## API Routes (apps/web/src/app/api)

| Capability | Endpoint | Source File | Has Tests | Verdict |
|---|---|---|---|---|
| Health Check | GET /api/health | api/health/route.ts | Yes (api.test.ts) | VERIFIED |
| Timeline Generation | POST /api/timelines/generate | api/timelines/generate/route.ts | Yes | VERIFIED |
| Timeline Approval | POST /api/timelines/approve | api/timelines/approve/route.ts | Yes | VERIFIED |
| Timeline Regeneration | POST /api/timelines/regenerate | api/timelines/regenerate/route.ts | Yes | VERIFIED |
| Briefing Generation | POST /api/briefings/generate | api/briefings/generate/route.ts | No | VERIFIED |
| Inbox Capture | POST /api/inbox/capture | api/inbox/capture/route.ts | No | VERIFIED |
| Mission Create | POST /api/missions/create | api/missions/create/route.ts | No | VERIFIED |
| Mission Skip | POST /api/missions/skip | api/missions/skip/route.ts | No | VERIFIED |
| Session Start | POST /api/sessions/start | api/sessions/start/route.ts | No | VERIFIED |
| Session Complete | POST /api/sessions/complete | api/sessions/complete/route.ts | No | VERIFIED |
| Review Record | POST /api/reviews/record | api/reviews/record/route.ts | No | VERIFIED |
| Learning Record | POST /api/learning/record | api/learning/record/route.ts | No | VERIFIED |

## Backend Packages

| Package | Modules | Has Tests | Test Count | Verdict |
|---|---|---|---|---|
| @icyos/shared | 9 (primitives, enums, value-objects, entities, errors, api, rpc, realtime, validation) | Yes | 4 | VERIFIED |
| @icyos/ai | 12 (capabilities, 5 providers, runtime, prompts, telemetry, evaluation, safety) | Yes | 4 | VERIFIED |
| @icyos/database | 4 (errors, client, mappers, repositories) | Yes | 2 | VERIFIED |
| @icyos/decision | 2 (routing, engine) | Yes | 3 | VERIFIED |
| @icyos/learning | 3 (metrics, profile, recommendations) | Yes | 2 | VERIFIED |
| @icyos/services | 13 (planning, mission, timeline, session, review, briefing, learning, integrations, notifications, launchkit, missionkits, contextengine, errors) | Yes | 8 | VERIFIED |

## Database (supabase/migrations)

| Migration | File | Verdict |
|---|---|---|
| Extensions | 01_extensions.sql | VERIFIED |
| Enums | 02_enums.sql | VERIFIED |
| Identity | 03_identity.sql | VERIFIED |
| Workspaces | 04_workspaces.sql | VERIFIED |
| Projects & Missions | 05_projects_missions.sql | VERIFIED |
| Timelines & Sessions | 06_timelines_sessions.sql | VERIFIED |
| AI Intelligence | 07_ai_intelligence.sql | VERIFIED |
| Review & Learning | 08_review_learning.sql | VERIFIED |
| Knowledge & Governance | 09_knowledge_governance.sql | VERIFIED |
| Indexes | 10_indexes.sql | VERIFIED |
| Triggers & Functions | 11_triggers_functions.sql | VERIFIED |
| RLS Policies | 12_rls_policies.sql | VERIFIED |
| Seed Data | 13_seed_data.sql | VERIFIED |

## Missing Implementation Report

| Documented Feature | Reference | Status |
|---|---|---|
| Repository/frontend/ directory | START_HERE.md line 56 | MISSING — source lives under apps/web/src |
| Repository/backend/ directory | START_HERE.md line 57 | MISSING — source lives under packages/ |
| Repository/api/ directory | START_HERE.md line 59 | MISSING — API routes under apps/web/src/app/api |
| Repository/integrations/ directory | START_HERE.md line 60 | MISSING — integrations module in packages/services |
| Repository/scripts/ directory | START_HERE.md line 61 | MISSING |
| Repository/tests/ directory | START_HERE.md line 62 | MISSING — tests colocated in source |
| Repository/deployment/ directory | START_HERE.md line 63 | MISSING |
| docs/ content | Root level | EMPTY — only contains docs/superpowers/ |

## Dead Specification Report

| Document | Reference | Exists | Notes |
|---|---|---|---|
| Repository/ subdirectory structure | START_HERE.md lines 54-63 | DEAD | Vault diagram does not match actual monorepo layout |

## Summary

| Category | Total | Verified | Missing | Dead |
|---|---|---|---|---|
| Frontend Pages | 7 | 7 | 0 | 0 |
| API Routes | 12 | 12 | 0 | 0 |
| Backend Packages | 6 | 6 | 0 | 0 |
| Database Migrations | 13 | 13 | 0 | 0 |
| Documentation Paths | 7 | 0 | 7 | 1 |

*Evidence collected via: find, ls, file inspection, grep. Date: 2026-07-05.*

*I build before burning.*