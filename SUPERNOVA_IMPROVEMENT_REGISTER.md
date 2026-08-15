# Supernova Improvement Register

This register separates future improvements from the ratified Supernova Executive Intelligence v1.0 baseline. Items listed here are not part of the v1.0 ratification task and must not be implemented without a new approved spec and implementation plan.

## Register

| ID | Improvement | Evidence | Expected Value | Risk | Complexity | Dependencies | Recommended Version | Priority | ADR Required |
|---|---|---|---|---|---|---|---|---|---|
| SIR-001 | Apply `STRATEGIC_WEIGHTS` in initiative scoring. | `config/supernova.ts` defines value/risk/effort weights and `scripts/supernova-strategy-engine.ts` imports them, but `rankInitiatives` uses fixed risk/ROI increments. | Aligns configuration with scoring behavior and makes priority math easier to tune. | Low; changes ranking output and requires updated verification fixtures. | Medium | Supernova scoring spec, representative backlog samples | v1.1 | High | No |
| SIR-002 | Replace fixed report/log date with a configurable run date. | `supernova-strategy-engine.ts` writes `supernova_briefing_2026-06-01.md` and `supernova_log_2026-06-01.md`. | Prevents repeated runs from rewriting the same report and makes history clearer. | Medium; changes artifact names and downstream references. | Medium | Output retention policy, dashboard latest-report convention | v1.1 | High | No |
| SIR-003 | Add dedicated Supernova unit tests. | `npm run test` exits with `No test files found`; no Supernova-specific test files exist. | Protects scoring, report generation, and dashboard injection contracts. | Low | Medium | Vitest test conventions and fixture dashboard data | v1.1 | High | No |
| SIR-004 | Render `supernovaBriefing` in a scoped Mission Control executive briefing area. | Dashboard JSON contains `supernovaBriefing`, but `dashboard/src` has no consumer for that object. | Makes the strategic snapshot visible without replacing the landing page. | Medium; UI changes can drift from design rules. | Medium | Dashboard design review, no landing-page replacement constraint | v1.2 | Medium | No |
| SIR-005 | Add schema validation for `dashboard-data.json` before injection. | The strategy engine parses JSON and writes `supernovaBriefing`, but shape validation is implicit. | Prevents malformed dashboard telemetry from propagating silently. | Low | Medium | JSON schema or TypeScript runtime validator decision | v1.1 | Medium | No |
| SIR-006 | Persist a latest Supernova report pointer. | Current report path is fixed and there is no separate `latest` pointer or manifest. | Improves dashboard and operator discovery of the current briefing. | Low | Small | Output manifest convention | v1.1 | Medium | No |
| SIR-007 | Document Supernova in `SYSTEM_STATUS.md` active capabilities. | Phase 12M exists in source and commands but current status references do not clearly list Supernova v1.0. | Improves repo-level discoverability. | Low | Small | Ratification approval | v1.0.1 | Medium | No |
| SIR-008 | Add command output snapshots for router exact-name behavior. | Router exact-name behavior was verified manually during ratification. | Converts manual evidence into repeatable regression checks. | Low | Small | Test harness availability | v1.1 | Medium | No |
| SIR-009 | Make operational excellence refresh failure more visible in the report. | The engine logs refresh failure but the generated briefing does not surface that warning. | Improves operator trust when strategy output is based on stale dashboard data. | Low | Small | Report template adjustment | v1.1 | Medium | No |
| SIR-010 | Add ADR for future autonomous remediation capability if ever proposed. | v1.0 is advisory only. Any shift from recommendation to action would change blast radius. | Preserves governance boundary and operator approval model. | High | Medium | SENTINEL gate, safety review, new spec | v2.0 | Low until requested | Yes |

## Deferred By Design

The following are explicitly out of scope for v1.0 and are not recommended without a new approved spec:

- Autonomous execution of recommended actions
- New Supernova daemon
- New agents or council members
- External API integration
- Deployment automation
- Landing page replacement
- Obsidian writes
- Service start/stop controls
