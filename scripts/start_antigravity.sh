#!/usr/bin/env bash
set -euo pipefail

cd /Users/alexanderanthony/codex-workspace/projects/brilliantaire-os

agy \
  --add-dir /Users/alexanderanthony/codex-workspace/projects/brilliantaire-os \
  --add-dir /Users/alexanderanthony/Projects/awesome-design-md/design-md/brilliantaire \
  -i \
  --prompt "You are taking over Brilliantaire OS for ICYFLAMZE The Brilliantaire. Read AGENTS.md and ANTIGRAVITY_HANDOFF.md first. The current static UI has been rejected as cheap and unprofessional. Rebuild toward a premium creative technology command system. Before UI work, read /Users/alexanderanthony/Projects/awesome-design-md/design-md/brilliantaire/README.md. Propose a concrete implementation plan, then start by creating a serious Next.js/TypeScript/Tailwind app under web/ while preserving brain/, docs/, and data/ as source material."
