# ADR 002: Use Taskfile.yml as Build Runner

- **Status:** APPROVED
- **Date:** 2026-05-29
- **Author:** OS Architect

## Context
Managing many NPM scripts inside `package.json` gets complex. We need an interpolated command runner that is fast, readable, and isolates subprocess scopes.

## Decision
Use Taskfile (`Taskfile.yml`) as the unified entrypoint for compiling, testing, validating, and executing local platform tasks.

## Consequences
- Requires `task` CLI to be available on developer setups.
- Streamlines task parameters routing and command alias configurations.
