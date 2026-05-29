import { VOICE_COMMANDS_REGISTRY } from '../config/voice-commands.js';

function printVoiceHelp() {
  console.log("=================================================================================");
  console.log("🎙️  VOICE PHRASE REGISTRY: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("");
  console.log("The following voice phrases map to normalized router commands executed locally.");
  console.log("");
  
  // Print header
  console.log(
    "| " +
    "Phrase".padEnd(23) + " | " +
    "Router Command".padEnd(25) + " | " +
    "Owning Agent".padEnd(28) + " | " +
    "Risk".padEnd(6) + " | " +
    "Confirm".padEnd(7) + " | " +
    "Enabled" +
    " |"
  );
  console.log("|" + "-".repeat(25) + "|" + "-".repeat(27) + "|" + "-".repeat(30) + "|" + "-".repeat(8) + "|" + "-".repeat(9) + "|" + "-".repeat(9) + "|");

  for (const cmd of VOICE_COMMANDS_REGISTRY) {
    const phraseCol = cmd.phrase.padEnd(23);
    const routerCol = cmd.routerCommand.padEnd(25);
    const agentCol = cmd.owningAgent.padEnd(28);
    const riskCol = cmd.riskLevel.toUpperCase().padEnd(6);
    const confirmCol = String(cmd.requiresConfirmation).padEnd(7);
    const enabledCol = String(cmd.enabled).padEnd(7);

    console.log(`| ${phraseCol} | ${routerCol} | ${agentCol} | ${riskCol} | ${confirmCol} | ${enabledCol} |`);
  }

  console.log("");
  console.log("=================================================================================");
}

printVoiceHelp();
