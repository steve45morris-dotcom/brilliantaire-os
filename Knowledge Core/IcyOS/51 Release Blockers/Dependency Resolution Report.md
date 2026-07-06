# Dependency Resolution Report
`Date: 2026-07-06` | `Tool: pnpm audit` | `Status: RESOLVED`

---

## Action Taken

| Package | Previous | Upgraded To | Reason |
|---|---|---|---|
| next | ^14.0.0 | ^15.5.16 | 7 high-severity DoS advisories (CVE-2024-*) |
| react | ^18.2.0 | ^19.1.0 | Required peer dependency for Next.js 15 |
| react-dom | ^18.2.0 | ^19.1.0 | Required peer dependency for Next.js 15 |
| @types/react | ^18.2.0 | ^19.1.0 | Type alignment with React 19 |
| vitest (×7) | ^0.30.0 | ^3.2.6 | GHSA-5xrq-8626-4rwp prototype pollution |
| zod (shared) | ^3.25.76 | ^3.22.0 | Version mismatch with other packages |

## Additional Changes

| Change | File | Reason |
|---|---|---|
| Added `@vitest/coverage-v8` ^3.2.6 | package.json (root) | Coverage measurement tooling |
| Added `@playwright/test` ^1.52.0 | apps/web/package.json | E2E testing framework |
| Added `pnpm.onlyBuiltDependencies` | package.json (root) | Suppress ERR_PNPM_IGNORED_BUILDS |
| Added `.turbo/`, `.vscode/`, `.idea/` | .gitignore | Close security audit findings |

## Audit Before Upgrade

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 7 |
| Moderate | 13 |
| Low | 5 |
| **Total** | **26** |

## Audit After Upgrade

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Moderate | 2 |
| Low | 1 |
| **Total** | **3** |

## Remaining Vulnerabilities

| # | Severity | Package | Advisory | Resolution |
|---|---|---|---|---|
| 1 | Moderate | postcss | XSS via unescaped `</style>` in CSS | Awaiting postcss upstream patch |
| 2 | Moderate | turbo | Login callback CSRF/session fixation | Awaiting turbo upstream patch |
| 3 | Low | turbo | Unexpected local code execution during Yarn | Awaiting turbo upstream patch; pnpm not affected |

All 3 remaining vulnerabilities are in transitive dependencies with no safe upgrade path available. None are critical or high severity.

## Target Achievement

- **Zero critical vulnerabilities**: ✅ ACHIEVED
- **Zero high vulnerabilities**: ✅ ACHIEVED

*Evidence: `pnpm audit` executed 2026-07-06. Output: "3 vulnerabilities found. Severity: 1 low | 2 moderate"*

*I build before burning.*
