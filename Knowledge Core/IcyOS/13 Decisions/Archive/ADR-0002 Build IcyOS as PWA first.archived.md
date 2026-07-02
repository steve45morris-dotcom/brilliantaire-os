# ADR-0002: Build IcyOS as web app/PWA first, native iOS later
- **Status**: Accepted
- **Date**: 2026-07-02
- **Author**: Principal Systems Architect

---

## Context & Problem
We need to deliver IcyOS to mobile platforms (iOS) for quick intent captures and briefings, while maintaining a single, rapidly iterable development stack. Building native iOS apps from day one increases compiler dependencies and slows down layout refinements.

## Proposed Solution
Build IcyOS as a Next.js Progressive Web App (PWA) first. This allows native-like installs on iOS/macOS (via Safari PWA hooks) with offline caching capability, while deferring native Swift/iOS codebase builds to Phase 2.

## Alternatives Considered
- **React Native**: Good cross-platform capability but increases package.json dependency clutter.
- **Native Swift/iOS from Phase 1**: Optimal performance, but very high initial build costs and restricts deployment to Apple environments.

## Consequences
- **Positive**: Single codebase, rapid CSS design changes, instant desktop and mobile installs.
- **Negative**: Lacks direct native OS hooks (e.g. background voice triggers) which will require native bridges in Phase 2.

---

## 📋 Document Metadata
- **Version**: 1.0.0
- **Future Review Date**: 2026-10-02
- **Cross References**:
  - [Technical Design Document](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Technical%20Design%20Document.md)

*I build before burning.*
