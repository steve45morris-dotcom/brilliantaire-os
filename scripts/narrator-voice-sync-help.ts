function run() {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const green = '\x1b[32m';
  const gray = '\x1b[90m';

  console.log(`${bold}${cyan}\n🎙️ Brilliantaire OS — Voice Narration Sync Controller${reset}`);
  console.log(`${gray}====================================================${reset}`);
  console.log('Use this script to compile and check offline voice-ready packets and VNP queue briefs.\n');
  console.log(`${bold}${yellow}Usage:${reset}`);
  console.log('  npm run narrator-voice-sync -- "<command>"\n');
  console.log(`${bold}${yellow}Available Commands:${reset}`);
  console.log(`  ${green}help${reset}        : Print this command menu`);
  console.log(`  ${green}packet${reset}      : Build developer voice-ready parameter description package`);
  console.log(`  ${green}queue${reset}       : Stage unified verbal narration queue details for VNP bridge`);
  console.log(`  ${green}status${reset}      : Check diagnostic file availability and environment gates`);
  console.log(`  ${green}all${reset}         : Compile both packet and queue details, then output status\n`);
  console.log(`${gray}----------------------------------------------------${reset}`);
  console.log(`${gray}All commands are strictly offline and write to outputs/narrator/voice_sync/.${reset}`);
}

run();
export {};
