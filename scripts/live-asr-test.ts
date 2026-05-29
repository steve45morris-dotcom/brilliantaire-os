import fs from 'fs';
import path from 'path';
import { LIVE_AUDIO_DIR } from '../config/live-asr.js';

function createASRTestFiles() {
  if (!fs.existsSync(LIVE_AUDIO_DIR)) {
    fs.mkdirSync(LIVE_AUDIO_DIR, { recursive: true });
  }

  const testCases = [
    {
      fileName: 'live_show_daily_brief.txt',
      content: 'show daily brief'
    },
    {
      fileName: 'live_create_sporty_street_script.txt',
      content: 'create sporty street script'
    },
    {
      fileName: 'live_unknown_delete.txt',
      content: 'delete everything now'
    },
    {
      fileName: 'live_empty.txt',
      content: '   ' // whitespace only to trigger validation rejection
    }
  ];

  testCases.forEach(tc => {
    const filePath = path.join(LIVE_AUDIO_DIR, tc.fileName);
    fs.writeFileSync(filePath, tc.content);
    console.log(`📄 Created live ASR transcript: voice_input/live/${tc.fileName}`);
  });

  console.log("\n🧪 Live ASR Test setup completed.");
  console.log("=========================================");
  console.log("Next execution sequence:");
  console.log("  1. Import live transcripts:");
  console.log("     npm run live-asr-import");
  console.log("");
  console.log("  2. Stage into voice command queue:");
  console.log("     npm run vibevoice-transcript");
  console.log("");
  console.log("  3. Scan queue command actions:");
  console.log("     npm run voice-queue");
  console.log("");
  console.log("  4. Check review-pending list:");
  console.log("     npm run voice-pending");
  console.log("=========================================");
}

createASRTestFiles();
