import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  DRY_RUN_ONLY,
  ALLOW_ASR_EXECUTION,
  ALLOW_MODEL_DOWNLOAD,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_SHELL_EXECUTION,
  ALLOW_AUDIO_MUTATION,
  ALLOW_MODEL_MUTATION,
  MODEL_DIRECTORY,
  OUTPUT_DIRECTORY,
  APPROVED_AUDIO_INPUT_DIRECTORIES,
  APPROVED_AUDIO_EXTENSIONS,
  ALLOWED_MODEL_EXTENSIONS,
  PRIMARY_CHECKSUM_MANIFEST,
  LOCAL_CHECKSUM_MANIFEST,
  FALLBACK_MODEL_CHECKSUMS,
  REPO_ROOT
} from '../config/asr-dry-run-transcription-gate.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DiscoveredModel {
  name: string;
  size: number;
  sha256: string;
  expectedSha256: string;
  checksumStatus: 'pass' | 'failed' | 'incomplete_metadata';
  trustStatus: 'trusted' | 'failed' | 'incomplete';
}

interface AudioFileMetadata {
  filename: string;
  localPath: string;
  extension: string;
  size: number;
  modifiedTime: string;
  eligibility: 'eligible' | 'rejected';
  rejectionReason: string;
}

interface SimulatedRoute {
  route_id: string;
  audio_file: string;
  model_candidate: string;
  model_trust_status: string;
  checksum_status: string;
  estimated_processing_mode: 'offline_future';
  asr_called: false;
  transcription_generated: false;
  external_service_called: false;
  readiness_status: 'dry_run_ready' | 'blocked';
  risk_flags: string[];
  next_action: string;
}

