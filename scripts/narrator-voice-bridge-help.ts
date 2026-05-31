import { ALLOWED_COMMAND_ROUTER_ENTRIES } from '../config/narrator-voice-bridge.config.js';

function main() {
  console.log(`
🎙️ Sentinel OS: Voice Command Approval Bridge (Phase N5E)
===========================================================
The Voice Command Approval Bridge acts as a manual safety gate
that inspects, validates, prepares, and dispatches approved 
ASR voice commands safely to the local exact-name command router.

Usage:
  npm run narrator-voice-bridge -- "<command> [arguments]"

Command Menu:
  status                     Show bridge configuration, paths, safety configurations, and depths.
  scan-approved              Scan and list all approved packets waiting in the ASR approved queue.
  inspect <PACKET_ID>        Display transcript payload, mapped CLI command, confidence score, and age.
  validate <PACKET_ID>       Check mapped CLI command against the safety checklist (forbidden characters, whitelist, age).
  prepare <PACKET_ID>        Run validation checklist and stage the packet to 'ready' folder for manual run.
  execute-approved <PACKET>  Safely run the allowlisted exact-name CLI command and update the audit ledger.
  reject <PACKET_ID>         Manually block execution and move the packet file into the bridge rejected queue.
  bridge-queue-status        Show statistics of packets in approved, ready, executed, and rejected states.
  audit-log                  List the latest bridge execution and rejection log entries.

Execution Whitelist Rules:
  Only exact whitelisted commands configured in narrator-voice-bridge.config are allowed.
  Arbitrary shell chaining, redirects, pipes, or unregistered script parameters will be blocked.

Current Allowlist Mapped Commands:
${ALLOWED_COMMAND_ROUTER_ENTRIES.map(c => `  - ${c}`).join('\n')}

Example Workflow:
  1. Scan incoming:   npm run narrator-voice-bridge -- "scan-approved"
  2. Inspect packet:  npm run narrator-voice-bridge -- "inspect 2026-05-31_0801"
  3. Validate packet: npm run narrator-voice-bridge -- "validate 2026-05-31_0801"
  4. Prepare packet:  npm run narrator-voice-bridge -- "prepare 2026-05-31_0801"
  5. Check queues:    npm run narrator-voice-bridge -- "bridge-queue-status"
  6. Dispatch run:    npm run narrator-voice-bridge -- "execute-approved 2026-05-31_0801"
  7. Audit log:       npm run narrator-voice-bridge -- "audit-log"
===========================================================
  `);
}

main();
