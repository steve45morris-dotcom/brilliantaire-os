# ⚖️ Decision Log

| Decision | Date | Reason | Impact | Reversal Condition |
|---|---|---|---|---|
| **Use TypeScript for brilliantaire-os** | 2026-05-29 | Type safety, IDE support, and cleaner compilation checks | Compilation required, strict types across all scripts | Move back to Vanilla ES Modules if compilation overhead is too high |
| **Use Taskfile.yml as build runner** | 2026-05-29 | Better shell management, clean parameter interpolation compared to npm scripts | Unified CLI entrypoint | Move back to pure npm scripts if Task runner binary is unavailable |
| **Use copied local skills instead of symlinks** | 2026-05-29 | Isolation of configuration and direct availability inside Git | Safe versioning per-project, larger repo size | Symlink if repository storage limits are reached |
| **Maintain Collision Isolation Protocol** | 2026-05-29 | Prevent collision between GEMINI and other CLI systems (Antigravity/Codex) | Isolated `.agents/` and `.gemini/` directories | Re-evaluate if unified cross-platform agents are introduced |
| **Push scaffold to GitHub as first stable baseline** | 2026-05-29 | Secure backup and tracking of initial directory setup | Public visibility on GitHub | Delete remote if source confidentiality becomes required |
| **System Governance Subsystem Integrated** | 2026-06-01 | Architectural drift detection and naming validation compliance | Continuous validation of files, naming, and dependency health | Remove governance validation checks if overhead halts deployment |
