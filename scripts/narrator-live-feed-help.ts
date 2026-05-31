function run() {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const green = '\x1b[32m';
  const gray = '\x1b[90m';

  console.log(`${bold}${cyan}\n📡 Brilliantaire OS — Narrator Live Feed Controller${reset}`);
  console.log(`${gray}===================================================${reset}`);
  console.log('Use this script to compile and check read-only live dashboard feeds and event logs.\n');
  console.log(`${bold}${yellow}Usage:${reset}`);
  console.log('  npm run narrator-live-feed -- "<command>"\n');
  console.log(`${bold}${yellow}Available Commands:${reset}`);
  console.log(`  ${green}help${reset}        : Print this command menu`);
  console.log(`  ${green}generate${reset}    : Aggregate latest telemetry logs to compile the live feed JSON`);
  console.log(`  ${green}event${reset}       : Log a new timestamped event detailing system modifications`);
  console.log(`  ${green}status${reset}      : Check validation configurations and current feed files`);
  console.log(`  ${green}watch-once${reset}  : Check file changes and trigger a live feed updates cycle if modified\n`);
  console.log(`${gray}---------------------------------------------------${reset}`);
  console.log(`${gray}All commands are strictly read-only and write to outputs/narrator/live_feed/.${reset}`);
}

run();
export {};
