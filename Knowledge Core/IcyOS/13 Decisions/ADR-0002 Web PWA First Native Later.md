---
title: ADR-0002 Web PWA First Native Later
version: 1.0.0
status: accepted
tags:
  - adr
  - pwa
---

# ADR-0002: Build Web App/PWA First, Native iOS Later

## ADR ID

ADR-0002

## Date

2026-07-02

## Status

Accepted

## Author

Principal Systems Architect

## Context

IcyOS needs fast iteration, broad accessibility, and mobile capture before deep native integration.

The product must deliver to mobile platforms for quick intent capture and briefings while maintaining a single, rapidly iterable development stack. Building native iOS from day one increases compiler dependencies and slows down layout refinements.

## Decision

Build IcyOS as a Next.js web app / Progressive Web App first.

Native iOS comes later when deeper OS integrations justify the cost.

## Alternatives Considered

- Native iOS first: strongest OS integration and performance, but slower iteration and higher initial build cost.
- React Native: useful cross-platform option, but increases dependency and packaging complexity.
- Desktop first: useful for operators, but weaker mobile capture.

## Consequences

- Positive: single codebase for early product learning.
- Positive: rapid CSS/design iteration.
- Positive: installable desktop and mobile experience through PWA support.
- Negative: direct native OS hooks, such as background voice triggers, wait until native bridges or native app phase.

## Related Documents

- [[Technical Design Document]]
- [[Product Roadmap]]
- [[Native App v1.0]]
- [[MVP Scope]]

## Future Review Date

2027-01-02
