function main() {
  console.log(`
🌌 Sentinel OS: Briefing Audio Playback Review Gate (Phase N5M)
=====================================================================
Builds a safe local playback review gate for rendered offline briefing audio.
Allows operators to inspect metadata, enqueue files, mark reviewed, and approve or reject.

Usage:
  npm run briefing-audio-playback-review -- "<command> [arguments]"

Command Menu:
  status                               Show paths, safety flags, and review state counts.
  scan-rendered                        Scan and list discovered briefing audio files.
  inspect <AUDIO_ID>                   Inspect metadata, file format, render timestamp, and review state.
  queue-review <AUDIO_ID>              Copy/Register the audio into the playback review queue.
  mark-reviewed <AUDIO_ID>             Flag audio as human-reviewed (required prior to approval).
  approve-audio <AUDIO_ID>             Approve reviewed audio for subsequent delivery packages.
  reject-audio <AUDIO_ID>              Reject audio without deleting the source render file.
  review-status <AUDIO_ID>             Display the detailed lifecycle state of a specific audio item.
  latest                               Show the most recent rendered or reviewed audio.
  review-summary                       Compile review statistics and items list into a markdown report.
  review-log                           Display recent review event logs.

Critical Safety Policy:
  - DO NOT auto-play audio (Auto Playback is hardcoded to false).
  - DO NOT upload audio to cloud services or external servers.
  - DO NOT publish audio or execute any voice commands automatically.
  - Keep all review actions local, manual-first, auditable, and reversible.
=====================================================================
  `);
}

main();
