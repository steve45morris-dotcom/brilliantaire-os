import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REPO_ROOT } from '../config/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function listPending() {
  const pendingDir = path.join(REPO_ROOT, 'voice_queue', 'pending_confirmation');
  if (!fs.existsSync(pendingDir)) {
    console.log("📭 Voice pending queue is clear (directory does not exist).");
    return;
  }

  const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log("📭 Voice pending queue is clear.");
    return;
  }

  console.log("=========================================================================================================================");
  console.log("📋 PENDING VOICE COMMANDS QUEUE");
  console.log("=========================================================================================================================");
  console.log("");
  
  // Table columns padding setup
  console.log(
    "| " +
    "Pending ID".padEnd(40) + " | " +
    "Phrase".padEnd(28) + " | " +
    "Router Command".padEnd(28) + " | " +
    "Owning Agent".padEnd(28) + " | " +
    "Risk".padEnd(6) + " | " +
    "Created Timestamp" +
    " |"
  );
  console.log("|" + "-".repeat(42) + "|" + "-".repeat(30) + "|" + "-".repeat(30) + "|" + "-".repeat(30) + "|" + "-".repeat(8) + "|" + "-".repeat(26) + "|");

  for (const file of files) {
    const filePath = path.join(pendingDir, file);
    try {
      const meta = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const pendingId = file.replace(/\.json$/, '');
      const idCol = pendingId.padEnd(40);
      const phraseCol = meta.rawPhrase.padEnd(28);
      const commandCol = meta.routerCommand.padEnd(28);
      const agentCol = meta.owningAgent.padEnd(28);
      const riskCol = meta.riskLevel.toUpperCase().padEnd(6);
      const timestampCol = meta.createdTimestamp;

      console.log(`| ${idCol} | ${phraseCol} | ${commandCol} | ${agentCol} | ${riskCol} | ${timestampCol} |`);
    } catch (e) {
      console.error(`❌ Error parsing metadata file: ${file}`, e);
    }
  }

  console.log("");
  console.log("=========================================================================================================================");
  console.log("💡 Guidance: To approve, run: npm run voice-confirm -- \"<Pending ID>\" --confirm");
  console.log("            To deny, run:    npm run voice-deny -- \"<Pending ID>\" --reason \"<Reason>\"");
}

listPending();
