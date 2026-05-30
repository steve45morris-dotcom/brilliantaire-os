import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { COMMAND_POLICY, CommandEntry } from "../config/commands";

function logBlock(command: string, reason: string, agent: string) {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const logDir = path.join(process.cwd(), "outputs", "automation", "logs");
    fs.mkdirSync(logDir, { recursive: true });
    
    const logPath = path.join(logDir, `automation_log_${yyyy}-${mm}-${dd}.md`);
    let initialHeader = "";
    if (!fs.existsSync(logPath)) {
      initialHeader = `# Daily Automation Log for ${yyyy}-${mm}-${dd}\n\n`;
    }
    
    const blockMsg = `${initialHeader}### Blocked Execution: "${command}"\n- **Timestamp**: ${now.toISOString()}\n- **Reason**: ${reason}\n- **Owning Agent**: ${agent}\n\n`;
    fs.appendFileSync(logPath, blockMsg, "utf-8");
  } catch (err) {
    console.error("Failed to log blocked command:", err);
  }
}

async function main() {
  const inputCommand = process.argv[2];
  if (!inputCommand) {
    console.error("Error: No command provided to the Command Router.");
    process.exit(1);
  }

  // Find policy entry
  let matchedEntry: CommandEntry | null = null;
  let matchedByAlias = false;

  for (const entry of Object.values(COMMAND_POLICY)) {
    if (entry.key === inputCommand) {
      matchedEntry = entry;
      break;
    }
  }

  if (!matchedEntry) {
    // Try aliases
    for (const entry of Object.values(COMMAND_POLICY)) {
      if (entry.aliases.includes(inputCommand)) {
        matchedEntry = entry;
        matchedByAlias = true;
        break;
      }
    }
  }

  if (!matchedEntry) {
    logBlock(inputCommand, "Unknown or unallowlisted command.", "Unknown Agent");
    console.error(`Error: Command "${inputCommand}" is unknown or not in the allowlist.`);
    process.exit(1);
  }

  // Validate exact name constraint
  if (matchedEntry.requires_exact_name && matchedByAlias) {
    logBlock(matchedEntry.key, `Access via alias "${inputCommand}" is blocked. Exact name required.`, matchedEntry.owningAgent);
    console.error(`Error: Command "${matchedEntry.key}" requires its exact name to be run. Access via alias "${inputCommand}" is blocked.`);
    process.exit(1);
  }

  // Check if enabled
  if (!matchedEntry.enabled) {
    logBlock(matchedEntry.key, "Command is disabled.", matchedEntry.owningAgent);
    console.error(`Error: Command "${matchedEntry.key}" is disabled.`);
    process.exit(1);
  }

  console.log(`[Safe Command Router] Executing: "${matchedEntry.key}" (Risk: ${matchedEntry.risk.toUpperCase()}, Owner: ${matchedEntry.owningAgent})`);

  // Handle mock execution
  if (matchedEntry.isMock) {
    console.log(matchedEntry.mockOutput);
    process.exit(0);
  }

  // Run the actual underlying program/script
  // If there are extra arguments passed, forward them.
  const extraArgs = process.argv.slice(3);
  const allArgs = [...matchedEntry.args, ...extraArgs];

  const child = spawn(matchedEntry.command, allArgs, {
    stdio: "inherit",
    shell: true
  });

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (err) => {
    console.error(`Execution error: ${err.message}`);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("Command Router crashed:", err);
  process.exit(1);
});
