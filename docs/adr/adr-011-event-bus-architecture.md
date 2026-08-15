# ADR 011: Event Bus Architecture

- **Status:** APPROVED
- **Date:** 2026-07-15
- **Author:** Chief Software Architect

## Context
As the platform expands, components need to notify each other about operational milestones (e.g. mission created, started, day approved). Hardcoupling modules creates dependency loops.

## Decision
Introduce a central type-safe publish/subscribe Event Bus. Modules can publish events and register async listeners without direct references, separating concern blocks.

## Consequences
- Decouples systems and modules.
- Simplifies telemetry integration (telemetry auto-listens to all events).
- Events are type-safe and validated at compile time.
