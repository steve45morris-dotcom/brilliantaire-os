# Manual Command Execution Sheet

- **Sheet ID:** VRP-20260831-7126
- **Date:** 2026-08-31
- **Generated:** 2026-08-31T12:42:34.660Z
- **Execution Mode:** manual-only
- **Status:** staged (not executed)

---

## Instructions

Run each command below manually in your terminal. Do NOT copy-paste and execute
all at once. Review each command output before proceeding to the next.

## Command Sequence

### Step 1: Check Evidence Source Availability

```bash
# phase12V: Check if evidence source directory exists
ls -la "/home/user/brilliantaire-os/.claude/worktrees/agent-a74579497d47b6d62/outputs/evidence_pack_completion_importer" 2>/dev/null || echo "phase12V source not found"
```

```bash
# phase12W: Check if evidence source directory exists
ls -la "/home/user/brilliantaire-os/.claude/worktrees/agent-a74579497d47b6d62/outputs/evidence_tracker_sync" 2>/dev/null || echo "phase12W source not found"
```

```bash
# phase12X: Check if evidence source directory exists
ls -la "/home/user/brilliantaire-os/.claude/worktrees/agent-a74579497d47b6d62/outputs/evidence_tracker_rerun_planner" 2>/dev/null || echo "phase12X source not found"
```

```bash
# phase13I: Check if evidence source directory exists
ls -la "/home/user/brilliantaire-os/.claude/worktrees/agent-a74579497d47b6d62/outputs/evidence_completion_detector" 2>/dev/null || echo "phase13I source not found"
```

### Step 2: Run Verification Rerun Planner Status

```bash
npx ts-node scripts/grinders-keep-verification-rerun-planner.ts status
```

### Step 3: Compile Verification Rerun Plan

```bash
npx ts-node scripts/grinders-keep-verification-rerun-planner.ts compile-plan
```

### Step 4: Check Verification Status

```bash
npx ts-node scripts/grinders-keep-verification-rerun-planner.ts verification-status
```

### Step 5: Generate Schedule Recommendations

```bash
npx ts-node scripts/grinders-keep-verification-rerun-planner.ts schedule
```

### Step 6: Stage Obsidian Export

```bash
npx ts-node scripts/grinders-keep-verification-rerun-planner.ts obsidian-export
```


## Post-Execution Verification

1. Review each command output for errors or warnings.
2. Verify output files were created in `outputs/grinders_keep_verification_rerun/`.
3. Check logs for any anomalies.
4. Confirm no automated execution occurred.
5. Review rerun plan before scheduling manual tasks.

---

## Safety Notes

- These commands are for HUMAN manual execution only.
- No automated execution is permitted.
- Review each command output before proceeding.
- Stop immediately if any command produces unexpected output.
- This sheet does not execute anything on its own.
