import { COMMAND_REGISTRY } from '../config/commands.js';

function printHelp() {
  console.log("=========================================");
  console.log("🛠️  COMMAND ROUTER REGISTRY: Brilliantaire OS");
  console.log("=========================================");

  // Define column widths for terminal table formatting
  const colWidths = {
    command: 15,
    aliases: 20,
    owningAgent: 22,
    risk: 10,
    enabled: 8
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
    pad('Enabled', colWidths.enabled)
  );
  console.log('-'.repeat(colWidths.command + colWidths.aliases + colWidths.owningAgent + colWidths.risk + colWidths.enabled + 12));

  for (const cmd of COMMAND_REGISTRY) {
    console.log(
      pad(cmd.name, colWidths.command) + ' | ' +
      pad(cmd.aliases.join(', '), colWidths.aliases) + ' | ' +
      pad(cmd.owningAgent, colWidths.owningAgent) + ' | ' +
      pad(cmd.riskLevel.toUpperCase(), colWidths.risk) + ' | ' +
      pad(cmd.enabled ? 'YES' : 'NO', colWidths.enabled)
    );
    console.log(`   └─ Description: ${cmd.description}\n`);
  }

  console.log("=========================================");
}

printHelp();
