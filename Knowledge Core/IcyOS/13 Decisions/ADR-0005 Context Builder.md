# ADR-0005: Context Builder
- **Status**: Accepted
- **Date**: 2026-07-02
- **Author**: Principal AI Governance Architect

---

## Context & Problem
Feeding entire directories into model contexts leads to context window saturation, high API costs, and memory drift.

## Proposed Solution
Deploy the Context Builder (`20 AI Operations/Context Builder.md`) to dynamically assemble compact task-specific packages.

## Alternatives Considered
- **Standard Wildcard Loading (`*`)**: Floods context window with irrelevant specs.

## Consequences
- **Positive**: Low token usage, high model focus accuracy.
- **Negative**: Requires context compilation step.

---

## 📋 Document Metadata
- **Version**: 1.0.0
- **Future Review Date**: 2027-07-02
- **Cross References**:
  - [Context Builder](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/20%20AI%20Operations/Context%20Builder.md)

*I build before burning.*
