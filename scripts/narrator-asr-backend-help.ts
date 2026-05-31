function printHelp() {
  console.log('\n==================================================================');
  console.log('🎙️ Sentinel OS: Local ASR Backend & Model Manager Help Menu');
  console.log('==================================================================');
  console.log('This offline manager registers local Whisper executables and ggml models.');
  console.log('\n--- Supported Commands ---');
  console.log('  npm run narrator-asr-backend -- "status"');
  console.log('      Display ASR backend binary and model file registration status.');
  console.log('');
  console.log('  npm run narrator-asr-backend -- "scan"');
  console.log('      Scan directories to identify registered and unregistered assets.');
  console.log('');
  console.log('  npm run narrator-asr-backend -- "register-backend <LOCAL_PATH>"');
  console.log('      Copy and register a compiled local Whisper CLI executable to bin/whisper.');
  console.log('');
  console.log('  npm run narrator-asr-backend -- "register-model <LOCAL_PATH>"');
  console.log('      Copy and register a ggml .bin model to local_assets/whisper_models/ggml-base.en.bin.');
  console.log('');
  console.log('  npm run narrator-asr-backend -- "verify"');
  console.log('      Perform offline SHA256 integrity audits on registered ASR files.');
  console.log('\n--- Safety Policies ---');
  console.log('  1. Manual Registrations: No automatic network downloads of binary files.');
  console.log('  2. Whitelist Checks: Only filenames matching whisper or whisper-cli are allowed.');
  console.log('  3. Extension Gates: Models must have a .bin extension.');
  console.log('  4. No Execution on Register: Verification reads and hashes files but never runs them.');
  console.log('==================================================================\n');
}

printHelp();
