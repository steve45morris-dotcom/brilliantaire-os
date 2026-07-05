# Performance Benchmark Report
`Status: Measured` | `Date: 2026-07-05` | `Method: pnpm build, du, find, wc`

All values measured from actual tool output. No estimates.

---

## Build Performance

| Metric | Value | Source |
|---|---|---|
| Full monorepo typecheck | 239ms (all cached) | pnpm typecheck via turbo |
| Full test suite | 253ms (all cached) | pnpm test via turbo |
| Full production build | 1.068s (all cached) | pnpm build via turbo |
| Static pages generated | 23 pages | Next.js build output |

## Bundle Size (Production Build)

| Route | Page Size | First Load JS |
|---|---|---|
| / (Home) | 1.54 kB | 88.8 kB |
| /dashboard | 702 B | 88.0 kB |
| /timeline | 3.73 kB | 91.0 kB |
| /focus | 2.97 kB | 90.2 kB |
| /inbox | 1.89 kB | 89.2 kB |
| /review | 3.35 kB | 90.6 kB |
| /knowledge | 704 B | 88.0 kB |
| /settings | 691 B | 88.0 kB |
| /_not-found | 875 B | 88.1 kB |

## Shared Bundle

| Chunk | Size |
|---|---|
| First Load JS shared by all | 87.3 kB |
| framework chunk | 192 KB (on disk) |
| vendor chunk (5b8f0dd8) | 192 KB (on disk) |
| vendor chunk (749) | 132 KB (on disk) |
| polyfills | 128 KB (on disk) |
| main | 128 KB (on disk) |
| CSS total | 20 KB (on disk) |

## Build Output Size

| Metric | Value |
|---|---|
| Total .next directory | 71 MB |

## Source Code Metrics

| Metric | Value |
|---|---|
| Source lines (non-test .ts/.tsx) | 31,991 |
| Test lines (.test.ts/.test.tsx) | 27,194 |
| Test-to-source ratio | 0.85:1 |
| Total test files | 15 |
| Total test cases | 42 |

## UNVERIFIED Metrics

| Metric | Reason |
|---|---|
| Application startup time | No dev server benchmark executed |
| API latency per endpoint | No HTTP benchmark tool run |
| AI orchestration latency | No live AI provider connected |
| Database query latency | No live Supabase instance benchmarked |
| Memory usage at runtime | No profiler attached |

*All measured values from: pnpm build, du -sh, find + wc -l, Next.js build output. Date: 2026-07-05.*

*I build before burning.*