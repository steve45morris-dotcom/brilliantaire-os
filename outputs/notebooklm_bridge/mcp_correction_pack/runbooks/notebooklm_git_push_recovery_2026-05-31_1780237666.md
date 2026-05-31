# NotebookLM Git Push Recovery Runbook

* **Date:** 2026-05-31

| Step | Command | Purpose | Success Condition | Warning |
|---|---|---|---|---|
| 1. Check link connection / DNS | `ping -c 3 github.com` | Check local connection state | Packets successfully received | Do not proceed if offline |
| 2. Check working copy status | `git status` | Verify local commit state | Your branch is ahead or up to date | Address unstaged changes first |
| 3. Check remote destinations configuration | `git remote -v` | Inspect fetch/push target URLs | Endpoints match origin repository target | Verify host endpoints before pushing |
| 4. Execute push command | `git push origin main` | Sync local branch with remote master repository | Everything up-to-date or push succeeds | Do not force push without verification |
| 5. Verify latest remote commit sync | `git log -n 1` | Check local commits match upstream HEAD | Latest commit hash matches remote HEAD history | N/A |

## Execution Guide
Follow these steps in sequence. If DNS or sandbox limitations restrict communication, do not force-push without manual verification of the workspace state.
