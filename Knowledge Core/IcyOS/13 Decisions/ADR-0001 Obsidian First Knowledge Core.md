---
title: ADR-0001 Obsidian First Knowledge Core
version: 1.0.0
status: accepted
tags:
  - adr
  - obsidian
---

# ADR-0001: Adopt Obsidian-first Knowledge Core

## ADR ID

ADR-0001

## Date

2026-07-02

## Status

Accepted

## Author

Principal Systems Architect / Principal Knowledge Architect

## Context

IcyOS must coordinate multiple AI agents, client interfaces, development tools, and future implementation phases across months and years. Standard chat history feeds do not persist operating memory, which creates context drift and forces repeated re-explanation.

AI conversation history is temporary. IcyOS needs durable memory that human operators and future AI assistants can read without depending on a previous chat.

## Decision

Adopt the Obsidian-first Knowledge Core as the primary operating memory for IcyOS.

AI assistants must read specifications from the vault during session setup and log meaningful changes to the memory folders at completion.

## Alternatives Considered

- Chat-only memory: too fragile and not durable across sessions.
- Database-only or SQL state tracking: queryable, but less readable for human strategists and future assistants without a client UI.
- Git commit history scanning: useful as a secondary source, but lacks structured product specifications and design maps.
- Repo-only docs without Obsidian conventions: readable, but less effective for knowledge graph navigation.

## Consequences

- Positive: durable, human-readable, AI-readable operating memory.
- Positive: zero reliance on transient chat logs as the source of truth.
- Positive: visual maps and cross-links remain discoverable through standard Markdown.
- Negative: AI assistants must perform sequential preflight reads, adding context-window cost.
- Negative: requires discipline to update memory after meaningful work.

## Related Documents

- [[START HERE]]
- [[Global Context]]
- [[Memory Levels]]
- [[AI Command Protocol]]

## Future Review Date

2027-07-02
