import { spawn } from "child_process";
import { COMMAND_POLICY, CommandEntry } from "../config/commands";

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
    console.error(`Error: Command "${inputCommand}" is unknown or not in the allowlist.`);
    process.exit(1);
  }

  // Validate exact name constraint
  if (matchedEntry.requires_exact_name && matchedByAlias) {
    console.error(`Error: Command "${matchedEntry.key}" requires its exact name to be run. Access via alias "${inputCommand}" is blocked.`);
    process.exit(1);
  }

  // Check if enabled
  if (!matchedEntry.enabled) {
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
