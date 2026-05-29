import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  MANUAL_INPUT_DIR,
  TRANSCRIPTS_DIR,
  VOICE_QUEUE_INBOX,
  VIBEVOICE_LOG_DIR,
  ACCEPTED_EXTENSIONS,
  TRANSCRIPT_PREFIX,
  MAX_TRANSCRIPT_LENGTH
} from '../config/vibevoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFormattedDateTime(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hour}${min}${sec}`;
}

function writeVibeVoiceLog(
  sourceFile: string,
  stagedFile: string,
  rawPhrase: string,
  length: number,
  status: string
) {
  if (!fs.existsSync(VIBEVOICE_LOG_DIR)) {
    fs.mkdirSync(VIBEVOICE_LOG_DIR, { recursive: true });
  }

  const logFile = path.join(VIBEVOICE_LOG_DIR, `vibevoice_log_${getFormattedDate()}.md`);
  const timestamp = new Date().toISOString();

  let entry = `## [${timestamp}] VibeVoice Transcript Ingested: "${sourceFile}"\n`;
  entry += `- **Staged Command File:** \`${stagedFile || 'None'}\`\n`;
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

function runIngest() {
  // Ensure directories exist
  [MANUAL_INPUT_DIR, TRANSCRIPTS_DIR, VOICE_QUEUE_INBOX, VIBEVOICE_LOG_DIR].forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  const files = fs.readdirSync(MANUAL_INPUT_DIR).filter(f => ACCEPTED_EXTENSIONS.includes(path.extname(f)));

  if (files.length === 0) {
    console.log("📭 No manual transcripts found in voice_input/manual/.");
    return;
  }

  console.log(`🎙️  Found ${files.length} manual transcript(s). Ingesting...`);

  let count = 0;
  for (const file of files) {
    const filePath = path.join(MANUAL_INPUT_DIR, file);
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const normalized = normalizeContent(rawContent);

    console.log(`\n📄 File: ${file}`);
    console.log(`   Content: "${normalized}"`);

    // 1. Validate empty
    if (!normalized) {
      const status = 'Rejected: Empty transcript';
      console.error(`❌ ${status}`);
      writeVibeVoiceLog(file, '', '', 0, status);
      fs.unlinkSync(filePath);
      continue;
    }

    // 2. Validate length
    if (normalized.length > MAX_TRANSCRIPT_LENGTH) {
      const status = `Rejected: Exceeds MAX_TRANSCRIPT_LENGTH (${MAX_TRANSCRIPT_LENGTH})`;
      console.error(`❌ ${status}`);
      writeVibeVoiceLog(file, '', normalized, normalized.length, status);
      fs.unlinkSync(filePath);
      continue;
    }

    // 3. Stage files
    const dateTimeStr = getFormattedDateTime();
    let baseName = `${TRANSCRIPT_PREFIX}_${dateTimeStr}`;
    
    // Add unique offset if running in the same second
    let targetFile = `${baseName}.txt`;
    let destQueuePath = path.join(VOICE_QUEUE_INBOX, targetFile);
    let destBackupPath = path.join(TRANSCRIPTS_DIR, targetFile);
    
    let offset = 0;
    while (fs.existsSync(destQueuePath) || fs.existsSync(destBackupPath)) {
      offset++;
      targetFile = `${baseName}_${offset}.txt`;
      destQueuePath = path.join(VOICE_QUEUE_INBOX, targetFile);
      destBackupPath = path.join(TRANSCRIPTS_DIR, targetFile);
    }

    // Copy to transcripts/ (backup archive)
    fs.writeFileSync(destBackupPath, normalized);

    // Copy to voice_queue/inbox/ (command pipeline queue)
    fs.writeFileSync(destQueuePath, normalized);

    // Clean up input file
    fs.unlinkSync(filePath);

    const status = 'Staged';
    console.log(`✅ Staged successfully: ${targetFile}`);
    writeVibeVoiceLog(file, targetFile, normalized, normalized.length, status);
    count++;
  }

  console.log(`\n🎉 Ingestion complete. Staged ${count} commands.`);
  console.log("💡 Next Step: Run the voice queue scanner command manually:");
  console.log("   npm run voice-queue");
}

runIngest();
