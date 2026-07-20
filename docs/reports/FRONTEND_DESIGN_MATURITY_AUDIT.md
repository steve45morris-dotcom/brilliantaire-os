# Frontend Design Maturity Audit

Date: 2026-07-16. Scope: the eight routes in `WorkspaceLaunchConfig.ts`, their actual dashboard rendering, and adjacent standalone frontend surfaces. The scores are the pre-pilot selection baseline. Fresh browser route checks were run against all eight configured URLs; fixed-viewport pilot evidence is stored under `/private/tmp/frontend-design-guardian-*`.

## System Finding

The registry declares eight routes, but the dashboard does not provide a general workspace router. Before the pilot, no route except Icyflamze had a dedicated render branch. The Joy Beauty Studio baseline failed before rendering product content because the nested URL resolved `./dashboard-data.json` to HTML and produced two JSON syntax errors. The remaining unrelated `/projects/*` routes currently fall through to the Icyflamze shell and produce the same nested-route console errors. `/dashboard` also renders the Icyflamze shell and emitted a duplicate-key warning during the live sweep.

| Project | Route / launch state | Framework, system, and source truth | Responsive / runtime evidence | Strengths | Weaknesses / duplication | Baseline score |
|---|---|---|---|---|---|---:|
| The One System | `/dashboard`; Available | React/Vite dashboard at `dashboard/`; adjacent dedicated UI at `Landing Page Sites/supernova/supernova-command/the-one-system-ui` | Live desktop route rendered without overflow but showed Icyflamze identity and a duplicate-key console warning | Deep operational feature set and mature adjacent cockpit | Registry route points to the wrong product identity; shared shell is overloaded | 30 |
| Icyflamze | `/projects/icyflamze`; Available | Dedicated monolithic React workspace; custom HUD CSS; Space Grotesk and JetBrains Mono | Live route rendered the correct shell without overflow; two nested telemetry JSON errors | Distinct artist system, broad working navigation, strong identity | Oversized component, extensive inline styles, hardcoded data, console errors | 90 |
| ProfBetGeng | `/projects/profbetgeng`; Local Preview | Registry route falls through to Icyflamze; mature adjacent React/Vite/Tailwind app at `Landing Page Sites/tools/profbetgeng-app` | Live route showed wrong identity and two console errors; adjacent app has responsive navigation | Mature adjacent analytics product and clear risk domain | No route integration or frontend path; repeated wrong-shell behavior | 45 |
| TreeGroove Records | `/projects/treegroove`; Local Preview | Registry and workspace data only; no dedicated routed frontend | Live route showed Icyflamze identity and two console errors | Clear label, catalog, workflow, and revenue domain | No brand layer or task-specific UI; generic route behavior | 25 |
| Joy Beauty Studio | `/projects/joy-beauty-studio`; Local Preview | At selection time: registry and workspace data only, with no dedicated component or design contract | Isolated baseline at 1440×1000 and 390×844 showed only `TELEMETRY CONNECTION FAILED` and two syntax errors | Bounded booking purpose made a focused pilot feasible | No Joy identity, services, booking path, imagery, or successful route render | 10 |
| Avatar | `/projects/avatar`; Requires Configuration | Registry and workspace data only; adjacent media pipelines are not connected to this route | Live direct route showed Icyflamze identity and two console errors; registry correctly marks configuration prerequisite | Concrete staged render-pipeline domain | No configured frontend, asset browser, or review experience | 15 |
| Podcast | `/projects/podcast`; Requires Build | Registry and workspace data only; adjacent generators are not wired | Live direct route showed Icyflamze identity and two console errors; registry correctly marks build prerequisite | Real audio-production domain | No built UI, playback, transcript, or editorial controls | 12 |
| AI School | `/projects/ai-school`; Not Available / not launchable | Registry and workspace data only | Direct URL falls through to Icyflamze with two console errors, but launcher correctly blocks use | Launch-state truth is explicit | No launchable frontend, lesson system, or design layer | 5 |

## Selection Decision

The weakest raw score is AI School at 5, followed by Joy Beauty Studio at 10, Podcast at 12, and Avatar at 15. AI School is not launchable, Podcast requires a build, and Avatar requires configuration. Joy Beauty Studio is therefore the weakest eligible Local Preview route. TreeGroove Records is the next eligible candidate at 25. The evidence confirms Joy Beauty Studio as the sole pilot; the other seven frontends remain audit-only.

## Cross-Frontend Patterns

Strengths include the mature Icyflamze workspace, reusable workspace records, an existing shared HUD token layer, and stronger adjacent The One System and ProfBetGeng products. Systemic weaknesses are registry-to-render mismatch, repeated Icyflamze fallthrough, relative telemetry loading on nested routes, extensive inline styling, unused generic workspace UI, and the absence of project-specific design contracts and evidenced visual acceptance gates.

Post-pilot status is recorded separately in `FRONTEND_DESIGN_PILOT_REPORT.md`; it does not alter the pre-pilot ranking used for selection.
