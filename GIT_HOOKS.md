# ⚓ Local Git Hooks: Pre-Push Guard

This document describes the structure, registration, and usage of the local Git pre-push safety hook used in Brilliantaire OS to maintain main branch stability.

---

## 🚫 Why the Hook Exists
The local pre-push hook serves as an automated gatekeeper. It guarantees that code complies with build compilation, system static audit checks, and file asset guard rules before leaving your local workspace. This eliminates risk of pushing oversized binaries or conflict markers to origin.

---

## 🏃 What it Runs
Whenever a developer runs `git push`, Git intercepts the command and executes:
1. **TypeScript Build Compiler (`npm run build`):** Verifies code compiles cleanly.
2. **System Static Audit (`npm run audit`):** Confirms integrity of local capability directories.
3. **Git Asset Safety Audit (`npm run git-asset-audit`):** Inspects the changeset for forbidden folders, oversized assets, secrets, and git conflict markers.

---

## 🔐 Why the Live Hook File is Local-Only
Git does not track files inside the `.git/` metadata folder. Therefore, `.git/hooks/pre-push` is **local-only** and cannot be committed directly to source control. Instead, the repository tracks the hook installer script (`scripts/git-hook-install.ts`) and shell script template (`hooks/pre-push.brilliantaire-template`).

---

## 💻 Git Hook Commands

### 1. View Help and Policy Info
```bash
npm run git-hook-help
```

### 2. Install the Pre-Push Hook
```bash
npm run git-hook-install
```
*This copies the pre-push template to `.git/hooks/pre-push`, flags it as executable (`chmod +x`), and backs up any existing hook configuration.*

### 3. Check Pre-Push Hook Status
```bash
npm run git-hook-status
```
*Checks if the hook exists, has execution permissions, and correctly runs the prepush check pipeline.*

### 4. Uninstall/Disable the Pre-Push Hook
```bash
npm run git-hook-uninstall
```
*Safely moves the hook file to a `.disabled` backup without deleting it permanently.*

---

## 🛡️ Push Stability and Force-Push Warning
Even with the pre-push hook active, **force pushes (`git push --force`) remain strictly forbidden** in ordinary workflows. Force pushing overwrites commit history on the remote branch, which can disrupt parallel developer workspaces and bypass tracking checks. Always review remote branches and verify code sanity using the pre-push check pipeline first.
