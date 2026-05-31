function run() {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const green = '\x1b[32m';
  const gray = '\x1b[90m';

  console.log(`${bold}${cyan}\n🎙️ Brilliantaire OS — Local TTS Audio Renderer Controller${reset}`);
  console.log(`${gray}========================================================${reset}`);
  console.log('Use this script to dry-run and compile approved TTS text requests into offline audio files.\n');
  console.log(`${bold}${yellow}Usage:${reset}`);
  console.log('  npm run narrator-tts-renderer -- "<command> [args]"\n');
  console.log(`${bold}${yellow}Available Commands:${reset}`);
  console.log(`  ${green}help${reset}                  : Print this command menu`);
  console.log(`  ${green}status${reset}                : Print status of approved requests, rendered audio, and local engines`);
  console.log(`  ${green}dry-run <REQ_ID>${reset}      : Validate text and simulate local rendering of an approved request`);
  console.log(`  ${green}render <REQ_ID>${reset}       : Render approved request by ID to local audio via offline Piper engine`);
  console.log(`  ${green}render-all-approved${reset}  : Batch compile all approved staged TTS requests to offline audio files\n`);
  console.log(`${gray}--------------------------------------------------------${reset}`);
  console.log(`${gray}All rendering is strictly local. Network API calls and auto-playback are disabled.${reset}`);
}

run();
export {};
