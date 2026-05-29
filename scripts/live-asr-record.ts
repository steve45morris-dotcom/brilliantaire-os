import { LIVE_AUDIO_DIR, ACCEPTED_AUDIO_EXTENSIONS } from '../config/live-asr.js';

function printASRRecordInfo() {
  console.log("=================================================================================");
  console.log("🎙️  LIVE MICROPHONE RECORDING (ASR) INTERFACE");
  console.log("=================================================================================");
  console.log("");
  console.log("Placeholder Status:");
  console.log("  Live in-process microphone capture is currently disabled.");
  console.log("  Recording must be handled by a local ASR engine or VibeVoice utility.");
  console.log("");
  console.log("Expected Drop Folder for Transcripts:");
  console.log(`  ${LIVE_AUDIO_DIR}`);
  console.log("");
  console.log("Accepted Audio Input Formats:");
  console.log(`  ${ACCEPTED_AUDIO_EXTENSIONS.join(', ')}`);
  console.log("");
  console.log("Once you drop or output your transcript text (.txt) files in the live/ folder,");
  console.log("run the import command to stage them:");
  console.log("");
  console.log("  npm run live-asr-import");
  console.log("=================================================================================");
}

printASRRecordInfo();
