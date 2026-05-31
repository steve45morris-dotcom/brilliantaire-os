import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  PIPER_BINARY_DIR,
  PIPER_MODEL_DIR,
  PIPER_CONFIG_DIR,
  RENDERED_AUDIO_CACHE_DIR,
  CHECKSUM_MANIFEST_PATH,
  ALLOWED_BINARY_NAMES,
  ALLOWED_MODEL_EXTENSIONS,
  ALLOWED_CONFIG_EXTENSIONS,
  ALLOW_EXTERNAL_DOWNLOADS,
  MANUAL_INSTALL_MODE,
  DEFAULT_VOICE_PROFILE,
  CACHE_ENABLED,
  OVERWRITE_EXISTING_AUDIO,
  MAX_MODEL_SIZE_LIMIT,
  MAX_CONFIG_SIZE_LIMIT
} from '../config/narrator-tts-models.config.js';

// Setup directories
function ensureDirs() {
  fs.mkdirSync(PIPER_BINARY_DIR, { recursive: true });
  fs.mkdirSync(PIPER_MODEL_DIR, { recursive: true });
  fs.mkdirSync(RENDERED_AUDIO_CACHE_DIR, { recursive: true });
}

// SHA256 helper
function getFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Log directory
const LOG_DIR = path.join(process.cwd(), 'outputs/narrator/tts_queue/logs');

interface ManifestEntry {
  sha256: string;
  type: 'binary' | 'model' | 'config';
  registeredAt: string;
  profile?: string;
}

interface Manifest {
  [filePath: string]: ManifestEntry;
}

