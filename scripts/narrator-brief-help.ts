function run() {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const green = '\x1b[32m';
  const gray = '\x1b[90m';

  console.log(`${bold}${cyan}\n🧭 Brilliantaire OS — Narrator Brief Composer${reset}`);
  console.log(`${gray}==============================================${reset}`);
  console.log('Use this script to compile target-specific narration files from approved telemetry snapshots.\n');
  console.log(`${bold}${yellow}Usage:${reset}`);
  console.log('  npm run narrator-brief -- "<command>"\n');
  console.log(`${bold}${yellow}Available Commands:${reset}`);
  console.log(`  ${green}help${reset}        : Print this command menu`);
  console.log(`  ${green}operator${reset}    : Generate the operator brief`);
  console.log(`  ${green}dashboard${reset}   : Generate the dashboard narration feed`);
  console.log(`  ${green}voice${reset}       : Generate the voice narration script`);
  console.log(`  ${green}obsidian${reset}    : Stage the Obsidian review narrator brief`);
  console.log(`  ${green}all${reset}        : Generate operator, dashboard, voice, and Obsidian briefs`);
  console.log(`  ${green}status${reset}     : Print existence status of latest cards, snapshots, and briefs\n`);
  console.log(`${gray}----------------------------------------------${reset}`);
  console.log(`${gray}All commands are read-only and write exclusively to outputs/narrator/.${reset}`);
}

run();
