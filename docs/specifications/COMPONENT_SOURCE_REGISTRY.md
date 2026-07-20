# Component Source Registry

Statuses: trusted, approved, experimental, rejected, deprecated. The machine-readable seed is `src/design/ComponentSourceRegistry.ts`.

| Source | Status | License | Policy |
|---|---|---|---|
| Existing One System components | trusted | Project-owned | Reuse when behavior and accessibility fit. |
| shadcn/ui | approved | MIT | Import only the required component, pin a ref, inspect the diff. |
| Launch UI | experimental | MIT | Use as composition reference or isolated pilot after compatibility review. |
| Workspace-specific components | approved | Project-owned | Preserve brand autonomy; pass Guardian review. |
| Magic MCP | experimental | MIT | Do not install or execute automatically; review security and generated output first. |

Every imported component records source, license, version or commit, files added, files modified, dependencies, accessibility status, customization notes, and project usage. Registry approval never waives local code review or browser verification.