// Manifest helper
function readManifest(): Manifest {
  if (!fs.existsSync(CHECKSUM_MANIFEST_PATH)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CHECKSUM_MANIFEST_PATH, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function writeManifest(manifest: Manifest) {
  const dir = path.dirname(CHECKSUM_MANIFEST_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CHECKSUM_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getTimestampStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

// ─── Status ──────────────────────────────────────────────────────────────────
function handleStatus() {
  ensureDirs();
  const manifest = readManifest();

  // Look for registered binary
  let binaryRegistered = 'None';
  let binaryPath = '';
  for (const [relPath, entry] of Object.entries(manifest)) {
    if (entry.type === 'binary') {
      const fullPath = path.resolve(process.cwd(), 'outputs/narrator/tts_queue', relPath);
      if (fs.existsSync(fullPath)) {
        binaryRegistered = `Registered (sha256: ${entry.sha256})`;
        binaryPath = fullPath;
        break;
      }
    }
  }

  // Look for default voice model
  let modelRegistered = 'None';
  for (const [relPath, entry] of Object.entries(manifest)) {
    if (entry.type === 'model' && entry.profile === DEFAULT_VOICE_PROFILE) {
      const fullPath = path.resolve(process.cwd(), 'outputs/narrator/tts_queue', relPath);
      if (fs.existsSync(fullPath)) {
        modelRegistered = `Registered (sha256: ${entry.sha256})`;
        break;
      }
    }
  }

  // Look for default config
  let configRegistered = 'None';
  for (const [relPath, entry] of Object.entries(manifest)) {
    if (entry.type === 'config' && entry.profile === DEFAULT_VOICE_PROFILE) {
      const fullPath = path.resolve(process.cwd(), 'outputs/narrator/tts_queue', relPath);
      if (fs.existsSync(fullPath)) {
        configRegistered = `Registered (sha256: ${entry.sha256})`;
        break;
      }
    }
  }

  const manifestStatus = fs.existsSync(CHECKSUM_MANIFEST_PATH) ? 'Active' : 'Missing';
  const cacheCount = fs.existsSync(RENDERED_AUDIO_CACHE_DIR)
    ? fs.readdirSync(RENDERED_AUDIO_CACHE_DIR).filter(f => !f.startsWith('.')).length
    : 0;

  let totalCacheSize = 0;
  if (fs.existsSync(RENDERED_AUDIO_CACHE_DIR)) {
    const files = fs.readdirSync(RENDERED_AUDIO_CACHE_DIR);
    for (const f of files) {
      if (f.startsWith('.')) continue;
      const stat = fs.statSync(path.join(RENDERED_AUDIO_CACHE_DIR, f));
      totalCacheSize += stat.size;
    }
  }

  const templatePath = path.resolve(process.cwd(), 'templates/narrator_tts_renderer/tts-model-status-template.md');
  let output = '';
  if (fs.existsSync(templatePath)) {
    output = fs.readFileSync(templatePath, 'utf-8')
      .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
      .replace(/{{BINARY_REGISTERED}}/g, binaryRegistered)
      .replace(/{{MODEL_REGISTERED}}/g, modelRegistered)
      .replace(/{{CONFIG_REGISTERED}}/g, configRegistered)
      .replace(/{{MANIFEST_STATUS}}/g, manifestStatus)
      .replace(/{{CACHE_DIR}}/g, RENDERED_AUDIO_CACHE_DIR)
      .replace(/{{CACHE_ENABLED}}/g, String(CACHE_ENABLED))
      .replace(/{{CACHE_COUNT}}/g, String(cacheCount))
      .replace(/{{CACHE_SIZE}}/g, String(totalCacheSize))
      .replace(/{{ALLOW_DOWNLOADS}}/g, String(ALLOW_EXTERNAL_DOWNLOADS))
      .replace(/{{MANUAL_INSTALL}}/g, String(MANUAL_INSTALL_MODE));
  } else {
    output = `Status: Binary=${binaryRegistered}, Model=${modelRegistered}, Config=${configRegistered}`;
  }

  console.log(output);

  // Write to log directory
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOG_DIR, `tts_model_status_${getTimestampStr()}.md`), output, 'utf-8');
}

// ─── Scan ────────────────────────────────────────────────────────────────────
function handleScan() {
  ensureDirs();
  console.log('\n=========================================');
  console.log('🔍 Scanning Controlled TTS Assets Directory');
  console.log('=========================================');

  const binFiles = fs.readdirSync(PIPER_BINARY_DIR).filter(f => !f.startsWith('.'));
  const modelFiles = fs.readdirSync(PIPER_MODEL_DIR).filter(f => !f.startsWith('.'));
  const cacheFiles = fs.readdirSync(RENDERED_AUDIO_CACHE_DIR).filter(f => !f.startsWith('.'));

  const registeredBinaries: string[] = [];
  const registeredModels: string[] = [];
  const registeredConfigs: string[] = [];
  const unknownFiles: string[] = [];
  const unsafeExtensions: string[] = [];

  const allowedExtensions = [...ALLOWED_MODEL_EXTENSIONS, ...ALLOWED_CONFIG_EXTENSIONS, '.mp3', '.wav'];

  // Scan bin dir
  for (const file of binFiles) {
    const ext = path.extname(file);
    const lowercase = file.toLowerCase();
    if (ALLOWED_BINARY_NAMES.includes(lowercase) || ALLOWED_BINARY_NAMES.includes(file)) {
      registeredBinaries.push(`bin/${file}`);
    } else {
      unknownFiles.push(`bin/${file}`);
      if (ext && !allowedExtensions.includes(ext)) {
        unsafeExtensions.push(`bin/${file} (${ext})`);
      }
    }
  }

  // Scan models dir
  for (const file of modelFiles) {
    const ext = path.extname(file);
    if (ALLOWED_MODEL_EXTENSIONS.includes(ext)) {
      registeredModels.push(`models/${file}`);
    } else if (ALLOWED_CONFIG_EXTENSIONS.includes(ext)) {
      registeredConfigs.push(`models/${file}`);
    } else {
      unknownFiles.push(`models/${file}`);
      if (ext) {
        unsafeExtensions.push(`models/${file} (${ext})`);
      }
    }
  }

  console.log(`Registered Binaries  : ${registeredBinaries.length > 0 ? registeredBinaries.join(', ') : 'None'}`);
  console.log(`Registered Models    : ${registeredModels.length > 0 ? registeredModels.join(', ') : 'None'}`);
  console.log(`Registered Configs   : ${registeredConfigs.length > 0 ? registeredConfigs.join(', ') : 'None'}`);
  console.log(`Cache Audio Files    : ${cacheFiles.length} file(s)`);
  console.log(`Unknown Files        : ${unknownFiles.length > 0 ? unknownFiles.join(', ') : 'None'}`);
  console.log(`Unsafe/Invalid Files : ${unsafeExtensions.length > 0 ? unsafeExtensions.join(', ') : 'None'}`);
  console.log('=========================================\n');
}

// ─── Verify ──────────────────────────────────────────────────────────────────
function handleVerify(): boolean {
  ensureDirs();
  const manifest = readManifest();
  const timestamp = new Date().toISOString();
  let mismatchCount = 0;
  let verifiedCount = 0;
  const logLines: string[] = [];

  for (const [relPath, entry] of Object.entries(manifest)) {
    const fullPath = path.resolve(process.cwd(), 'outputs/narrator/tts_queue', relPath);
    if (!fs.existsSync(fullPath)) {
      mismatchCount++;
      logLines.push(`- [MISSING] File not found: ${relPath} (Expected SHA256: ${entry.sha256})`);
      continue;
    }

    // Verify extension
    const ext = path.extname(fullPath);
    if (entry.type === 'model' && !ALLOWED_MODEL_EXTENSIONS.includes(ext)) {
      mismatchCount++;
      logLines.push(`- [INVALID EXT] Model ${relPath} has incorrect extension ${ext}`);
      continue;
    }
    if (entry.type === 'config' && !ALLOWED_CONFIG_EXTENSIONS.includes(ext)) {
      mismatchCount++;
      logLines.push(`- [INVALID EXT] Config ${relPath} has incorrect extension ${ext}`);
      continue;
    }

    // Verify SHA256
    const calculatedHash = getFileSha256(fullPath);
    if (calculatedHash !== entry.sha256) {
      mismatchCount++;
      logLines.push(`- [CHECKSUM MISMATCH] ${relPath} expected ${entry.sha256}, got ${calculatedHash}`);
    } else {
      verifiedCount++;
      logLines.push(`- [VERIFIED] ${relPath} matches checksum (${entry.sha256.substring(0, 8)}...)`);
    }
  }

  const manifestStatus = mismatchCount === 0 && verifiedCount > 0 ? 'Consistent / Verified' : 'Inconsistent / Mismatches Found';

  const templatePath = path.resolve(process.cwd(), 'templates/narrator_tts_renderer/tts-checksum-manifest-template.md');
  let output = '';
  if (fs.existsSync(templatePath)) {
    output = fs.readFileSync(templatePath, 'utf-8')
      .replace(/{{TIMESTAMP}}/g, timestamp)
      .replace(/{{MANIFEST_PATH}}/g, CHECKSUM_MANIFEST_PATH)
      .replace(/{{MANIFEST_STATUS}}/g, manifestStatus)
      .replace(/{{VERIFIED_COUNT}}/g, String(verifiedCount))
      .replace(/{{MISMATCH_COUNT}}/g, String(mismatchCount))
      .replace(/{{VERIFICATION_LOG}}/g, logLines.length > 0 ? logLines.join('\n') : 'No files registered in manifest.');
  } else {
    output = `Manifest Status: ${manifestStatus}. Verified: ${verifiedCount}, Failures: ${mismatchCount}`;
  }

  console.log(output);

  // Write report
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOG_DIR, `tts_checksum_verify_${getTimestampStr()}.md`), output, 'utf-8');

  return mismatchCount === 0;
}