async function runDryRunValidator() {
  console.log("🚦 Initializing Offline ASR Dry-Run Transcription Readiness Gate...");
  await announceIntent("Initializing Offline ASR Dry-Run Transcription Readiness Gate.");

  // Safety Assertion Gate Enforcement
  if (
    !DRY_RUN_ONLY ||
    ALLOW_ASR_EXECUTION ||
    ALLOW_MODEL_DOWNLOAD ||
    ALLOW_EXTERNAL_API_CALLS ||
    ALLOW_SHELL_EXECUTION ||
    ALLOW_AUDIO_MUTATION ||
    ALLOW_MODEL_MUTATION
  ) {
    console.error("❌ Safety Gate Violation: Unauthorized execution, network, or mutation parameters detected.");
    await announceCompletion("Safety Gate Violation triggered. Validator terminated.", "0");
    process.exit(1);
  }

  const currentDate = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // Ensure model directory exists
  if (!fs.existsSync(MODEL_DIRECTORY)) {
    fs.mkdirSync(MODEL_DIRECTORY, { recursive: true });
  }

  // Ensure approved audio directories exist
  APPROVED_AUDIO_INPUT_DIRECTORIES.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.warn(`[Warning] Could not create approved audio directory: ${dir}`);
      }
    }
  });

  // Load checksum manifest metadata
  let expectedChecksums: Record<string, string> = { ...FALLBACK_MODEL_CHECKSUMS };
  let manifestFound = 'None (Using hardcoded fallbacks)';

  try {
    if (fs.existsSync(PRIMARY_CHECKSUM_MANIFEST)) {
      const data = JSON.parse(fs.readFileSync(PRIMARY_CHECKSUM_MANIFEST, 'utf-8'));
      expectedChecksums = { ...expectedChecksums, ...data };
      manifestFound = PRIMARY_CHECKSUM_MANIFEST;
    } else if (fs.existsSync(LOCAL_CHECKSUM_MANIFEST)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_CHECKSUM_MANIFEST, 'utf-8'));
      expectedChecksums = { ...expectedChecksums, ...data };
      manifestFound = LOCAL_CHECKSUM_MANIFEST;
    }
  } catch (err) {
    console.warn(`[Warning] Failed to load checksum manifest: ${(err as Error).message}`);
  }

  // 1. Model Discovery & Verification
  const discoveredModels: DiscoveredModel[] = [];
  const modelFiles = fs.existsSync(MODEL_DIRECTORY) ? fs.readdirSync(MODEL_DIRECTORY) : [];

  modelFiles.forEach(file => {
    if (file === '.DS_Store' || file === 'README.md' || file === 'SKILL.md') return;
    const filePath = path.join(MODEL_DIRECTORY, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) return;

    const ext = path.extname(file).toLowerCase();
    if (!ALLOWED_MODEL_EXTENSIONS.includes(ext)) return;

    // Cryptographic calculation of local hashes (only since files exist)
    let sha256 = '';
    try {
      sha256 = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    } catch (err) {
      console.error(`[Error] Failed to calculate hash for ${file}: ${(err as Error).message}`);
      return;
    }

    const expectedSha256 = expectedChecksums[file] || '';
    let checksumStatus: DiscoveredModel['checksumStatus'] = 'incomplete_metadata';
    let trustStatus: DiscoveredModel['trustStatus'] = 'incomplete';

    if (expectedSha256) {
      if (sha256 === expectedSha256) {
        checksumStatus = 'pass';
        trustStatus = 'trusted';
      } else {
        checksumStatus = 'failed';
        trustStatus = 'failed';
      }
    }

    discoveredModels.push({
      name: file,
      size: stats.size,
      sha256,
      expectedSha256: expectedSha256 || 'Unknown (Missing from manifest)',
      checksumStatus,
      trustStatus
    });
  });

  // 2. Audio Input Inspection
  const audioFiles: AudioFileMetadata[] = [];

  APPROVED_AUDIO_INPUT_DIRECTORIES.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file === '.DS_Store' || file === 'README.md' || file === 'SKILL.md') return;
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) return;

      const ext = path.extname(file).toLowerCase();
      const isApprovedExt = APPROVED_AUDIO_EXTENSIONS.includes(ext);
      const isEmpty = stats.size === 0;

      let eligibility: AudioFileMetadata['eligibility'] = 'eligible';
      let rejectionReason = 'N/A';

      if (!isApprovedExt) {
        eligibility = 'rejected';
        rejectionReason = `Unsupported audio extension: "${ext}"`;
      } else if (isEmpty) {
        eligibility = 'rejected';
        rejectionReason = 'Empty file (0 bytes)';
      }

      audioFiles.push({
        filename: file,
        localPath: filePath,
        extension: ext,
        size: stats.size,
        modifiedTime: stats.mtime.toISOString(),
        eligibility,
        rejectionReason
      });
    });
  });

  const eligibleAudio = audioFiles.filter(a => a.eligibility === 'eligible');
  const rejectedAudio = audioFiles.filter(a => a.eligibility === 'rejected');

  // 3. Dry-Run Routing Simulation
  const simulatedRoutes: SimulatedRoute[] = [];
  let routeIndex = 1;

  eligibleAudio.forEach(audio => {
    // Select candidate model (pick first trusted model if available, else first discovered, else default)
    let candidateModel = 'ggml-base.bin';
    let trustStatus = 'missing_model_file';
    let checksumStatus = 'missing_file';
    let readinessStatus: SimulatedRoute['readiness_status'] = 'blocked';
    let riskFlags: string[] = ['MISSING_MODEL_FILE'];
    let nextAction = 'Acquire valid Whisper model file manually';

    const trustedModel = discoveredModels.find(m => m.trustStatus === 'trusted');
    const fallbackModel = discoveredModels[0];

    if (trustedModel) {
      candidateModel = trustedModel.name;
      trustStatus = 'trusted';
      checksumStatus = 'pass';
      readinessStatus = 'dry_run_ready';
      riskFlags = ['NO_EXECUTION_ENFORCED'];
      nextAction = 'Move to Phase 12A human approval';
    } else if (fallbackModel) {
      candidateModel = fallbackModel.name;
      trustStatus = fallbackModel.trustStatus;
      checksumStatus = fallbackModel.checksumStatus;
      readinessStatus = 'blocked';
      riskFlags = [
        fallbackModel.trustStatus === 'failed' ? 'CHECKSUM_MISMATCH' : 'CHECKSUM_UNVERIFIED'
      ];
      nextAction = fallbackModel.trustStatus === 'failed'
        ? 'Replace corrupted model file manually'
        : 'Update checksum manifest with model hash';
    }

    simulatedRoutes.push({
      route_id: `ROUTE-${String(routeIndex++).padStart(2, '0')}`,
      audio_file: audio.localPath,
      model_candidate: candidateModel,
      model_trust_status: trustStatus,
      checksum_status: checksumStatus,
      estimated_processing_mode: 'offline_future',
      asr_called: false,
      transcription_generated: false,
      external_service_called: false,
      readiness_status: readinessStatus,
      risk_flags: riskFlags,
      next_action: nextAction
    });
  });

  // 4. Blocker & Status Audits (Fail-closed rules)
  const blockers: string[] = [];
  let gateStatus: 'blocked' | 'dry_run_ready' = 'dry_run_ready';

  // Model validation rules
  if (discoveredModels.length === 0) {
    blockers.push("No Whisper model files discovered in models/asr/whisper/.");
    gateStatus = 'blocked';
  } else {
    const unverifiedCount = discoveredModels.filter(m => m.trustStatus !== 'trusted').length;
    if (unverifiedCount > 0) {
      blockers.push(`Found ${unverifiedCount} model files that are not cryptographically trusted (failed checksum or incomplete metadata).`);
      gateStatus = 'blocked';
    }
  }

  // Audio input validation rules
  if (eligibleAudio.length === 0) {
    blockers.push("No eligible audio input files found in approved directories.");
    gateStatus = 'blocked';
  }

  // Calculate readiness score
  let score = 100;
  if (discoveredModels.length === 0) {
    score -= 40;
  } else {
    const failedChecksums = discoveredModels.filter(m => m.trustStatus === 'failed').length;
    const incompleteMetadata = discoveredModels.filter(m => m.trustStatus === 'incomplete').length;
    if (failedChecksums > 0) score -= 30;
    if (incompleteMetadata > 0) score -= 15;
  }

  if (eligibleAudio.length === 0) {
    score -= 30;
  }

  const readinessScore = Math.max(0, score);

  // If score is less than 100, enforce gate status as blocked
  if (readinessScore < 100) {
    gateStatus = 'blocked';
  }

  // 5. Template Compilations
  const getTemplateContent = (name: string): string => {
    const tPath = path.join(REPO_ROOT, 'templates', name);
    if (!fs.existsSync(tPath)) {
      throw new Error(`Template not found at: ${tPath}`);
    }
    return fs.readFileSync(tPath, 'utf-8');
  };

  const getAudioDirsList = (): string => {
    return APPROVED_AUDIO_INPUT_DIRECTORIES.map(d => `- \`${d}\``).join('\n');
  };

  // Compile 1: Plan
  const planTemplate = getTemplateContent('asr-dry-run-plan-template.md');
  const planContent = planTemplate
    .replace(/\{\{DATE\}\}/g, currentDate)
    .replace(/\{\{REPO_ROOT\}\}/g, REPO_ROOT)
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, MODEL_DIRECTORY)
    .replace(/\{\{AUDIO_DIRS_LIST\}\}/g, getAudioDirsList());
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_dry_run_plan_${currentDate}.md`), planContent, 'utf-8');

  // Compile 2: Model Readiness
  let modelsTable = '';
  if (discoveredModels.length > 0) {
    discoveredModels.forEach(m => {
      modelsTable += `| ${m.name} | ${m.size} | \`${m.sha256}\` | \`${m.expectedSha256}\` | ${m.checksumStatus.toUpperCase()} | ${m.trustStatus.toUpperCase()} |\n`;
    });
  } else {
    modelsTable = '| *No models discovered* | - | - | - | - | - |\n';
  }
  const modelTemplate = getTemplateContent('asr-model-readiness-template.md');
  const modelContent = modelTemplate
    .replace(/\{\{DATE\}\}/g, currentDate)
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, MODEL_DIRECTORY)
    .replace(/\{\{MANIFEST_FOUND\}\}/g, manifestFound)
    .replace(/\{\{READINESS_STATUS\}\}/g, gateStatus.toUpperCase())
    .replace(/\{\{MODELS_TABLE\}\}/g, modelsTable.trim());
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_model_readiness_${currentDate}.md`), modelContent, 'utf-8');

  // Compile 3: Audio Inputs
  let audioTable = '';
  if (audioFiles.length > 0) {
    audioFiles.forEach(a => {
      audioTable += `| ${a.filename} | \`${a.localPath}\` | ${a.size} | ${a.extension} | ${a.modifiedTime} | ${a.eligibility.toUpperCase()} | ${a.rejectionReason} |\n`;
    });
  } else {
    audioTable = '| *No files inspected* | - | 0 | - | - | - | - |\n';
  }
  const audioTemplate = getTemplateContent('asr-audio-input-template.md');
  const audioContent = audioTemplate
    .replace(/\{\{DATE\}\}/g, currentDate)
    .replace(/\{\{TOTAL_FILES\}\}/g, String(audioFiles.length))
    .replace(/\{\{ELIGIBLE_COUNT\}\}/g, String(eligibleAudio.length))
    .replace(/\{\{REJECTED_COUNT\}\}/g, String(rejectedAudio.length))
    .replace(/\{\{AUDIO_DIRS_LIST\}\}/g, getAudioDirsList())
    .replace(/\{\{AUDIO_FILES_TABLE\}\}/g, audioTable.trim());
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_inputs_${currentDate}.md`), audioContent, 'utf-8');

  // Compile 4: Routes
  let routesTable = '';
  if (simulatedRoutes.length > 0) {
    simulatedRoutes.forEach(r => {
      routesTable += `| ${r.route_id} | \`${r.audio_file}\` | ${r.model_candidate} | ${r.model_trust_status.toUpperCase()} | ${r.checksum_status.toUpperCase()} | ${r.estimated_processing_mode} | ${r.asr_called} | ${r.transcription_generated} | ${r.external_service_called} | ${r.risk_flags.join(',')} | ${r.readiness_status.toUpperCase()} |\n`;
    });
  } else {
    routesTable = '| *No routes planned* | - | - | - | - | - | - | - | - | - | - |\n';
  }
  const routeTemplate = getTemplateContent('asr-transcription-route-template.md');
  const routeContent = routeTemplate
    .replace(/\{\{DATE\}\}/g, currentDate)
    .replace(/\{\{ROUTE_COUNT\}\}/g, String(simulatedRoutes.length))
    .replace(/\{\{ROUTES_TABLE\}\}/g, routesTable.trim());
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_transcription_routes_${currentDate}.md`), routeContent, 'utf-8');

  // Compile 5: Risk Review
  const riskTemplate = getTemplateContent('asr-risk-review-template.md');
  const cleanCompliance = gateStatus === 'dry_run_ready' ? 'FULLY_COMPLIANT' : 'NON_COMPLIANT';
  const hasFailedModels = discoveredModels.some(m => m.trustStatus === 'failed');
  const hasIncompleteModels = discoveredModels.some(m => m.trustStatus === 'incomplete');
  let checksumsMatchText = 'No models found';
  if (discoveredModels.length > 0) {
    checksumsMatchText = hasFailedModels ? 'Failed' : hasIncompleteModels ? 'Incomplete Metadata' : 'Passed';
  }
  const riskContent = riskTemplate
    .replace(/\{\{DATE\}\}/g, currentDate)
    .replace(/\{\{SAFETY_SCORE\}\}/g, String(readinessScore))
    .replace(/\{\{COMPLIANCE_STATUS\}\}/g, cleanCompliance)
    .replace(/\{\{ZERO_EXECUTION\}\}/g, 'PASS')
    .replace(/\{\{ZERO_DOWNLOADS\}\}/g, 'PASS')
    .replace(/\{\{ZERO_APIS\}\}/g, 'PASS')
    .replace(/\{\{CHECKSUMS_MATCH\}\}/g, checksumsMatchText)
    .replace(/\{\{CHECKSUM_COMPLIANCE\}\}/g, gateStatus === 'dry_run_ready' ? 'PASS' : 'BLOCKED')
    .replace(/\{\{FAIL_CLOSED\}\}/g, gateStatus === 'dry_run_ready' ? 'PASS' : 'BLOCKED')
    .replace(/\{\{ALIAS_REJECTION\}\}/g, 'PASS');
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_risk_review_${currentDate}.md`), riskContent, 'utf-8');

  // Compile 6: Summary
  const summaryTemplate = getTemplateContent('asr-dry-run-summary-template.md');
  const blockersListText = blockers.length > 0 ? blockers.map(b => `- ${b}`).join('\n') : "- None";
  const verifiedModelsCount = discoveredModels.filter(m => m.trustStatus === 'trusted').length;
  const manifestFileOutName = `asr_dry_run_manifest_${currentDate}.json`;
  const summaryContent = summaryTemplate
    .replace(/\{\{DATE\}\}/g, currentDate)
    .replace(/\{\{READINESS_SCORE\}\}/g, String(readinessScore))
    .replace(/\{\{GATE_STATUS\}\}/g, gateStatus.toUpperCase())
    .replace(/\{\{TOTAL_MODELS\}\}/g, String(discoveredModels.length))
    .replace(/\{\{VERIFIED_MODELS\}\}/g, String(verifiedModelsCount))
    .replace(/\{\{ELIGIBLE_AUDIO\}\}/g, String(eligibleAudio.length))
    .replace(/\{\{ROUTES_GENERATED\}\}/g, String(simulatedRoutes.length))
    .replace(/\{\{CHECKSUM_SUMMARY\}\}/g, gateStatus === 'dry_run_ready' ? 'Verified (PASS)' : 'Verification Blocked / Failed')
    .replace(/\{\{AUDIO_SUMMARY\}\}/g, eligibleAudio.length > 0 ? `Found ${eligibleAudio.length} eligible files` : 'No eligible files')
    .replace(/\{\{MANIFEST_PATH\}\}/g, manifestFileOutName)
    .replace(/\{\{BLOCKERS_LIST\}\}/g, blockersListText);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_dry_run_summary_${currentDate}.md`), summaryContent, 'utf-8');

  // Compile 7: Next Actions
  const nextActionsTemplate = getTemplateContent('asr-next-actions-template.md');
  const nextActionsContent = nextActionsTemplate
    .replace(/\{\{DATE\}\}/g, currentDate);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${currentDate}.md`), nextActionsContent, 'utf-8');

  // 6. JSON Manifest Generation
  const manifestData = {
    dry_run_date: currentDate,
    safety_assertions: {
      dry_run_only: DRY_RUN_ONLY,
      allow_asr_execution: ALLOW_ASR_EXECUTION,
      allow_model_download: ALLOW_MODEL_DOWNLOAD,
      allow_external_api_calls: ALLOW_EXTERNAL_API_CALLS,
      allow_shell_execution: ALLOW_SHELL_EXECUTION,
      allow_audio_mutation: ALLOW_AUDIO_MUTATION,
      allow_model_mutation: ALLOW_MODEL_MUTATION
    },
    model_readiness: {
      model_directory: MODEL_DIRECTORY,
      models_discovered: discoveredModels,
      readiness_status: discoveredModels.length > 0 && !hasFailedModels && !hasIncompleteModels ? 'dry_run_ready' : 'blocked'
    },
    audio_inputs: {
      total_inspected: audioFiles.length,
      eligible_count: eligibleAudio.length,
      rejected_count: rejectedAudio.length,
      files: audioFiles
    },
    simulated_routes: simulatedRoutes,
    overall_summary: {
      readiness_score: readinessScore,
      gate_status: gateStatus,
      blockers: blockers
    }
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, manifestFileOutName),
    JSON.stringify(manifestData, null, 2),
    'utf-8'
  );

  console.log("=========================================");
  console.log(`🏁 OFFLINE ASR DRY-RUN READINESS GATE REPORT`);
  console.log(`Date: ${currentDate}`);
  console.log(`Gate Status: ${gateStatus.toUpperCase()}`);
  console.log(`Readiness Score: ${readinessScore}/100`);
  console.log(`Models Discovered: ${discoveredModels.length}`);
  console.log(`Eligible Audio: ${eligibleAudio.length}`);
  console.log(`Routes Generated: ${simulatedRoutes.length}`);
  console.log("=========================================");

  if (gateStatus === 'blocked') {
    console.error("❌ Gate Sealed: Outstanding blockers exist. Fail-closed policy enforced.");
    await announceCompletion(`Offline ASR Dry-Run complete. Status: BLOCKED. Score: ${readinessScore}.`, String(readinessScore));
  } else {
    console.log("✅ Gate Sealed: Dry-run check satisfied. Ready for transition switch.");
    await announceCompletion(`Offline ASR Dry-Run complete. Status: DRY_RUN_READY. Score: ${readinessScore}.`, String(readinessScore));
  }
}

runDryRunValidator().catch(async (err) => {
  console.error(`❌ Dry-run validator exception: ${(err as Error).message}`);
  await announceCompletion("Offline ASR Dry-Run execution crashed.", "0");
  process.exit(1);
});
