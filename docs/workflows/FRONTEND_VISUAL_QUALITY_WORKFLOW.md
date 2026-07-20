# Frontend Visual Quality Workflow

Business objective -> audience definition -> DESIGN.md -> reference review -> wireframe -> component plan -> implementation -> desktop screenshot -> mobile screenshot -> Design Guardian review -> score -> revision -> regression screenshot -> final verification -> acceptance or rejection.

## Evidence Contract

Use Playwright, browser-harness, or the existing browser acceptance tooling. Capture desktop, mobile, tablet where practical, key interactive states, navigation open, modal state where relevant, and hover/focus where practical. Store screenshots outside tracked source folders unless repository policy explicitly approves committed artifacts.

The implementing agent produces the implementation and evidence. The Design Review Agent invokes Frontend Design Guardian and records the score. Final acceptance requires an independent verification pass, a clean console, intact routes, no unresolved blockers, and the applicable score threshold.