// ─── Register Binary ─────────────────────────────────────────────────────────
function handleRegisterBinary(sourcePath: string) {
  ensureDirs();
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(sourcePath)) {
    const errorMsg = `Source binary path "${sourcePath}" does not exist.`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-binary', errorMsg);
    process.exit(1);
  }

  const filename = path.basename(sourcePath);
  const lowercaseFilename = filename.toLowerCase();

  // Validate allowed filename
  if (!ALLOWED_BINARY_NAMES.includes(lowercaseFilename) && !ALLOWED_BINARY_NAMES.includes(filename)) {
    const errorMsg = `Filename "${filename}" is not allowed. Whitelist: ${ALLOWED_BINARY_NAMES.join(', ')}`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-binary', errorMsg);
    process.exit(1);
  }

  // Copy binary
  const destPath = path.join(PIPER_BINARY_DIR, filename);
  try {
    fs.copyFileSync(sourcePath, destPath);
    // Make executable
    fs.chmodSync(destPath, 0o755);
  } catch (e) {
    const errorMsg = `Failed to copy binary: ${(e as Error).message}`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-binary', errorMsg);
    process.exit(1);
  }

  const sha256 = getFileSha256(destPath);

  // Add to manifest
  const relDestPath = path.relative(path.join(process.cwd(), 'outputs/narrator/tts_queue'), destPath);
  const manifest = readManifest();
  manifest[relDestPath] = {
    sha256,
    type: 'binary',
    registeredAt: timestamp
  };
  writeManifest(manifest);

  const templatePath = path.resolve(process.cwd(), 'templates/narrator_tts_renderer/tts-model-register-template.md');
  let output = '';
  if (fs.existsSync(templatePath)) {
    output = fs.readFileSync(templatePath, 'utf-8')
      .replace(/{{TIMESTAMP}}/g, timestamp)
      .replace(/{{ASSET_TYPE}}/g, 'binary')
      .replace(/{{FILENAME}}/g, filename)
      .replace(/{{SOURCE_PATH}}/g, sourcePath)
      .replace(/{{DEST_PATH}}/g, destPath)
      .replace(/{{PROFILE}}/g, 'N/A')
      .replace(/{{SHA256}}/g, sha256);
  } else {
    output = `Successfully registered binary ${filename} with hash ${sha256}`;
  }

  console.log(output);

  // Write log
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOG_DIR, `tts_asset_register_${filename}_${getTimestampStr()}.md`), output, 'utf-8');
}

