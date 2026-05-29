import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LIVE_AUDIO_DIR,
  LIVE_SESSIONS_DIR,
  LIVE_LOG_DIR,
  MANUAL_TRANSCRIPT_DIR,
  ACCEPTED_TRANSCRIPT_EXTENSIONS,
  MAX_TRANSCRIPT_LENGTH
} from '../config/live-asr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom logs folder path
const LIVE_ASR_LOGS_DIR = path.join(path.dirname(__dirname), 'outputs', 'live_asr_logs');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function writeLiveASRLog(
  sourceFile: string,
  importedFile: string,
  rawPhrase: string,
  length: number,
  status: string
) {
  if (!fs.existsSync(LIVE_ASR_LOGS_DIR)) {
    fs.mkdirSync(LIVE_ASR_LOGS_DIR, { recursive: true });
  }

  const logFile = path.join(LIVE_ASR_LOGS_DIR, `live_asr_log_${getFormattedDate()}.md`);
  const timestamp = new Date().toISOString();

  let entry = `## [${timestamp}] Live ASR Import: "${sourceFile}"\n`;
  entry += `- **Imported Staging File:** \`${importedFile || 'None'}\`\n`;
  entry += `- **Raw Phrase:** \`${rawPhrase}\`\n`;
  entry += `- **Length:** \`${length}\` characters\n`;
  entry += `- **Status:** \`${status}\`\n`;
  entry += `\n---\n\n`;

  fs.appendFileSync(logFile, entry);
}

function normalizeContent(content: string): string {
  return content
    .replace(/\s+/g, ' ')
    .trim();
}

function runImport() {
  const rejectedDir = path.join(LIVE_LOG_DIR, 'rejected');

  // Ensure directories exist
  [LIVE_AUDIO_DIR, LIVE_SESSIONS_DIR, LIVE_LOG_DIR, rejectedDir, MANUAL_TRANSCRIPT_DIR, LIVE_ASR_LOGS_DIR].forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  const files = fs.readdirSync(LIVE_AUDIO_DIR).filter(f => ACCEPTED_TRANSCRIPT_EXTENSIONS.includes(path.extname(f)));

  if (files.length === 0) {
    console.log("📭 No live transcripts found in voice_input/live/.");
    return;
  }

  console.log(`🎙️  Found ${files.length} live transcript(s). Importing...`);

  let importedCount = 0;
  let rejectedCount = 0;

  for (const file of files) {
    const filePath = path.join(LIVE_AUDIO_DIR, file);
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const normalized = normalizeContent(rawContent);

    console.log(`\n📄 File: ${file}`);
    console.log(`   Content: "${normalized}"`);

    // 1. Reject empty transcripts
    if (!normalized) {
      const status = 'Rejected: Empty transcript';
      console.error(`❌ ${status}`);
      writeLiveASRLog(file, '', '', 0, status);
      
      // Move to live_logs/rejected/
      const destRejected = path.join(rejectedDir, file);
      fs.renameSync(filePath, destRejected);
      rejectedCount++;
      continue;
    }

    // 2. Reject transcripts exceeding length
    if (normalized.length > MAX_TRANSCRIPT_LENGTH) {
      const status = `Rejected: Exceeds MAX_TRANSCRIPT_LENGTH (${MAX_TRANSCRIPT_LENGTH})`;
      console.error(`❌ ${status}`);
      writeLiveASRLog(file, '', normalized, normalized.length, status);

      // Move to live_logs/rejected/
      const destRejected = path.join(rejectedDir, file);
      fs.renameSync(filePath, destRejected);
      rejectedCount++;
      continue;
    }

    // 3. Import valid transcript
    // Copy to manual/ (staging directory for VibeVoice)
    const destManual = path.join(MANUAL_TRANSCRIPT_DIR, file);
    fs.writeFileSync(destManual, normalized);

    // Archive to live_sessions/
    const destArchive = path.join(LIVE_SESSIONS_DIR, file);
    fs.writeFileSync(destArchive, normalized);

    // Remove from live/
    fs.unlinkSync(filePath);

    const status = 'Imported';
    console.log(`✅ Imported successfully to manual/: ${file}`);
    writeLiveASRLog(file, file, normalized, normalized.length, status);
    importedCount++;
  }

  console.log(`\n🎉 Import session complete. Imported: ${importedCount}, Rejected: ${rejectedCount}.`);
  console.log("💡 Next Step: Run the transcript processor command manually:");
  console.log("   npm run vibevoice-transcript");
}

runImport();
