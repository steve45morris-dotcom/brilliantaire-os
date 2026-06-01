function main() {
  console.log(`
🌌 Sentinel OS: Voice Ops Scheduled Briefing Queue (Phase N5K)
=====================================================================
Stages daily or manual briefing jobs from the Voice Ops report system into
a controlled queue, requiring manual confirmation for approval and TTS request generation.

Usage:
  npm run voice-ops-scheduled-briefing -- "<command> [arguments]"

Command Menu:
  status                               Show queue health, safety flags, and pending count.
  create-daily                         Stage a briefing queue item from today's latest Voice Ops Daily Report.
  create-date <YYYY-MM-DD>             Stage a briefing queue item from a specific date report.
  list-queue                           List pending, approved, rejected, and TTS-requested briefings.
  inspect <BRIEFING_ID>                Inspect briefing source report, proposed summary text, and risk level.
  approve <BRIEFING_ID>                Approve and move pending briefing into the approved folder.
  reject <BRIEFING_ID>                 Reject and move pending briefing into the rejected folder.
  generate-tts-request <BRIEFING_ID>   Create a TTS render queue request for an approved briefing.
  queue-summary                        Write a markdown summary file of briefing queue states.
  latest                               Show details of the newest briefing queue item.
  briefing-log                         Print recent briefing event logs.

Safety Policy:
  This queue manager is strictly READ-ONLY on actions. Staging a briefing job
  does not automatically render TTS audio or execute voice commands.
=====================================================================
  `);
}

main();