// ─── Register Model ──────────────────────────────────────────────────────────
function handleRegisterModel(modelPath: string, configPath: string) {
  ensureDirs();
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(modelPath)) {
    const errorMsg = `Source model path "${modelPath}" does not exist.`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-model', errorMsg);
    process.exit(1);
  }

  if (!fs.existsSync(configPath)) {
    const errorMsg = `Source config path "${configPath}" does not exist.`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-model', errorMsg);
    process.exit(1);
  }

  const modelExt = path.extname(modelPath);
  const configExt = path.extname(configPath);

  // Validate extensions
  if (!ALLOWED_MODEL_EXTENSIONS.includes(modelExt)) {
    const errorMsg = `Invalid model extension "${modelExt}". Allowed: ${ALLOWED_MODEL_EXTENSIONS.join(', ')}`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-model', errorMsg);
    process.exit(1);
  }

  if (!ALLOWED_CONFIG_EXTENSIONS.includes(configExt)) {
    const errorMsg = `Invalid config extension "${configExt}". Allowed: ${ALLOWED_CONFIG_EXTENSIONS.join(', ')}`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-model', errorMsg);
    process.exit(1);
  }

  // Validate sizes
  const modelSize = fs.statSync(modelPath).size;
  const configSize = fs.statSync(configPath).size;

  if (modelSize > MAX_MODEL_SIZE_LIMIT) {
    const errorMsg = `Model file size (${modelSize} bytes) exceeds limit of ${MAX_MODEL_SIZE_LIMIT} bytes.`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-model', errorMsg);
    process.exit(1);
  }

  if (configSize > MAX_CONFIG_SIZE_LIMIT) {
    const errorMsg = `Config file size (${configSize} bytes) exceeds limit of ${MAX_CONFIG_SIZE_LIMIT} bytes.`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-model', errorMsg);
    process.exit(1);
  }

  const modelName = `${DEFAULT_VOICE_PROFILE}${modelExt}`;
  const configName = `${DEFAULT_VOICE_PROFILE}${configExt}`;

  const destModelPath = path.join(PIPER_MODEL_DIR, modelName);
  const destConfigPath = path.join(PIPER_CONFIG_DIR, configName);

  // Copy files
  try {
    fs.copyFileSync(modelPath, destModelPath);
    fs.copyFileSync(configPath, destConfigPath);
  } catch (e) {
    const errorMsg = `Failed to copy model/config files: ${(e as Error).message}`;
    console.error(`❌ Error: ${errorMsg}`);
    writeErrorReport('register-model', errorMsg);
    process.exit(1);
  }

  const modelSha = getFileSha256(destModelPath);
  const configSha = getFileSha256(destConfigPath);

  // Add to manifest
  const relDestModel = path.relative(path.join(process.cwd(), 'outputs/narrator/tts_queue'), destModelPath);
  const relDestConfig = path.relative(path.join(process.cwd(), 'outputs/narrator/tts_queue'), destConfigPath);

  const manifest = readManifest();
  manifest[relDestModel] = {
    sha256: modelSha,
    type: 'model',
    registeredAt: timestamp,
    profile: DEFAULT_VOICE_PROFILE
  };
  manifest[relDestConfig] = {
    sha256: configSha,
    type: 'config',
    registeredAt: timestamp,
    profile: DEFAULT_VOICE_PROFILE
  };
  writeManifest(manifest);

  const templatePath = path.resolve(process.cwd(), 'templates/narrator_tts_renderer/tts-model-register-template.md');
  let output = '';
  if (fs.existsSync(templatePath)) {
    output = fs.readFileSync(templatePath, 'utf-8')
      .replace(/{{TIMESTAMP}}/g, timestamp)
      .replace(/{{ASSET_TYPE}}/g, 'model_and_config')
      .replace(/{{FILENAME}}/g, `${modelName} / ${configName}`)
      .replace(/{{SOURCE_PATH}}/g, `${modelPath} / ${configPath}`)
      .replace(/{{DEST_PATH}}/g, `${destModelPath} / ${destConfigPath}`)
      .replace(/{{PROFILE}}/g, DEFAULT_VOICE_PROFILE)
      .replace(/{{SHA256}}/g, `${modelSha} / ${configSha}`);
  } else {
    output = `Registered model/config for profile ${DEFAULT_VOICE_PROFILE} with hashes ${modelSha} / ${configSha}`;
  }

  console.log(output);

  // Write log
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOG_DIR, `tts_asset_register_${DEFAULT_VOICE_PROFILE}_${getTimestampStr()}.md`), output, 'utf-8');
}

