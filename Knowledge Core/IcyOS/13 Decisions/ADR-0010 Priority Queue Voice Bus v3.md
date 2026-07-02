# ADR-0010: Priority Queue Voice Bus v3
- **Status**: Accepted
- **Date**: 2026-06-06
- **Author**: AI Infrastructure Engineer

---

## Context & Problem
The old voice bridge had race conditions and voice daemon process churn. Parallel agent speech triggers overlapped, causing garbled text-to-speech output and duplicate logs. We need a synchronized, prioritized queue that runs on zsh/node runtimes.

## Proposed Solution
Deploy Priority Queue Voice Bus v3 using a microsecond-precision queue folder `/tmp/voice_bus_queue/`, locking mechanisms, and priority levels (P1-P4).

## Alternatives Considered
- **HTTP Voice Server API**: Runs smoothly but introduces network overhead and local port exposure risks.
- **Sequential print statements**: Zero audio feedback, violating the Voice Narrative Protocol.

## Consequences
- **Positive**: Coordinated audio narration, zero race conditions, emergency override preemption for P1 alarms.
- **Negative**: Relies on temp directories that require cleanup scripts.

---

## 📋 Document Metadata
- **Purpose**: Document key decision regarding priority voice bus serialization.
- **Responsibilities**: Enforces Voice Narrative Protocol.
- **Dependencies**: None.
- **Relationships**: Informs AI Specifications.
- **Version**: 1.0.0
- **Revision History**:
  - `2026-06-06`: Initialized ADR.
- **Future Review Date**: 2027-06-06
- **Cross References**:
  - [AI Intelligence Specification](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/03%20AI%20Department/AI%20Intelligence%20Specification.md)

*I build before burning.*
