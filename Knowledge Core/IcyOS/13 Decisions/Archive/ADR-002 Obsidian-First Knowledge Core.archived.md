# ADR-002: Obsidian-First Knowledge Core
- **Status**: Accepted
- **Date**: 2026-07-02
- **Author**: Principal Knowledge Architect

---

## Context & Problem
AI assistants are transient. Standard developer loops lose context when new chat instances are booted, forcing developers to repeatedly explain system state, boundaries, and priorities. We need a permanent memory system that persists across years of work and different AI engines.

## Proposed Solution
Establish the Obsidian vault (`Knowledge Core/IcyOS/`) as the central organizational memory, strategic blueprint, and system state index. Code changes follow docs, not vice-versa.

## Alternatives Considered
- **SQL Database State Tracking**: Faster querying but completely opaque to human strategists reading the repo directly without a client UI running.
- **Git Commit Messages Ingestion**: Feasible but lacks structured spec-sheets and product blueprints.

## Consequences
- **Positive**: Complete context persistence, zero historical conversation memory dependency, visual-first documentation maps.
- **Negative**: AI agents must perform sequential file reads on boot, adding context tokens during preflight steps.

---

## 📋 Document Metadata
- **Purpose**: Document key decision regarding primary knowledge storage.
- **Responsibilities**: Enforces documentation-first planning.
- **Dependencies**: None.
- **Relationships**: Informs START_HERE.md and Global Context.
- **Version**: 1.0.0
- **Revision History**:
  - `2026-07-02`: Initialized ADR.
- **Future Review Date**: 2027-07-02
- **Cross References**:
  - [START_HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/START_HERE.md)
  - [Global Context](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/11%20Memory/Global%20Context.md)

*I build before burning.*
