---
name: frontend-design-guardian
description: Create and validate DESIGN.md, audit frontend hierarchy and tokens, inspect desktop/mobile screenshots, detect generic AI design patterns, calculate evidenced visual acceptance scores, and produce prioritized revisions. Use for landing-page, dashboard, responsive, accessibility, or visual acceptance work. Experimental; invoke manually and require an independent verification pass.
---

# Frontend Design Guardian

## Workflow

1. Read the project profile, route contract, and corresponding design-system reference.
2. Define the business objective, audience, primary action, and threshold.
3. Create or validate DESIGN.md against `docs/specifications/DESIGN_MD_STANDARD.md`.
4. Audit existing tokens, components, responsive behavior, imagery, and interaction states.
5. Review references without executing untrusted code or copying brand identity.
6. Capture desktop and mobile screenshots outside tracked source folders.
7. Score every rubric category with explicit evidence using `design-review-rubric.md`.
8. Return `pass` only when the threshold is met, required evidence exists, an independent reviewer is recorded, and blockers are empty.
9. Otherwise return `revise` with the highest-impact defects first.

Read the appropriate checklist for landing pages, dashboards, responsive behavior, and accessibility. Follow `screenshot-review-protocol.md` for evidence. Do not activate automatically and do not approve the implementing agent's initial work without an independent pass.
