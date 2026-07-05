# Security Audit Report
`Status: Measured` | `Date: 2026-07-05` | `Method: pnpm audit, grep, git ls-files`

All findings from executed tooling. No estimates.

---

## Dependency Audit (pnpm audit)

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 7 |
| Moderate | 13 |
| Low | 5 |
| **Total** | **26** |

### Key Vulnerabilities

| Package | Severity | Advisory | Fix |
|---|---|---|---|
| next | High | HTTP request deserialization DoS (GHSA-h25m-26qc-wcjf) | Upgrade to >=15.0.8 |
| next | High | DoS with Server Components (GHSA-q4gf-8mx6-v5v3) | Upgrade to >=15.5.15 |
| next | High | DoS with Server Components (GHSA-5xrq-8626-4rwp) | Upgrade to >=15.5.16 |
| vitest (transitive) | Moderate | Multiple paths across 7 packages | Upgrade vitest |

## Secret Scan

| Check | Result |
|---|---|
| Hardcoded SUPABASE_KEY in source | None found |
| Hardcoded API_KEY in source | None found |
| Hardcoded SECRET_KEY in source | None found |
| Hardcoded PASSWORD in source | None found |
| .env files committed to git | None (no .env files exist on disk) |

**Method**: `grep -rn` across all .ts, .tsx, .js, .env files excluding node_modules.

## .gitignore Assessment

| Entry | Status |
|---|---|
| .env / .env.* | Covered |
| !.env.example | Exception (correct) |
| node_modules/ | Covered |
| .next/ | Covered |
| dist/ | Covered |
| coverage/ | Covered |
| .DS_Store | Covered |
| *.log | Covered |
| .turbo/ | MISSING |
| .vscode/ / .idea/ | MISSING |

## Dependency Count

| Metric | Value |
|---|---|
| Total dependency entries (all package.json) | 44 |
| Unique external packages | 15 |
| Workspace packages | 6 |

## Version Consistency

| Package | Version in shared | Version elsewhere | Risk |
|---|---|---|---|
| zod | ^3.25.76 | ^3.22.0 | Low — semver compatible but inconsistent |

## UNVERIFIED Security Checks

| Check | Reason |
|---|---|
| Authentication tests | No auth integration tests exist |
| Authorization tests | No RBAC/RLS runtime tests exist |
| CSRF protection | UNVERIFIED — no middleware tests |
| Rate limiting | UNVERIFIED — no implementation found |
| Input sanitization | Zod validation present but not penetration tested |

*All findings from: pnpm audit, grep -rn, .gitignore inspection. Date: 2026-07-05.*

*I build before burning.*