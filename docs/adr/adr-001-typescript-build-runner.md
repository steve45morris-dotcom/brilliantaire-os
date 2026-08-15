# ADR 001: Use TypeScript for brilliantaire-os

- **Status:** APPROVED
- **Date:** 2026-05-29
- **Author:** OS Architect

## Context
The platform requires clear static types and modular interfaces across all local automation scripts to prevent runtime failures during execution cycles.

## Decision
All core automation, validation, and dashboard export tools will be built in TypeScript (`.ts`) and compiled using standard TSConfig options.

## Consequences
- Requires a compilation step before executing scripts or pushing code.
- Ensures IDE code assistance and strict type mapping.
