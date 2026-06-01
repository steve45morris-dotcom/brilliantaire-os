function main() {
  console.log(`
🌌 Sentinel OS: Briefing TTS Render Approval Flow (Phase N5L)
=====================================================================
Processes and validates briefing TTS render requests from the scheduled
queue, submits them to the main TTS queue, and handles manual approval and local rendering.

Usage:
  npm run briefing-tts-render-approval -- "<command> [arguments]"

Command Menu:
  status                               Show safety flags, monitored paths, and state counts.
  scan-tts-requests                    Scan and list all generated briefing TTS requests.
  inspect <BRIEFING_ID>                Inspect details of a briefing request, text summary, and voice settings.
  validate <BRIEFING_ID>               Verify source briefing approval status, text length, and formatting.
  submit-to-tts-queue <BRIEFING_ID>    Onboard and submit the briefing TTS request to the Narrator TTS pending queue.
  approve-tts-request <BRIEFING_ID>    Authorize a submitted briefing TTS request for offline rendering.
  render-approved <BRIEFING_ID>        Render the approved briefing TTS request into audio using Piper.
  render-status <BRIEFING_ID>          Display the current trace state of the rendering item.
  latest                               Show the most recent briefing TTS render item status.
  queue-summary                        Compile queue performance metrics into a markdown report.
  render-log                           Show recent rendering event logs.

Safety Gate Rules:
  - Audio rendering is blocked until manual operator approval is given.
  - No cloud-based TTS endpoints are ever hit; all synthesis is 100% offline.
  - Automatic audio playback is disabled.
=====================================================================
  `);
}

main();
