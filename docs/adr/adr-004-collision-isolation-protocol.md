# ADR 004: Maintain Collision Isolation Protocol

- **Status:** APPROVED
- **Date:** 2026-05-29
- **Author:** OS Architect

## Context
Multiple workspace CLI systems (Codex, Antigravity, Gemini) run commands in parallel. Resource locks must prevent concurrent file write overlaps.

## Decision
Enforce isolated subfolders (`.agents/` and `.gemini/`) to split state files and prevent execution collisions.

## Consequences
- Prevents resource locks.
- Requires strict paths declarations in configurations.
