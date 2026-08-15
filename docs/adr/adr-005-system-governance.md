# ADR 005: System Governance Layer Integration

- **Status:** APPROVED
- **Date:** 2026-06-01
- **Author:** OS Architect

## Context
We need to automatically detect naming drift (e.g. legacy name Sentinel OS) and find ghost command files to guarantee repository consistency.

## Decision
Deploy a System Governance Engine that parses registered commands and sweeps directories, compiling reports and validating naming rules.

## Consequences
- Ensures strict canonical naming across all workspaces.
- Slightly increases build time.
