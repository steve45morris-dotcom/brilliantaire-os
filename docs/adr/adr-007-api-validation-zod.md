# ADR 007: API Boundary Hardening with Zod

- **Status:** APPROVED
- **Date:** 2026-07-15
- **Author:** Chief Software Architect

## Context
To prevent malformed inputs from causing runtime failures in automation and logic blocks, the system needs strict input validation boundaries.

## Decision
Implement centralized schema validation using Zod. All input payloads entering the core scripts must pass verification against typed schemas defined in `src/validation/request_schemas.ts` before reaching the execution blocks.

## Consequences
- Guarantees data sanity and structures.
- Prevents runtime crashes from invalid input.
- Adds slight verification overhead on tick/invocation.
