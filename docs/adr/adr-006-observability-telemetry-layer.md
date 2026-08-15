# ADR 006: Observability Telemetry Layer Integration

- **Status:** APPROVED
- **Date:** 2026-06-01
- **Author:** OS Architect

## Context
We need to monitor local CPU, memory usage, queue depths, and vocal bridge latency historically to identify bottlenecks.

## Decision
Deploy a collector daemon that records metrics and writes them to a local JSON metrics database, exporting trends to Mission Control.

## Consequences
- Simplifies operational awareness and tracking over time.
- Requires log retention policy of 30 days to avoid file size growth.
