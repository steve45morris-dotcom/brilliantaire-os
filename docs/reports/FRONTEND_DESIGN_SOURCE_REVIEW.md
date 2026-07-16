# Frontend Design Source Review

Date: 2026-07-16. Review was read-only against primary repository pages. No repository code was installed or executed, no API keys were used, and adoption still requires a pinned-reference recheck.

| Source | Current evidence | Compatibility, risk, cost, and duplication | Decision and governed use |
|---|---|---|---|
| [VoltAgent/design-md](https://github.com/VoltAgent/design-md) | 3 commits, 13 stars, no releases; no license surfaced in the repository view | Markdown is framework-neutral and low execution risk, but the repository is very small and overlaps the larger collection | **Watch.** Use as reading material only; do not copy or depend on it until license and maintenance expectations are explicit. |
| [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | 60 commits, about 102k stars, MIT; no release stream | Directly useful as a read-only design reference; copying brand identity creates trademark and imitation risk; the collection already exists locally | **Adopt as reference.** Translate principles into project-owned design systems and record visual-source attribution. |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | 2,199 commits, about 117k stars, MIT, 101 releases; latest observed release `shadcn@4.11.0` on 2026-06-08 | Strong React/Tailwind fit and inspectable source; copied-code maintenance, transitive dependencies, and local accessibility changes require per-component review | **Adopt.** Import only a required primitive, pin its source, inspect the diff, and record provenance. |
| [launch-ui/launch-ui](https://github.com/launch-ui/launch-ui) | 261 commits, 795 stars, MIT, 16 releases; latest observed `v2.9.0` on 2026-04-28; React 19/Tailwind 4/Next.js 16 orientation | Useful composition reference, but Next.js assumptions and overlap with shadcn increase adaptation cost | **Pilot.** Use isolated patterns or reference compositions, never the full template by default. |
| [BuilderIO/builder-agent-skills](https://github.com/BuilderIO/builder-agent-skills) | 41 commits, 10 stars, 2 forks, no releases; no license surfaced in the repository view | Skill format is compatible, but Builder-specific workflows, low maturity, and unclear reuse rights make implementation adoption risky | **Watch.** Study patterns only until license, provenance, and maintenance are confirmed. |
| [21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp) | 77 commits, about 5.4k stars, MIT, no releases; repository describes the tool as beta | MCP execution introduces network, credential, generated-code, and supply-chain surfaces; overlaps local component-generation capability and adds external-service dependence | **Reject automatic installation.** A future sandboxed, pinned security pilot may be considered after explicit data-flow review. |

## Registry Reconciliation

The machine-readable registry records MIT for shadcn/ui, Launch UI, and Magic MCP. Launch UI and Magic MCP remain experimental; Magic MCP is not installed and cannot be executed automatically. Sources without a surfaced license remain reference-only.
