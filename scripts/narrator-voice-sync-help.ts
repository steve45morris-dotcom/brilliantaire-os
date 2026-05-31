function run() {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const green = '\x1b[32m';
  const gray = '\x1b[90m';

  console.log(`${bold}${cyan}\n🎙️ Brilliantaire OS — Voice Narration Sync Controller${reset}`);
  console.log(`${gray}====================================================${reset}`);
  console.log('Use this script to compile voice-ready packets and stage manual VNP voice queue entries.\n');
  console.log(`${bold}${yellow}Usage:${reset}`);
  console.log('  npm run narrator-voice-sync -- "<command>"\n');
  console.log(`${bold}${yellow}Available Commands:${reset}`);
  console.log(`  ${green}help${reset}        : Print this command menu`);
  console.log(`  ${green}packet${reset}      : Compile the latest voice script and live feed into a voice-ready packet`);
  console.log(`  ${green}queue${reset}       : Stage a Voice Narrative Protocol (VNP) queue block for manual bridge review`);
  console.log(`  ${green}status${reset}      : Print voice sync validation configs, safety rules, and latest output files`);
  console.log(`  ${green}all${reset}         : Generate voice packet and queue files, then print the sync status\n`);
  console.log(`${gray}----------------------------------------------------${reset}`);
  console.log(`${gray}All commands are output-only, writing exclusively to outputs/narrator/voice_sync/.${reset}`);
}

run();
export {};
