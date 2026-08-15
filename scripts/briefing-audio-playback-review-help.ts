function main() {
  console.log(`
🌌 Sentinel OS: Briefing Audio Playback Review Gate (Phase N5M)
=====================================================================
Enables offline inspection, metadata tracking, and approval transitions
for generated briefing audio files under strict manual controls.

Usage:
  npm run briefing-audio-playback-review -- "<command> [arguments]"

Command Menu:
  status                               Show paths, safety flags, and review queue metrics.
  scan-rendered                        List only the rendered briefing audio files.
  inspect <AUDIO_ID>                   Inspect metadata, file sizes, and review statuses.
  queue-review <AUDIO_ID>              Register and copy a rendered briefing audio into the review queue.
  mark-reviewed <AUDIO_ID>             Flag the queued briefing audio as human-reviewed.
  approve-audio <AUDIO_ID>             Transition a reviewed briefing audio to approved status.
  reject-audio <AUDIO_ID>              Transition a reviewed briefing audio to rejected status.
  review-status <AUDIO_ID>             Display the trace review status of one audio item.
  latest                               Show details of the newest audio item.
  review-summary                       Write queue metrics into a markdown report.
  review-log                           Print recent review events log.

Safety Gate Rules:
  - Audio autoplay is strictly disabled; no media player subprocess is executed.
  - Audio files are kept locally; no cloud uploads, publishes, or transfers are allowed.
  - Audio approval requires the item to first be in 'reviewed' status.
=====================================================================
  `);
}

main();
