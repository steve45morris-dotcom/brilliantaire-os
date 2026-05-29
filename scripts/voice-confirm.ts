import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
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

function writeConfirmLog(
  pendingId: string,
  rawPhrase: string,
  routerCommand: string,
  riskLevel: string,
  status: string,
  exitCode: number
) {
  const logDir = path.join(REPO_ROOT, 'outputs', 'voice_confirmation_logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, `voice_confirmation_log_${getFormattedDate()}.md`);
  const timestamp = new Date().toISOString();

  let entry = `## [${timestamp}] Voice Confirmation Approved: "${pendingId}"\n`;
  entry += `- **Raw Phrase:** \`${rawPhrase}\`\n`;
  entry += `- **Router Command Executed:** \`${routerCommand}\`\n`;
  entry += `- **Risk Level:** \`${riskLevel}\`\n`;
  entry += `- **Result Status:** \`${status}\`\n`;
  entry += `- **Exit Code:** \`${exitCode}\`\n`;
  entry += `\n---\n\n`;

  fs.appendFileSync(logFile, entry);
}

function runCommandRouter(routerCmd: string): Promise<number> {
  return new Promise((resolve) => {
    console.log(`📡 [Voice Confirm] Routing through Command Router: npm run command -- "${routerCmd}"`);
    const child = spawn('npm', ['run', 'command', '--', routerCmd], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      shell: false
    });
    child.on('close', (code) => resolve(code ?? 0));
    child.on('error', () => resolve(1));
  });
}

async function confirmCommand() {
  let args = process.argv.slice(2);
  if (args.length === 1 && args[0].includes(' ')) {
    args = args[0].split(/\s+/);
  }

  const hasConfirm = args.includes('--confirm');
  const targetId = args.filter(a => a !== '--confirm')[0];

  if (!targetId) {
    console.error("❌ Error: No pending ID provided.");
    process.exit(1);
  }

  if (!hasConfirm) {
    console.error("❌ Blocked: Confirmation flag --confirm is required.");
    console.log("💡 Guidance: Run this script with the confirm flag, for example:");
    console.log(`   npm run voice-confirm -- "${targetId}" --confirm`);
    process.exit(1);
  }

  const baseDir = path.join(REPO_ROOT, 'voice_queue');
  const pendingDir = path.join(baseDir, 'pending_confirmation');
  const confirmedDir = path.join(baseDir, 'confirmed');

  [confirmedDir].forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  const toExecute: { id: string; metaPath: string; textPath: string; meta: any }[] = [];

  if (targetId === 'all-low-risk') {
    if (!fs.existsSync(pendingDir)) {
      console.log("📭 Pending confirmation directory does not exist.");
      process.exit(0);
    }
    const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const metaPath = path.join(pendingDir, f);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      if (meta.riskLevel === 'low') {
        const textPath = metaPath.replace(/\.json$/, '.txt');
        toExecute.push({
          id: f.replace(/\.json$/, ''),
          metaPath,
          textPath,
          meta
        });
      }
    }
    if (toExecute.length === 0) {
      console.log("📭 No low-risk commands pending confirmation.");
      process.exit(0);
    }
  } else {
    const metaPath = path.join(pendingDir, `${targetId}.json`);
    const textPath = path.join(pendingDir, `${targetId}.txt`);
    if (!fs.existsSync(metaPath)) {
      console.error(`❌ Error: Pending command with ID "${targetId}" not found.`);
      process.exit(1);
    }
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    toExecute.push({
      id: targetId,
      metaPath,
      textPath,
      meta
    });
  }

  for (const item of toExecute) {
    console.log(`📡 Confirming voice command: "${item.id}" (phrase: "${item.meta.rawPhrase}")`);
    
    let commandToRun = item.meta.routerCommand;
    if (item.meta.riskLevel === 'high') {
      commandToRun += ' --confirm';
    }

    const exitCode = await runCommandRouter(commandToRun);
    const status = exitCode === 0 ? 'Success' : 'Failed';

    // Update metadata and move to confirmed/
    item.meta.status = 'confirmed';
    item.meta.executedTimestamp = new Date().toISOString();
    item.meta.executionExitCode = exitCode;

    const destMetaPath = path.join(confirmedDir, `${item.id}.json`);
    const destTextPath = path.join(confirmedDir, `${item.id}.txt`);

    fs.writeFileSync(destMetaPath, JSON.stringify(item.meta, null, 2));
    if (fs.existsSync(item.textPath)) {
      fs.renameSync(item.textPath, destTextPath);
    }
    fs.unlinkSync(item.metaPath);

    writeConfirmLog(item.id, item.meta.rawPhrase, commandToRun, item.meta.riskLevel, status, exitCode);
    console.log(`✅ Completed: Command "${item.id}" execution completed with code ${exitCode}. File moved to voice_queue/confirmed/.`);
  }
}

confirmCommand();
