# ADR-0001: Adopt Obsidian-first Knowledge Core
- **Status**: Accepted
- **Date**: 2026-07-02
- **Author**: Principal Systems Architect

---

## Context & Problem
We need to coordinate multiple AI agents, client interfaces, and development tools across months and years. Standard chat history feeds do not persist memory, resulting in context drift. We need a permanent local repository representing the company's operating memory.

## Proposed Solution
Adopt the Obsidian Knowledge Core (`Knowledge Core/IcyOS`) as the primary operating memory of IcyOS. AI assistants must read specifications from the vault on session setup and log changes to the memory folders at completion.

## Alternatives Considered
- **Central SQL Database**: OP for query execution, but poor human-readability.
- **Commit History Scanning**: Feasible, but lacks structured product specifications and design maps.

## Consequences
- **Positive**: Complete context preservation, zero reliance on transient chat logs, visual maps discoverable via standard markdown files.
- **Negative**: AI assistants must perform sequential folder reads on boot, adding context window tokens.

---

## 📋 Document Metadata
- **Version**: 1.0.0
- **Future Review Date**: 2027-07-02
- **Cross References**:
  - [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md)
  - [Global Context](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/11%20Memory/Global%20Context.md)

*I build before burning.*
