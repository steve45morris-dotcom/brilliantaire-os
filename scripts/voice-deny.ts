import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REPO_ROOT } from '../config/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function writeDenyLog(
  pendingId: string,
  rawPhrase: string,
  routerCommand: string,
  riskLevel: string,
  reason: string
) {
  const logDir = path.join(REPO_ROOT, 'outputs', 'voice_confirmation_logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, `voice_confirmation_log_${getFormattedDate()}.md`);
  const timestamp = new Date().toISOString();

  let entry = `## [${timestamp}] Voice Confirmation Denied: "${pendingId}"\n`;
  entry += `- **Raw Phrase:** \`${rawPhrase}\`\n`;
  entry += `- **Router Command Gated:** \`${routerCommand}\`\n`;
  entry += `- **Risk Level:** \`${riskLevel}\`\n`;
  entry += `- **Result Status:** \`Denied\`\n`;
  entry += `- **Denial Reason:** \`${reason}\`\n`;
  entry += `\n---\n\n`;

  fs.appendFileSync(logFile, entry);
}

function denyCommand() {
  let args = process.argv.slice(2);
  if (args.length === 1 && args[0].includes(' ')) {
    args = args[0].split(/\s+/);
  }

  const reasonIdx = args.indexOf('--reason');
  let reason = 'No reason provided';
  if (reasonIdx !== -1 && args[reasonIdx + 1]) {
    // Collect all words after --reason
    reason = args.slice(reasonIdx + 1).join(' ').replace(/^["']|["']$/g, '');
  }

  // Filter out --reason and the words following it to find target ID
  const cleanArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--reason') {
      break; // stop collecting since everything after is the reason
    }
    cleanArgs.push(args[i]);
  }
  const targetId = cleanArgs[0];

  if (!targetId) {
    console.error("❌ Error: No pending ID provided.");
    process.exit(1);
  }

  const baseDir = path.join(REPO_ROOT, 'voice_queue');
  const pendingDir = path.join(baseDir, 'pending_confirmation');
  const deniedDir = path.join(baseDir, 'denied');

  [deniedDir].forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  const metaPath = path.join(pendingDir, `${targetId}.json`);
  const textPath = path.join(pendingDir, `${targetId}.txt`);

  if (!fs.existsSync(metaPath)) {
    console.error(`❌ Error: Pending command with ID "${targetId}" not found.`);
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  // Update status and move files
  meta.status = 'denied';
  meta.deniedTimestamp = new Date().toISOString();
  meta.denialReason = reason;

  const destMetaPath = path.join(deniedDir, `${targetId}.json`);
  const destTextPath = path.join(deniedDir, `${targetId}.txt`);

  fs.writeFileSync(destMetaPath, JSON.stringify(meta, null, 2));
  if (fs.existsSync(textPath)) {
    fs.renameSync(textPath, destTextPath);
  }
  fs.unlinkSync(metaPath);

  writeDenyLog(targetId, meta.rawPhrase, meta.routerCommand, meta.riskLevel, reason);
  console.log(`❌ Denied: Command "${targetId}" has been rejected. Files moved to voice_queue/denied/.`);
}

denyCommand();
