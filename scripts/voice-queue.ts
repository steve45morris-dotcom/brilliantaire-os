import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { VOICE_COMMANDS_REGISTRY, VoiceCommandDefinition } from '../config/voice-commands.js';
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

function writeVoiceLog(
  sourceFile: string,
  rawPhrase: string,
  normalizedPhrase: string,
  matchedPhrase: string,
  routerCommand: string,
  riskLevel: string,
  confirmRequired: boolean,
  status: string,
  exitCode: number
) {
  const logDir = path.join(REPO_ROOT, 'outputs', 'voice_command_logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `voice_command_log_${getFormattedDate()}.md`);
  const timestamp = new Date().toISOString();

  let entry = `## [${timestamp}] Voice Processing: "${sourceFile}"\n`;
  entry += `- **Raw Phrase:** \`${rawPhrase}\`\n`;
  entry += `- **Normalized Phrase:** \`${normalizedPhrase}\`\n`;
  entry += `- **Matched Phrase:** \`${matchedPhrase || 'None'}\`\n`;
  entry += `- **Router Command:** \`${routerCommand || 'None'}\`\n`;
  entry += `- **Risk Level:** \`${riskLevel || 'None'}\`\n`;
  entry += `- **Confirmation Required:** \`${confirmRequired}\`\n`;
  entry += `- **Result Status:** \`${status}\`\n`;
  entry += `- **Exit Code:** \`${exitCode}\`\n`;
  entry += `\n---\n\n`;

  fs.appendFileSync(logFile, entry);
}

function normalizePhrase(phrase: string): string {
  return phrase
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')                        // collapse extra spaces
    .trim();
}

function runRouterCommand(routerCmd: string): Promise<number> {
  return new Promise((resolve) => {
    console.log(`📡 [Voice Dispatcher] Routing through Safe Command Router: npm run command -- "${routerCmd}"`);
    const child = spawn('npm', ['run', 'command', '--', routerCmd], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      shell: false
    });

    child.on('close', (code) => {
      resolve(code ?? 0);
    });

    child.on('error', (err) => {
      console.error(`❌ Spawn error: ${err.message}`);
      resolve(1);
    });
  });
}

async function processQueue() {
  const baseDir = path.join(REPO_ROOT, 'voice_queue');
  const inboxDir = path.join(baseDir, 'inbox');
  const processedDir = path.join(baseDir, 'processed');
  const rejectedDir = path.join(baseDir, 'rejected');
  const logsDir = path.join(baseDir, 'logs');

  // Ensure directories exist
  [baseDir, inboxDir, processedDir, rejectedDir, logsDir].forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  if (!fs.existsSync(inboxDir)) {
    console.log("📂 Inbox directory is ready.");
    return;
  }

  const files = fs.readdirSync(inboxDir).filter(f => f.endsWith('.txt'));

  if (files.length === 0) {
    console.log("📭 No voice commands found in voice_queue/inbox/");
    return;
  }

  console.log(`🎙️  Found ${files.length} voice command(s) in inbox. Processing...`);

  for (const file of files) {
    const filePath = path.join(inboxDir, file);
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const normalized = normalizePhrase(rawContent);

    console.log(`\n📄 Processing file: ${file}`);
    console.log(`   Raw phrase: "${rawContent.trim()}"`);
    console.log(`   Normalized: "${normalized}"`);

    // Match against registry
    const match = VOICE_COMMANDS_REGISTRY.find(c => c.normalizedCommand === normalized);

    if (!match) {
      console.error(`❌ Rejection: Unknown voice phrase: "${normalized}"`);
      const reason = 'Unknown voice phrase';
      const rejectedPath = path.join(rejectedDir, file);
      fs.writeFileSync(
        rejectedPath,
        `Original Phrase: ${rawContent}\nNormalized: ${normalized}\nStatus: Rejected\nReason: ${reason}\n`
      );
      fs.unlinkSync(filePath);
      writeVoiceLog(file, rawContent.trim(), normalized, '', '', '', false, `Rejected: ${reason}`, 1);
      continue;
    }

    if (!match.enabled) {
      console.error(`❌ Rejection: Voice phrase "${match.phrase}" is currently disabled.`);
      const reason = 'Disabled voice mapping';
      const rejectedPath = path.join(rejectedDir, file);
      fs.writeFileSync(
        rejectedPath,
        `Original Phrase: ${rawContent}\nNormalized: ${normalized}\nStatus: Rejected\nReason: ${reason}\n`
      );
      fs.unlinkSync(filePath);
      writeVoiceLog(
        file,
        rawContent.trim(),
        normalized,
        match.phrase,
        match.routerCommand,
        match.riskLevel,
        match.requiresConfirmation,
        `Rejected: ${reason}`,
        1
      );
      continue;
    }

    if (match.requiresConfirmation) {
      console.warn(`⚠️  Blocked: Voice phrase "${match.phrase}" requires manual confirmation due to ${match.riskLevel.toUpperCase()} risk.`);
      const reason = 'Blocked: Manual confirmation required';
      const guidance = `To execute this command, please run manually:\n  npm run command -- "${match.routerCommand}"`;
      const rejectedPath = path.join(rejectedDir, file);
      fs.writeFileSync(
        rejectedPath,
        `Original Phrase: ${rawContent}\nNormalized: ${normalized}\nStatus: Blocked\nReason: ${reason}\nGuidance: ${guidance}\n`
      );
      fs.unlinkSync(filePath);
      writeVoiceLog(
        file,
        rawContent.trim(),
        normalized,
        match.phrase,
        match.routerCommand,
        match.riskLevel,
        match.requiresConfirmation,
        reason,
        1
      );
      continue;
    }

    // Low risk, execute command
    const exitCode = await runRouterCommand(match.routerCommand);
    const status = exitCode === 0 ? 'Success' : 'Failed';
    const processedPath = path.join(processedDir, file);

    fs.writeFileSync(
      processedPath,
      `Original Phrase: ${rawContent}\nNormalized: ${normalized}\nStatus: Processed\nRouter Command: npm run command -- "${match.routerCommand}"\nExit Code: ${exitCode}\n`
    );
    fs.unlinkSync(filePath);

    writeVoiceLog(
      file,
      rawContent.trim(),
      normalized,
      match.phrase,
      match.routerCommand,
      match.riskLevel,
      match.requiresConfirmation,
      status,
      exitCode
    );
  }

  console.log("\n🎉 Voice command queue execution completed.");
}

processQueue();
