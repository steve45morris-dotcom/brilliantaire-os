import { COMMAND_REGISTRY } from '../config/commands.js';

function printHelp() {
  console.log("=========================================");
  console.log("🛠️  COMMAND ROUTER REGISTRY: Brilliantaire OS");
  console.log("=========================================");

  // Define column widths for terminal table formatting
  const colWidths = {
    command: 15,
    aliases: 18,
    owningAgent: 22,
    risk: 8,
    enabled: 6,
    exactName: 10
  };

  const pad = (str: string, width: number) => {
    if (str.length >= width) return str.substring(0, width - 3) + '...';
    return str + ' '.repeat(width - str.length);
  };

  // Header line
  console.log(
    pad('Command', colWidths.command) + ' | ' +
    pad('Aliases', colWidths.aliases) + ' | ' +
    pad('Owning Agent', colWidths.owningAgent) + ' | ' +
    pad('Risk', colWidths.risk) + ' | ' +
    pad('Active', colWidths.enabled) + ' | ' +
    pad('Exact Name', colWidths.exactName)
  );
  console.log('-'.repeat(colWidths.command + colWidths.aliases + colWidths.owningAgent + colWidths.risk + colWidths.enabled + colWidths.exactName + 15));

  for (const cmd of COMMAND_REGISTRY) {
    console.log(
      pad(cmd.name, colWidths.command) + ' | ' +
      pad(cmd.aliases.join(', '), colWidths.aliases) + ' | ' +
      pad(cmd.owningAgent, colWidths.owningAgent) + ' | ' +
      pad(cmd.riskLevel.toUpperCase(), colWidths.risk) + ' | ' +
      pad(cmd.enabled ? 'YES' : 'NO', colWidths.enabled) + ' | ' +
      pad(cmd.requiresExactName ? 'REQUIRED' : 'ANY', colWidths.exactName)
    );
    console.log(`   └─ Description: ${cmd.description}\n`);
  }

  console.log("=========================================");
}

printHelp();
