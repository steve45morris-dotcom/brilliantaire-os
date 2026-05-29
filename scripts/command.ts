import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMMAND_REGISTRY, CommandDefinition } from '../config/commands.js';
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

function writeCommandLog(
  rawInput: string,
  matchedCmd: CommandDefinition | null,
  aliasUsed: boolean,
  confirmed: boolean,
  status: string,
  exitCode: number
) {
  const logDir = path.join(REPO_ROOT, 'outputs', 'command_logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `command_log_${getFormattedDate()}.md`);
  const timestamp = new Date().toISOString();

  let entry = `## [${timestamp}] Command Attempt: "${rawInput}"\n`;
  if (matchedCmd) {
    entry += `- **Matched Command:** \`${matchedCmd.name}\`\n`;
    entry += `- **Alias Used:** \`${aliasUsed}\`\n`;
    entry += `- **Owning Agent:** \`${matchedCmd.owningAgent}\`\n`;
    entry += `- **Risk Level:** \`${matchedCmd.riskLevel}\`\n`;
    entry += `- **Confirmed:** \`${confirmed}\`\n`;
  } else {
    entry += `- **Matched Command:** \`None (Unknown Command)\`\n`;
  }
  entry += `- **Result Status:** \`${status}\`\n`;
  entry += `- **Exit Code:** \`${exitCode}\`\n`;
  entry += `\n---\n\n`;

  fs.appendFileSync(logFile, entry);
}

function printAllowedCommands() {
  console.log("\n📋 Allowed commands are:");
  COMMAND_REGISTRY.forEach(c => {
    console.log(`  - ${c.name} (Aliases: ${c.aliases.join(', ')}) [Risk: ${c.riskLevel.toUpperCase()}]`);
  });
}

function runCommand() {
  let args = process.argv.slice(2);
  if (args.length === 1 && args[0].includes(' ')) {
    args = args[0].split(/\s+/);
  }
  const rawInput = args.join(' ');

  let hasConfirm = false;
  const filteredArgs = args.map(arg => {
    let cleaned = arg;
    if (cleaned.includes('--confirm')) {
      hasConfirm = true;
      cleaned = cleaned.replace('--confirm', '');
    }
    return cleaned.trim();
  }).filter(Boolean);

  const normalized = filteredArgs.join(' ').toLowerCase().trim().replace(/\s+/g, ' ');

  if (!normalized) {
    console.error("❌ No command provided.");
    printAllowedCommands();
    writeCommandLog('', null, false, false, 'Error: Empty input', 1);
    process.exit(1);
  }

  // Look for match
  let matchedCmd: CommandDefinition | null = null;
  let aliasUsed = false;
  let cmdMatchedStr = '';

  for (const cmd of COMMAND_REGISTRY) {
    if (normalized === cmd.name || normalized.startsWith(cmd.name + ' ')) {
      matchedCmd = cmd;
      aliasUsed = false;
      cmdMatchedStr = cmd.name;
      break;
    }
    const matchingAlias = cmd.aliases.find(alias => normalized === alias || normalized.startsWith(alias + ' '));
    if (matchingAlias) {
      matchedCmd = cmd;
      aliasUsed = true;
      cmdMatchedStr = matchingAlias;
      break;
    }
  }

  // 1. Unknown Command
  if (!matchedCmd) {
    console.error(`❌ Unknown command: "${rawInput}"`);
    printAllowedCommands();
    writeCommandLog(rawInput, null, false, false, 'Error: Unknown Command', 1);
    process.exit(1);
  }

  // 2. Disabled Command
  if (!matchedCmd.enabled) {
    console.error(`❌ Command "${matchedCmd.name}" is currently disabled.`);
    writeCommandLog(rawInput, matchedCmd, aliasUsed, hasConfirm, 'Error: Command Disabled', 1);
    process.exit(1);
  }

  // 3. Exact Name check
  if (matchedCmd.requiresExactName && aliasUsed) {
    console.error(`❌ Blocked: Command "${matchedCmd.name}" requires its exact name, aliases are forbidden.`);
    console.log(`💡 Guidance: To execute this command, you must type it exactly:`);
    console.log(`   npm run command -- "${matchedCmd.name}"`);
    writeCommandLog(rawInput, matchedCmd, aliasUsed, hasConfirm, 'Blocked: Alias Used for Exact Name', 1);
    process.exit(1);
  }

  // 4. High-risk confirmation check
  if (matchedCmd.riskLevel === 'high' && !hasConfirm) {
    console.error(`⚠️  Warning: "${matchedCmd.name}" is a HIGH-risk command (performs write actions on Vault directories).`);
    console.error(`❌ Blocked: High-risk commands require explicit confirmation.`);
    console.log(`💡 Guidance: To run this command, you must append the --confirm flag:`);
    console.log(`   npm run command -- "${matchedCmd.name}" --confirm`);
    writeCommandLog(rawInput, matchedCmd, aliasUsed, false, 'Blocked: Missing Confirmation Flag', 1);
    process.exit(1);
  }

  const wordCount = cmdMatchedStr.split(/\s+/).length;
  const extraArgs = filteredArgs.slice(wordCount);

  console.log(`📡 [${matchedCmd.owningAgent}] Executing pre-approved script: npm run ${matchedCmd.npmScript}...`);

  const spawnArgs = ['run', matchedCmd.npmScript];
  if (extraArgs.length > 0) {
    spawnArgs.push('--', ...extraArgs);
  }

  // Execute using child_process.spawn with shell: false
  const child = spawn('npm', spawnArgs, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: false
  });

  child.on('close', (code) => {
    const exitCode = code ?? 0;
    const status = exitCode === 0 ? 'Success' : 'Failed';
    writeCommandLog(rawInput, matchedCmd!, aliasUsed, hasConfirm, status, exitCode);
    process.exit(exitCode);
  });

  child.on('error', (err) => {
    console.error(`❌ Execution error: ${err.message}`);
    writeCommandLog(rawInput, matchedCmd!, aliasUsed, hasConfirm, 'Execution Error', 1);
    process.exit(1);
  });
}

runCommand();
