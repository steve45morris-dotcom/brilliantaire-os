import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  ASR_BINARY_DIR,
  ASR_MODEL_DIR,
  ASR_MANIFEST_PATH,
  ALLOWED_ASR_BINARY_NAMES,
  ALLOWED_ASR_MODEL_EXTENSIONS,
  MAX_ASR_MODEL_SIZE_LIMIT
} from '../config/narrator-asr-backend.config.js';

const LOG_DIR = path.join(process.cwd(), 'outputs/narrator/asr/logs');

function ensureDirs() {
  fs.mkdirSync(ASR_BINARY_DIR, { recursive: true });
  fs.mkdirSync(ASR_MODEL_DIR, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

interface ManifestEntry {
  sha256: string;
  type: 'backend' | 'model';
  registeredAt: string;
}

interface Manifest {
  [filePath: string]: ManifestEntry;
}

function readManifest(): Manifest {
  if (!fs.existsSync(ASR_MANIFEST_PATH)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(ASR_MANIFEST_PATH, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function writeManifest(manifest: Manifest) {
  const dir = path.dirname(ASR_MANIFEST_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ASR_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

const pad = (n: number) => String(n).padStart(2, '0');

function getTimestampStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

// ─── Status ──────────────────────────────────────────────────────────────────
function handleStatus() {
  ensureDirs();
  const manifest = readManifest();

  let binaryRegistered = 'None';
  let modelRegistered = 'None';

  for (const [relPath, entry] of Object.entries(manifest)) {
    const fullPath = path.resolve(process.cwd(), 'outputs/narrator/asr', relPath);
    if (fs.existsSync(fullPath)) {
      if (entry.type === 'backend') {
        binaryRegistered = `Registered (sha256: ${entry.sha256})`;
      } else if (entry.type === 'model') {
        modelRegistered = `Registered (sha256: ${entry.sha256})`;
      }
    }
  }

  // Double check actual files on disk
  const binOnDisk = fs.existsSync(path.join(ASR_BINARY_DIR, 'whisper'));
  const modelOnDisk = fs.existsSync(path.join(ASR_MODEL_DIR, 'ggml-base.en.bin'));

  console.log('\n=========================================');
  console.log('🎙️ AI ASR Backend Manager Status Report');
  console.log('=========================================');
  console.log(`Registered Whisper Binary  : ${binOnDisk ? 'Found' : 'Missing'} | ${binaryRegistered}`);
  console.log(`Registered Whisper Model   : ${modelOnDisk ? 'Found' : 'Missing'} | ${modelRegistered}`);
  console.log(`ASR Manifest Status        : ${fs.existsSync(ASR_MANIFEST_PATH) ? 'Active' : 'Missing'}`);
  console.log('=========================================\n');
}

// ─── Scan ────────────────────────────────────────────────────────────────────
function handleScan() {
  ensureDirs();
  const manifest = readManifest();

  console.log('\n=========================================');
  console.log('🔍 Scanning Controlled ASR Backend Directory');
  console.log('=========================================');

  const registeredFiles = Object.keys(manifest);
  const foundBinaries: string[] = [];
  const foundModels: string[] = [];

  if (fs.existsSync(ASR_BINARY_DIR)) {
    fs.readdirSync(ASR_BINARY_DIR).forEach(f => {
      if (f === 'whisper') foundBinaries.push('bin/whisper');
    });
  }

  if (fs.existsSync(ASR_MODEL_DIR)) {
    fs.readdirSync(ASR_MODEL_DIR).forEach(f => {
      if (f.endsWith('.bin')) foundModels.push(`local_assets/whisper_models/${f}`);
    });
  }

  console.log(`Registered Binaries  : ${foundBinaries.join(', ') || 'None'}`);
  console.log(`Registered Models    : ${foundModels.join(', ') || 'None'}`);
  console.log('=========================================\n');
}

// ─── Register Backend ────────────────────────────────────────────────────────
function handleRegisterBackend(sourcePath: string) {
  ensureDirs();
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Error: Source backend path "${sourcePath}" does not exist.`);
    process.exit(1);
  }

  const filename = path.basename(sourcePath);
  const lowercaseFilename = filename.toLowerCase();

  // Validate allowed filename
  if (!ALLOWED_ASR_BINARY_NAMES.includes(lowercaseFilename) && !ALLOWED_ASR_BINARY_NAMES.includes(filename)) {
    console.error(`❌ Error: Filename "${filename}" is not allowed. Whitelist: ${ALLOWED_ASR_BINARY_NAMES.join(', ')}`);
    process.exit(1);
  }

  const destPath = path.join(ASR_BINARY_DIR, 'whisper');
  try {
    fs.copyFileSync(sourcePath, destPath);
    fs.chmodSync(destPath, 0o755);
  } catch (e) {
    console.error(`❌ Error: Failed to copy ASR backend binary: ${(e as Error).message}`);
    process.exit(1);
  }

  const sha256 = getFileSha256(destPath);
  const relDestPath = 'bin/whisper';

  const manifest = readManifest();
  manifest[relDestPath] = {
    sha256,
    type: 'backend',
    registeredAt: timestamp
  };
  writeManifest(manifest);

  const output = `# 📦 ASR Backend Registration Report\n- Type: backend\n- Source: ${sourcePath}\n- Dest: ${destPath}\n- SHA256: ${sha256}\n- Timestamp: ${timestamp}`;
  console.log(`\n✅ Registered ASR backend successfully!`);
  console.log(`Path: ${destPath}`);
  console.log(`SHA256: ${sha256}\n`);

  fs.writeFileSync(path.join(LOG_DIR, `asr_backend_register_whisper_${getTimestampStr()}.md`), output, 'utf-8');
}

// ─── Register Model ──────────────────────────────────────────────────────────
function handleRegisterModel(sourcePath: string) {
  ensureDirs();
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Error: Source model path "${sourcePath}" does not exist.`);
    process.exit(1);
  }

  const ext = path.extname(sourcePath).toLowerCase();
  if (!ALLOWED_ASR_MODEL_EXTENSIONS.includes(ext)) {
    console.error(`❌ Error: Extension "${ext}" is not allowed. Whitelist: ${ALLOWED_ASR_MODEL_EXTENSIONS.join(', ')}`);
    process.exit(1);
  }

  const stat = fs.statSync(sourcePath);
  if (stat.size > MAX_ASR_MODEL_SIZE_LIMIT) {
    console.error(`❌ Error: File size (${stat.size} bytes) exceeds limit of ${MAX_ASR_MODEL_SIZE_LIMIT} bytes.`);
    process.exit(1);
  }

  const destPath = path.join(ASR_MODEL_DIR, 'ggml-base.en.bin');
  try {
    fs.copyFileSync(sourcePath, destPath);
  } catch (e) {
    console.error(`❌ Error: Failed to copy ASR model file: ${(e as Error).message}`);
    process.exit(1);
  }

  const sha256 = getFileSha256(destPath);
  const relDestPath = 'local_assets/whisper_models/ggml-base.en.bin';

  const manifest = readManifest();
  manifest[relDestPath] = {
    sha256,
    type: 'model',
    registeredAt: timestamp
  };
  writeManifest(manifest);

  const output = `# 📦 ASR Model Registration Report\n- Type: model\n- Source: ${sourcePath}\n- Dest: ${destPath}\n- SHA256: ${sha256}\n- Timestamp: ${timestamp}`;
  console.log(`\n✅ Registered ASR model successfully!`);
  console.log(`Path: ${destPath}`);
  console.log(`SHA256: ${sha256}\n`);

  fs.writeFileSync(path.join(LOG_DIR, `asr_model_register_ggml_${getTimestampStr()}.md`), output, 'utf-8');
}

// ─── Verify ──────────────────────────────────────────────────────────────────
function handleVerify() {
  ensureDirs();
  const manifest = readManifest();

  console.log('\n=========================================');
  console.log('🔍 Verifying ASR Checksum Manifest Integrity');
  console.log('=========================================');

  let verifiedCount = 0;
  let mismatchCount = 0;

  for (const [relPath, entry] of Object.entries(manifest)) {
    // For verify path mapping, bin/whisper is relative to rootDir
    // while local_assets/whisper_models is relative to rootDir as well.
    const fullPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) {
      mismatchCount++;
      console.log(`- [MISSING] ${relPath} (expected sha256: ${entry.sha256.substring(0, 8)}...)`);
      continue;
    }
    const currentHash = getFileSha256(fullPath);
    if (currentHash !== entry.sha256) {
      mismatchCount++;
      console.log(`- [MISMATCH] ${relPath} (expected ${entry.sha256.substring(0, 8)}, got ${currentHash.substring(0, 8)})`);
    } else {
      verifiedCount++;
      console.log(`- [VERIFIED] ${relPath} matches checksum (${entry.sha256.substring(0, 8)}...)`);
    }
  }

  const manifestStatus = mismatchCount === 0 && verifiedCount > 0 ? 'Consistent / Verified' : 'Inconsistent / Mismatches Found';
  console.log(`\nManifest Status: ${manifestStatus}. Verified: ${verifiedCount}, Failures: ${mismatchCount}`);
  console.log('=========================================\n');
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  let command = 'help';
  let target = '';

  if (args.length > 0) {
    if (args.length === 1 && args[0].includes(' ')) {
      const tokens = args[0].trim().split(/\s+/);
      command = tokens[0].toLowerCase();
      target = tokens.slice(1).join(' ');
    } else {
      command = args[0].toLowerCase();
      target = args[1] || '';
    }
  }

  const validCommands = ['help', 'status', 'scan', 'register-backend', 'register-model', 'verify'];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown ASR backend command: "${command}". Run "npm run narrator-asr-backend-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-asr-backend-help" to see options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
  } else if (command === 'scan') {
    handleScan();
  } else if (command === 'register-backend') {
    if (!target) {
      console.error('[ERR] Please specify a source path to register.');
      process.exit(1);
    }
    handleRegisterBackend(target);
  } else if (command === 'register-model') {
    if (!target) {
      console.error('[ERR] Please specify a source path to register.');
      process.exit(1);
    }
    handleRegisterModel(target);
  } else if (command === 'verify') {
    handleVerify();
  }
}

main();