// ─── Cache Status ────────────────────────────────────────────────────────────
function handleCacheStatus() {
  ensureDirs();
  const cacheFiles = fs.existsSync(RENDERED_AUDIO_CACHE_DIR)
    ? fs.readdirSync(RENDERED_AUDIO_CACHE_DIR).filter(f => !f.startsWith('.'))
    : [];

  let totalSize = 0;
  let oldestTime = Infinity;
  let newestTime = 0;
  let oldestFile = 'N/A';
  let newestFile = 'N/A';

  for (const file of cacheFiles) {
    const fullPath = path.join(RENDERED_AUDIO_CACHE_DIR, file);
    const stat = fs.statSync(fullPath);
    totalSize += stat.size;

    if (stat.mtimeMs < oldestTime) {
      oldestTime = stat.mtimeMs;
      oldestFile = `${file} (${new Date(stat.mtimeMs).toISOString()})`;
    }
    if (stat.mtimeMs > newestTime) {
      newestTime = stat.mtimeMs;
      newestFile = `${file} (${new Date(stat.mtimeMs).toISOString()})`;
    }
  }

  console.log('\n=========================================');
  console.log('🎙️ AI TTS Audio Cache Status Report');
  console.log('=========================================');
  console.log(`Cache Enabled        : ${CACHE_ENABLED}`);
  console.log(`Cache Directory Path : ${RENDERED_AUDIO_CACHE_DIR}`);
  console.log(`Total Cached Files   : ${cacheFiles.length}`);
  console.log(`Total Cache Size     : ${totalSize} bytes`);
  console.log(`Oldest Cached File   : ${oldestFile}`);
  console.log(`Newest Cached File   : ${newestFile}`);
  console.log('=========================================\n');
}

// ─── Cache Cleanup dry-run ───────────────────────────────────────────────────
function handleCacheCleanDryRun() {
  ensureDirs();
  const cacheFiles = fs.readdirSync(RENDERED_AUDIO_CACHE_DIR).filter(f => !f.startsWith('.'));
  console.log('\n=========================================');
  console.log('🧹 [DRY-RUN] Cache Cleanup Simulation');
  console.log('=========================================');

  // Let's identify orphaned cache entries or clean all files in the cache.
  // The cache holds only compiled audio files from requests. Since they are audio cache files, 
  // we clean files that are old or simply list everything to be cleaned.
  // To protect registered models/configs/manifest, they are in bin/ and models/ and queue/, 
  // whereas the cache files are strictly in rendered_audio/.
  // So all files in rendered_audio/ are safe to be cleaned.
  
  let totalSpace = 0;
  const list: string[] = [];
  for (const file of cacheFiles) {
    const fullPath = path.join(RENDERED_AUDIO_CACHE_DIR, file);
    const stat = fs.statSync(fullPath);
    totalSpace += stat.size;
    list.push(`- ${file} (${stat.size} bytes)`);
  }

  if (list.length === 0) {
    console.log('No cache files to clean.');
  } else {
    console.log(`Files targeted for deletion in cache directory (${RENDERED_AUDIO_CACHE_DIR}):`);
    console.log(list.join('\n'));
    console.log(`\nReclaimable Space: ${totalSpace} bytes across ${list.length} file(s).`);
  }
  console.log('=========================================\n');
}

