# Coverage Report
`Date: 2026-07-06` | `Tool: vitest + @vitest/coverage-v8 3.2.6` | `Status: MEASURED`

---

## Summary

| Package | % Stmts | % Branch | % Funcs | % Lines | Status |
|---|---|---|---|---|---|
| shared | 100.00 | 100.00 | 100.00 | 100.00 | ✅ PASS |
| ai | 83.52 | 60.00 | 87.50 | 83.52 | ✅ PASS |
| decision | 75.00 | 75.00 | 100.00 | 75.00 | ⚠️ BELOW 80% |
| learning | 73.61 | 69.23 | 100.00 | 73.61 | ⚠️ BELOW 80% |
| services | 62.29 | 77.77 | 58.82 | 62.29 | ⚠️ BELOW 80% |
| database | 60.00 | 100.00 | 26.66 | 60.00 | ⚠️ BELOW 80% |
| web-app | 33.99 | 60.00 | 85.71 | 33.99 | ⚠️ BELOW 80% |

## Files Below 80% Line Coverage

### ai package
| File | % Lines | Uncovered Lines |
|---|---|---|
| safety/index.ts | 58.82 | 11-17 |
| telemetry/index.ts | 72.72 | 33-35, 37-39, 41-43 |
| runtime/index.ts | 78.04 | 36, 48-51, 86-95, 98 |

### database package
| File | % Lines | Uncovered Lines |
|---|---|---|
| mappers/index.ts | 57.50 | 4-11, 32-40 |
| repositories/index.ts | 61.25 | 79-80, 85-86, 91-92 |

### services package
| File | % Lines | Uncovered Lines |
|---|---|---|
| src/errors/index.ts | 50.00 | 3-5 |
| src/briefing/index.ts | 60.00 | 4-5 |
| src/learning/index.ts | 60.00 | 4-5 |
| src/integrations/index.ts | 78.12 | 28-30, 42-43, 53-54, 67-69, 81-82, 92-93 |

### learning package
| File | % Lines | Uncovered Lines |
|---|---|---|
| profile/index.ts | 62.00 | 16-26, 31, 54-60 |

### decision package
| File | % Lines | Uncovered Lines |
|---|---|---|
| index.ts | 75.00 | 21-30, 35 |

### web-app
| File | % Lines | Uncovered Lines |
|---|---|---|
| hooks/use-focus-session.ts | 2.25 | 13-152 |
| lib/api/errors.ts | 71.42 | 8-9 |
| lib/timeline/format.ts | 77.77 | 7-8 |

## Aggregate Metrics

| Metric | Value |
|---|---|
| Total test files | 15 |
| Total test cases | 42 |
| Test failures | 0 |
| Packages above 80% lines | 2 of 7 |
| Packages below 80% lines | 5 of 7 |

## Blocker Status

Coverage **tooling is installed and functional**. The blocker (missing `@vitest/coverage-v8`) is resolved.

Coverage **percentages** reveal that 5 of 7 packages are below 80% line coverage. This is a measured finding, not a blocker — the requirement was to install the tool and generate actual metrics, which is now complete.

*Evidence: `npx vitest run --coverage.enabled --coverage.provider=v8` executed per-package 2026-07-06.*

*I build before burning.*
