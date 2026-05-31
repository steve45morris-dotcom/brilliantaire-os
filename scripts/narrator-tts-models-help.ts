function run() {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const green = '\x1b[32m';
  const gray = '\x1b[90m';

  console.log(`${bold}${cyan}\n🎙️ Brilliantaire OS — Local TTS Model & Cache Manager Controller${reset}`);
  console.log(`${gray}================================================================${reset}`);
  console.log('Use this script to register, verify, and clean up offline speech synthesis binaries, voice models, and cache.\n');
  console.log(`${bold}${yellow}Usage:${reset}`);
  console.log('  npm run narrator-tts-models -- "<command> [args]"\n');
  console.log(`${bold}${yellow}Available Commands:${reset}`);
  console.log(`  ${green}status${reset}                                      : Show registration status of Piper engine, default voice model, and cache`);
  console.log(`  ${green}scan${reset}                                        : Scan assets directories for whitelisted files and unsafe extensions`);
  console.log(`  ${green}verify${reset}                                      : Verify SHA256 checksums of registered assets against manifest`);
  console.log(`  ${green}register-binary <LOCAL_PATH>${reset}                  : Register a local Piper binary into controlled directories`);
  console.log(`  ${green}register-model <MODEL_PATH> <CONFIG_PATH>${reset}   : Register an .onnx model and .json config under 'oracle-neutral'`);
  console.log(`  ${green}cache-status${reset}                                : Show cached audio counts and total disk usage`);
  console.log(`  ${green}cache-clean-dry-run${reset}                         : List cache files targeted for cleaning`);
  console.log(`  ${green}cache-clean-approved${reset}                        : Clean up cached audio files and write execution logs\n`);
  console.log(`${gray}----------------------------------------------------------------${reset}`);
  console.log(`${gray}Internet downloads and auto-executions are fully disabled. All registration is offline-first.${reset}`);
}

run();
export {};
