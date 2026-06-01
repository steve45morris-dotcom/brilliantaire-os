# 🩺 Quarantine Monitoring Continuation Gate

## Purpose
The **Quarantine Monitoring Continuation Gate** establishes a read-only monitoring layer for duplicate files that have been quarantined but are not yet eligible for permanent deletion. This gate ensures that quarantined duplicate briefs are tracked continuously, metrics are refreshed, and any premature pruning attempt is strictly blocked while deletion eligibility remains false.

## Why Monitoring Follows Readiness Failure
Quarantined files must remain in a safe, monitored state for a minimum period before they can be considered for permanent deletion. Since the **Quarantine Deletion Readiness Staging Gate (Phase 12G)** determined that the files are not eligible for deletion (due to insufficient monitoring age or safety rules), this continuation gate ensures they are tracked continuously and safely without unlinking or moving them.

## 🔒 Strict Guardrails (No Deletion Rule)
1. **No Permanent Deletion:** Permanently deleting quarantined files is strictly blocked.
2. **No rm/unlink Commands:** Running `rm` or `unlink` commands on quarantined assets is blocked.
3. **No Quarantine Mutation:** Modifying, deleting, or altering quarantine contents is blocked.
4. **No PROJECTS.md Modifications:** The central registry file `PROJECTS.md` is never edited or appended to by this script.
5. **No Shell Escapes / External APIs:** Arbitrary command execution, external API requests, or dependency downloads are blocked.

## Minimum Monitoring Window
The minimum monitoring period is defined as **7 days**. Files will be flagged as "monitoring active" until this window passes.

## Report Types & CLI Commands
The CLI script supports the following operations:
* `snapshot`: Captures the current quarantine directory state, manifests, checksums, and readiness report parameters.
* `continuation-report`: Updates elapsed quarantine age, calculates remaining monitoring days, and recommends the next audit date.
* `pruning-block`: Formally documents why pruning operations remain blocked and lists the safety conditions needed to lift the block.
* `next-check`: Records the next check schedule and command routes for manual reruns.
* `status`: Prints a summary dashboard of all active continuation metrics.

## Outputs Location
All reports, snapshots, and logs are output to:
* Snapshots: `outputs/cleanup/quarantine_monitoring/snapshots/`
* Reports: `outputs/cleanup/quarantine_monitoring/reports/`
* Logs: `outputs/cleanup/quarantine_monitoring/logs/`

## Future Pruning Boundary
Pruning is blocked in this phase. Any future deletion or pruning phase must be explicitly implemented as a separate execution block, require manual approval, and verify that the monitoring window has passed successfully.
