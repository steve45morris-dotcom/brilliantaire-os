# ⚖️ Truth Enforcement Rules
`Status: Authoritative` | `Scope: Governance`

This document defines the strict rules governing system claims within IcyOS.

---

## 📋 The Unified Truth Rule
> A system component only exists if and only if it satisfies ALL of the following criteria:
> 1. **Compiled by TypeScript**: Integrated within tsconfig scope with complete type safety checking.
> 2. **Included in Test Suite**: Backed by assertions in the vitest execution cycle.
> 3. **Reachable via Runtime Import**: Included in the services barrel exports without circular loops.
> 4. **Validated in CI**: Checked automatically on Turborepo runs.
> 5. **Referenced by Execution Path**: Triggered directly by Next.js API routes or component hooks.

---

## 🚦 Documentation Enforcement
All text specifications, memory states, and ADRs must list mock, simulated, or missing integrations explicitly. No document may claim an interface is "Operational" or "Functional" unless backed by verified source lines.

*I build before burning.*
