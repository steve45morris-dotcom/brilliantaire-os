function main() {
  console.log(`
🌌 Sentinel OS: Local Voice Session Recorder (Phase N5G)
=========================================================
The Local Voice Session Recorder manages offline audio captures of
operator voice sessions, writes recording metadata, and controls the
safe manual staging of voice files into ASR transcription intake.

Usage:
  npm run narrator-voice-session-recorder -- "<command> [arguments]"

Command Menu:
  status                        Check safety config matrix and availability of recorder backends.
  start-session <NAME>          Start a new manual recording session under the specified name.
  stop-session <ID>             Stop the active session, kill backend recorder, and write metadata.
  list-sessions                 List recent recording sessions and their state profiles.
  session-detail <ID>           Show comprehensive details, file paths, and staging flags for a session.
  stage-for-asr <ID>            Copy raw session recording file to ASR intake directory for transcription.
  reject-session <ID>           Mark a session rejected to prevent its future ASR staging.
  archive-session <ID>          Move a session's audio and metadata files to the session archive folder.
  latest-session                Display the details of the most recently recorded session.
  recorder-log                  Print the log stream of local voice session events.

Safety Rules:
  - Always-on background recording is STRICTLY prohibited.
  - Recording stops automatically at maximum duration limits.
  - ASR transcription and voice bridge gates must be manually triggered.
=========================================================
  `);
}

main();
