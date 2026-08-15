# ADR 003: Use Copied Local Skills Instead of Symlinks

- **Status:** APPROVED
- **Date:** 2026-05-29
- **Author:** OS Architect

## Context
Sharing custom skills across project contexts can cause accidental overrides if directories are symlinked.

## Decision
Locally copy skill folders directly to project folders. Git track skill changes inside the local repository.

## Consequences
- Increases overall repository size.
- Prevents cross-context contamination and ensures version stability per-project.
