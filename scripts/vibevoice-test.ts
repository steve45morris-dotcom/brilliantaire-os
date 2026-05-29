import fs from 'fs';
import path from 'path';
import { MANUAL_INPUT_DIR } from '../config/vibevoice.js';

function createTestFiles() {
  if (!fs.existsSync(MANUAL_INPUT_DIR)) {
    fs.mkdirSync(MANUAL_INPUT_DIR, { recursive: true });
  }

  const testCases = [
    {
      fileName: 'test_show_daily_brief.txt',
      content: 'show daily brief'
    },
    {
      fileName: 'test_create_sporty_street_script.txt',
      content: 'create sporty street script'
    },
    {
      fileName: 'test_unknown_delete.txt',
      content: 'delete everything now'
    }
  ];

  testCases.forEach(tc => {
    const filePath = path.join(MANUAL_INPUT_DIR, tc.fileName);
    fs.writeFileSync(filePath, tc.content);
    console.log(`📄 Created manual transcript: voice_input/manual/${tc.fileName}`);
  });

  console.log("\n🧪 Test setup completed.");
  console.log("=========================================");
  console.log("Next execution sequence:");
  console.log("  1. Ingest transcripts into the inbox queue:");
  console.log("     npm run vibevoice-transcript");
  console.log("");
  console.log("  2. Scan queue queue commands:");
  console.log("     npm run voice-queue");
  console.log("");
  console.log("  3. Check review-pending list:");
  console.log("     npm run voice-pending");
  console.log("=========================================");
}

createTestFiles();