// ─── Cache Cleanup Approved ──────────────────────────────────────────────────
function handleCacheCleanApproved() {
  ensureDirs();
  const cacheFiles = fs.readdirSync(RENDERED_AUDIO_CACHE_DIR).filter(f => !f.startsWith('.'));
  const timestamp = new Date().toISOString();
  const logFilename = `tts_cache_cleanup_${getTimestampStr()}.md`;
  
  let deletedCount = 0;
  let reclaimedSize = 0;
  const filesAnalyzed = cacheFiles.length;
  let totalSize = 0;

  for (const file of cacheFiles) {
    const fullPath = path.join(RENDERED_AUDIO_CACHE_DIR, file);
    const stat = fs.statSync(fullPath);
    totalSize += stat.size;
    try {
      fs.unlinkSync(fullPath);
      deletedCount++;
      reclaimedSize += stat.size;
    } catch (e) {
      console.error(`[ERR] Failed to delete ${file}: ${(e as Error).message}`);
    }
  }

  const templatePath = path.resolve(process.cwd(), 'templates/narrator_tts_renderer/tts-cache-summary-template.md');
  let output = '';
  if (fs.existsSync(templatePath)) {
    output = fs.readFileSync(templatePath, 'utf-8')
      .replace(/{{TIMESTAMP}}/g, timestamp)
      .replace(/{{COMMAND}}/g, 'cache-clean-approved')
      .replace(/{{FILES_ANALYZED}}/g, String(filesAnalyzed))
      .replace(/{{TOTAL_SIZE}}/g, String(totalSize))
      .replace(/{{DELETION_COUNT}}/g, String(deletedCount))
      .replace(/{{RECLAIMED_SIZE}}/g, String(reclaimedSize))
      .replace(/{{STATUS}}/g, 'Success');
  } else {
    output = `Cleaned ${deletedCount} cache files. Reclaimed ${reclaimedSize} bytes.`;
  }

  console.log(output);

  // Write log
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOG_DIR, logFilename), output, 'utf-8');
}

// ─── Error Logging ───────────────────────────────────────────────────────────
function writeErrorReport(operation: string, errorMsg: string) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const timestamp = new Date().toISOString();
    const templatePath = path.resolve(process.cwd(), 'templates/narrator_tts_renderer/tts-model-error-template.md');
    
    let output = '';
    if (fs.existsSync(templatePath)) {
      output = fs.readFileSync(templatePath, 'utf-8')
        .replace(/{{TIMESTAMP}}/g, timestamp)
        .replace(/{{OPERATION}}/g, operation)
        .replace(/{{ERROR_MESSAGE}}/g, errorMsg);
    } else {
      output = `Error during ${operation}: ${errorMsg}`;
    }

    const logFilename = `tts_model_error_${operation}_${getTimestampStr()}.md`;
    fs.writeFileSync(path.join(LOG_DIR, logFilename), output, 'utf-8');
  } catch (e) {
    console.error('[ERR] Failed to write error log:', e);
  }
}

// ─── CLI Entry ───────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const commandInput = args[0] ? args[0].trim() : 'help';

  const tokens = commandInput.split(/\s+/);
  const command = tokens[0].toLowerCase();
  
  const validCommands = [
    'help',
    'status',
    'scan',
    'verify',
    'register-binary',
    'register-model',
    'cache-status',
    'cache-clean-dry-run',
    'cache-clean-approved'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run narrator-tts-models-help" (or equivalent) for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Available commands: ' + validCommands.join(', '));
    return;
  }

  if (command === 'status') {
    handleStatus();
    return;
  }

  if (command === 'scan') {
    handleScan();
    return;
  }

  if (command === 'verify') {
    const success = handleVerify();
    if (!success) {
      process.exit(1);
    }
    return;
  }

  if (command === 'register-binary') {
    const localPath = tokens[1] || args[1] || '';
    if (!localPath) {
      console.error('[ERR] Please specify the local path to the binary: register-binary <LOCAL_PATH>');
      process.exit(1);
    }
    handleRegisterBinary(localPath);
    return;
  }

  if (command === 'register-model') {
    const mPath = tokens[1] || args[1] || '';
    const cPath = tokens[2] || args[2] || '';
    if (!mPath || !cPath) {
      console.error('[ERR] Please specify both model and config paths: register-model <MODEL_PATH> <CONFIG_PATH>');
      process.exit(1);
    }
    handleRegisterModel(mPath, cPath);
    return;
  }

  if (command === 'cache-status') {
    handleCacheStatus();
    return;
  }

  if (command === 'cache-clean-dry-run') {
    handleCacheCleanDryRun();
    return;
  }

  if (command === 'cache-clean-approved') {
    handleCacheCleanApproved();
    return;
  }
}

main();
