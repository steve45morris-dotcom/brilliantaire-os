import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WRITE_LOG_OUTPUT } from '../config/paths.js';

interface WriteLogData {
  date: string;
  timestamp: string;
  vault: string;
  stagedFilesCount: number;
  writtenFiles: string[];
  skippedFiles: string[];
  warnings: string;
}

function printWriteHistory() {
  console.log("=========================================");
  console.log("📜 WRITE HISTORY LOG: Brilliantaire OS");
  console.log("=========================================");

  if (!fs.existsSync(WRITE_LOG_OUTPUT)) {
    console.log("⚠️ No write logs directory found. Run approve-write first.");
    console.log("=========================================");
    return;
  }

  const files = fs.readdirSync(WRITE_LOG_OUTPUT)
    .filter(f => f.startsWith('write_log_') && f.endsWith('.json'))
    .sort()
    .reverse(); // Reverse sort to show latest first

  if (files.length === 0) {
    console.log("⚠️ No approved write logs recorded yet.");
    console.log("=========================================");
    return;
  }

  for (const file of files) {
    const filePath = path.join(WRITE_LOG_OUTPUT, file);
    try {
      const data: WriteLogData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`\n📅 Date: ${data.date} (Timestamp: ${new Date(data.timestamp).toLocaleTimeString()})`);
      console.log(`   Vault:            ${data.vault}`);
      console.log(`   Staged Files:     ${data.stagedFilesCount}`);
      console.log(`   Approved/Written: ${data.writtenFiles.length}`);
      console.log(`   Warnings:         ${data.warnings}`);
      if (data.writtenFiles.length > 0) {
        console.log(`   Destination files:`);
        data.writtenFiles.forEach(f => {
          // Extract short target
          const cleanF = f.replace(/^- Staged: `[^`]+` -> Written:\s*/, '').replace(/`/g, '');
          console.log(`     - ${cleanF}`);
        });
      }
    } catch (e) {
      console.error(`  ❌ Error reading log file: ${file}`);
    }
  }
  console.log("\n=========================================");
}

printWriteHistory();
