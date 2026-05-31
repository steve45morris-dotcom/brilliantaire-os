function run() {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const green = '\x1b[32m';
  const gray = '\x1b[90m';

  console.log(`${bold}${cyan}\n🎙️ Brilliantaire OS — Local TTS Render Queue Controller${reset}`);
  console.log(`${gray}======================================================${reset}`);
  console.log('Use this script to stage and manage local offline text-to-speech rendering requests.\n');
  console.log(`${bold}${yellow}Usage:${reset}`);
  console.log('  npm run narrator-tts-queue -- "<command> [args]"\n');
  console.log(`${bold}${yellow}Available Commands:${reset}`);
  console.log(`  ${green}help${reset}              : Print this command menu`);
  console.log(`  ${green}request${reset}           : Generate a new TTS render request from the latest voice packet`);
  console.log(`  ${green}approve <REQ_ID>${reset}  : Approve a staged render request and mark it ready for offline rendering`);
  console.log(`  ${green}reject <REQ_ID>${reset}   : Reject a staged render request and mark it rejected`);
  console.log(`  ${green}status${reset}            : Print status counts of request queues and active safety gates`);
  console.log(`  ${green}all${reset}               : Compile a new render request, then print the active queue status\n`);
  console.log(`${gray}------------------------------------------------------${reset}`);
  console.log(`${gray}All commands are local-only. External TTS APIs and direct playback are disabled.${reset}`);
}

run();
export {};
