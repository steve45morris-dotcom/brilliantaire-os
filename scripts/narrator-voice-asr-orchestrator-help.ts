function main() {
  console.log(`
🌌 Sentinel OS: Voice Session to ASR Pipeline Orchestrator (Phase N5H)
=====================================================================
The Voice ASR Orchestrator coordinates offline voice recordings, ASR transcribing
actions, and VNP command staging, enforcing strict manual reviews.

Usage:
  npm run narrator-voice-asr-orchestrator -- "<command> [arguments]"

Command Menu:
  status                               Check config safety metrics, paths, and backend states.
  scan-sessions                        Scan sessions and map their progress across the pipeline.
  session-pipeline <SESSION_ID>        Show the detailed progress card for a specific voice session.
  dispatch-asr <SESSION_ID>            Copy voice session audio to ASR intake (duplicate-protected).
  transcribe-session <SESSION_ID>      Run Whisper backend on audio to generate raw text transcript.
  stage-transcript <SESSION_ID>        Convert raw transcript into a structured staged VNP packet.
  review-session <SESSION_ID>          Inspect staged command risk category and safety parameters.
  approve-session-command <SESSION_ID> Mark staged packet as ASR Approved, making it bridge-ready.
  reject-session-command <SESSION_ID>  Mark staged packet as Rejected to prevent bridge preparation.
  pipeline-status                      Show counts across all stages (staged, transcribed, etc.).
  latest-pipeline                      Display details of the newest session in the pipeline.
  orchestrator-log                     Print recent orchestrator logging events.

Safety Policy:
  This orchestrator STOPS at the ASR Approval gate. Command execution dispatches
  must be triggered manually via Voice Bridge confirm commands (Phase N5F).
=====================================================================
  `);
}

main();
