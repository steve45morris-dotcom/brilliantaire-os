# Home-Root Repository: Structural Risk Assessment

Date: 2026-07-20
This is an architectural recommendation only. No migration was performed or is recommended for immediate execution.

## Current architecture

`/Users/alexanderanthony` (`$HOME`) is the Git root for the public repo `brilliantaire-os`. This is intentional, not accidental: ~130 top-level entries are deliberately tracked (`.agents/`, `bin/`, `config/`, `dashboard/`, `docs/`, `Documents/` (partially), `hooks/`, `Knowledge Core/`, `outputs/`, `projects/`, `reports/`, `scripts/`, `sentinel-os/`, `skills/`, `src/`, `templates/`, plus dozens of root-level architecture/spec `.md` files), and multiple pieces of tooling (the `gstack` skill install, `.claude/` session state, various scripts) already assume and reference this location.

## Why this is structurally risky regardless of today's clean audit

1. **Every new tool, credential store, or cache that lands in `$HOME` becomes an in-boundary risk by default**, not an out-of-boundary one. A conventional project root only has this problem for things explicitly placed inside it; this repo has it for anything a user, an OS, or any of the dozens of AI-agent CLIs on this machine (`.claude`, `.codex`, `.gemini`, `.cursor`, `.antigravity*`, `.hermes`, etc. — 91 such directories found in the last audit) ever writes to `$HOME`.
2. **The `.gitignore` model this repo needs is fundamentally different from a normal project's.** A normal repo's `.gitignore` is a short deny-list of generated artifacts layered on an implicit "everything is fair game to track" default. A home-rooted repo needs the opposite posture — a broad deny-by-default with an explicit allow-list of the ~24 real project directories — because the space of "things that might appear in `$HOME` and must never be tracked" is unbounded and constantly growing (new CLI tools install new dotfiles regularly; this session alone added `.gstack/` state from a fresh `gstack` upgrade).
3. **The containment applied today (this session) is allow-by-default, deny-explicitly** — it protects the specific paths identified in this pass (`~/.ssh`, `~/.aws`, OS folders, common caches). It does **not** protect against the next new tool that writes a credential-bearing dotfile to `$HOME` next month. That gap is structural, not a mistake in today's fix.
4. **210 nested git repositories exist under this root** (see the prior hygiene audit), all currently untracked by the parent, none flagged by today's forensic history check — but every one of them is a `git add -A` away from becoming a broken embedded gitlink if a future bulk-staging operation isn't inspected first (Phase 7 of the containment task addresses the operational mitigation for this).

## Options

### A. Migrate to a dedicated project repository root

Move the ~24 legitimate tracked directories into a purpose-built root (e.g. `~/brilliantaire-os/`), leaving `$HOME` itself outside any Git boundary.

- **Pros:** Eliminates the structural risk category entirely — the repo can never accidentally contain `~/.ssh` again, because it's not rooted there. Matches how every other project on this machine is structured.
- **Cons:** Significant one-time migration cost — every tool, script, and skill that currently assumes paths relative to `$HOME` as the repo root (this session found several: `gstack`'s CLAUDE.md discovery, various `scripts/*.ts` with home-relative assumptions) would need updating. High blast radius for a single migration event; genuinely risky to execute casually. Not attempted in this task per instructions.

### B. Controlled monorepo root (partial migration)

Keep `$HOME` as the practical working directory for the user, but re-root the actual Git repository at a stable subdirectory (e.g. `~/brilliantaire-os/` as a symlink target, or literally moving tracked content there while leaving tool-config dotfiles in `$HOME` untouched).

- **Pros:** Smaller blast radius than full migration — most of the ~130 tracked entries could move as a unit; tool dotfiles that must stay in `$HOME` for their own tooling reasons (`.ssh`, `.aws`, `.claude`, etc.) never need to be reasoned about as "in or out of repo scope" again.
- **Cons:** Still a real migration with path-reference updates; some tooling may specifically expect the repo root to equal `$HOME` (worth auditing before committing to this path).

### C. Continued home-root operation with strict deny-by-default exclusions

Keep the current architecture, but evolve today's allow-by-default `.gitignore` (deny a growing list of specific dangerous paths) into a deny-by-default one: `.gitignore` starts with `/*` (ignore everything at root), then explicit `!/<dir>/` allow-lines for each of the ~24 legitimate tracked directories.

- **Pros:** No migration cost, no path-reference breakage. Structurally closes the "next new tool's dotfile" gap from point 3 above — a new CLI tool writing `.newtool/` to `$HOME` is invisible to Git by default instead of needing to be individually discovered and added to a deny-list after the fact.
- **Cons:** Requires careful construction (deny-by-default `.gitignore` patterns interact subtly with `!`-negation and directory-vs-file matching; a mistake here could hide a legitimate new top-level project directory instead of a dotfile). Needs to be built and tested as its own deliberate change, not folded into this containment pass. Every future legitimate new top-level project directory requires an explicit `.gitignore` allow-line, which is a minor ongoing friction traded for the safety gain.

## Recommendation

No migration in this task, per instructions. Of the three options, **C (deny-by-default `.gitignore`) is the best risk-adjusted next step** if the home-root architecture is to continue: it closes the structural gap (point 3 above) without the blast radius of A or B, at the cost of a deliberate, carefully-tested follow-up change — not something to attempt inside a containment/audit task. **A or B** are worth reconsidering only if this repository's scope keeps growing in a way that makes the home-root assumption increasingly awkward for tooling (worth revisiting in a few months, not urgent now).

Either way: today's allow-by-default fix is the right *immediate* action (it closes the specific, confirmed-real `.ssh`/`.aws` exposure right now) — it is not a substitute for eventually deciding between A, B, and C.
