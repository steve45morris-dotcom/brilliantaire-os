import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  CHECKSUM_VALIDATION_MANIFEST_DIR,
  AUDIO_STAGING_MANIFEST_DIR
} from '../config/asr-readiness-join-gate.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Helper: Formatted Date YYYY-MM-DD
function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Interface definitions
interface UnifiedManifest {
  manifest_version: string;
  audit_date: string;
  join_id: string;
  gate_configuration: {
    ALLOW_ASR_EXECUTION: boolean;
    ALLOW_AUDIO_TRANSCRIPTION: boolean;
    ALLOW_EXTERNAL_API_CALLS: boolean;
    ALLOW_MODEL_DOWNLOAD: boolean;
  };
  metrics: {
    model_trust_status: 'blocked' | 'trusted' | 'dry_run_ready';
    model_entries_inspected: number;
    model_files_found: number;
    model_files_missing: number;
    checksum_matches: number;
    checksum_mismatches: number;
    audio_files_discovered: number;
    eligible_audio_files: number;
    rejected_audio_files: number;
    route_previews_mapped: number;
    readiness_status: 'blocked' | 'dry_run_ready';
  };
  blockers: string[];
  simulated_routes: SimulatedRoute[];
  asr_called: false;
  transcription_generated: false;
  external_api_called: false;
  download_called: false;
  next_action: string;
}

interface SimulatedRoute {
  route_id: string;
  audio_file_id: string;
  model_id: string;
  model_trust_status: 'blocked' | 'trusted' | 'dry_run_ready';
  audio_eligibility_status: 'eligible' | 'rejected' | 'none_staged';
  route_status: 'blocked_for_model_validation' | 'blocked_for_audio_staging' | 'blocked_for_model_and_audio' | 'ready_preview';
  blocker_reason: string | null;
  asr_called: false;
  transcription_generated: false;
  external_api_called: false;
  download_called: false;
  next_action: string;
}

// Regex Helpers for parsing markdown summaries
function extractFromMd(content: string, regex: RegExp, defaultValue: string): string {
  const match = content.match(regex);
  return match && match[1] ? match[1].trim() : defaultValue;
}

async function runReadinessJoinGate() {
  console.log("🚦 Starting ASR Readiness Join Gate (Phase 11Z-E)...");
  await announcePhrase("Knight standing by. Joining offline ASR checksum and audio staging parameters.");
  await announceIntent("Running ASR readiness join gate.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // 1. Resolve Checksum Gate Signals
  const modelJsonPath = path.join(CHECKSUM_VALIDATION_MANIFEST_DIR, `asr_checksum_validation_manifest_${dateStr}.json`);
  const modelMdPath = path.join(CHECKSUM_VALIDATION_MANIFEST_DIR, `asr_validation_summary_${dateStr}.md`);

  let modelTrustStatus: 'blocked' | 'trusted' | 'dry_run_ready' = 'blocked';
  let modelEntriesInspected = 0;
  let modelFilesFound = 0;
  let modelFilesMissing = 0;
  let checksumMatches = 0;
  let checksumMismatches = 0;
  let modelSignalSource: 'json' | 'markdown' | 'missing' = 'missing';
  let modelEntriesList: string[] = ['ggml-base.en.bin', 'ggml-tiny.bin']; // Default fallback names

  if (fs.existsSync(modelJsonPath)) {
    try {
      const modelRaw = JSON.parse(fs.readFileSync(modelJsonPath, 'utf-8'));
      const metrics = modelRaw.checks_metrics;
      if (metrics) {
        modelTrustStatus = metrics.final_model_trust_status || 'blocked';
        modelEntriesInspected = Number(metrics.model_entries_inspected || 0);
        modelFilesFound = Number(metrics.model_files_found || 0);
        modelFilesMissing = Number(metrics.model_files_missing || 0);
        checksumMatches = Number(metrics.checksum_matches || 0);
        checksumMismatches = Number(metrics.checksum_mismatches || 0);
        modelSignalSource = 'json';
      }
      if (modelRaw.inspected_entries) {
        modelEntriesList = modelRaw.inspected_entries.map((entry: any) => entry.model_filename);
      }
    } catch (e) {
      console.warn(`⚠️ Warning: Failed to parse model JSON manifest: ${(e as Error).message}`);
    }
  }

  if (modelSignalSource === 'missing' && fs.existsSync(modelMdPath)) {
    try {
      const modelMd = fs.readFileSync(modelMdPath, 'utf-8');
      modelTrustStatus = extractFromMd(modelMd, /\* \*\*Final Model Trust Status:\*\* \`(.*)\`/i, 'blocked') as any;
      modelEntriesInspected = Number(extractFromMd(modelMd, /\* \*\*Inspected Model Entries:\*\* \`(\d+)\`/i, '0'));
      modelFilesFound = Number(extractFromMd(modelMd, /\* \*\*Model Files Discovered:\*\* \`(\d+)\`/i, '0'));
      modelFilesMissing = Number(extractFromMd(modelMd, /\* \*\*Model Files Missing:\*\* \`(\d+)\`/i, '0'));
      checksumMatches = Number(extractFromMd(modelMd, /\* \*\*SHA256 Matches:\*\* \`(\d+)\`/i, '0'));
      checksumMismatches = Number(extractFromMd(modelMd, /\* \*\*SHA256 Mismatches:\*\* \`(\d+)\`/i, '0'));
      modelSignalSource = 'markdown';
    } catch (e) {
      console.warn(`⚠️ Warning: Failed to parse model markdown summary: ${(e as Error).message}`);
    }
  }

  // 2. Resolve Audio Staging Gate Signals
  const audioJsonPath = path.join(AUDIO_STAGING_MANIFEST_DIR, `asr_audio_staging_manifest_${dateStr}.json`);
  const audioMdPath = path.join(AUDIO_STAGING_MANIFEST_DIR, `asr_audio_summary_${dateStr}.md`);

  let directoriesScanned = 0;
  let audioFilesDiscovered = 0;
  let eligibleAudioFiles = 0;
  let rejectedAudioFiles = 0;
  let routePreviewsMapped = 0;
  let audioStagingState = 'blocked';
  let audioSignalSource: 'json' | 'markdown' | 'missing' = 'missing';
  let audioFilesList: { id: string; name: string }[] = [];

  if (fs.existsSync(audioJsonPath)) {
    try {
      const audioRaw = JSON.parse(fs.readFileSync(audioJsonPath, 'utf-8'));
      const metrics = audioRaw.audio_readiness_metrics;
      if (metrics) {
        directoriesScanned = Number(metrics.directories_scanned || 0);
        audioFilesDiscovered = Number(metrics.discovered_files_count || 0);
        eligibleAudioFiles = Number(metrics.eligible_files_count || 0);
        rejectedAudioFiles = Number(metrics.rejected_files_count || 0);
        routePreviewsMapped = Number(metrics.simulated_routes_count || 0);
        audioStagingState = metrics.final_audio_staging_gate_state || 'blocked';
        audioSignalSource = 'json';
      }
      if (audioRaw.scanned_audio_files) {
        audioFilesList = audioRaw.scanned_audio_files
          .filter((file: any) => file.eligibility_status === 'eligible')
          .map((file: any) => ({ id: file.file_id, name: file.filename }));
      }
    } catch (e) {
      console.warn(`⚠️ Warning: Failed to parse audio JSON manifest: ${(e as Error).message}`);
    }
  }

  if (audioSignalSource === 'missing' && fs.existsSync(audioMdPath)) {
    try {
      const audioMd = fs.readFileSync(audioMdPath, 'utf-8');
      directoriesScanned = Number(extractFromMd(audioMd, /\* \*\*Scanned Folders Count:\*\* \`(\d+)\`/i, '0'));
      audioFilesDiscovered = Number(extractFromMd(audioMd, /\* \*\*Audio Files Discovered:\*\* \`(\d+)\`/i, '0'));
      eligibleAudioFiles = Number(extractFromMd(audioMd, /\* \*\*Eligible Audio Files:\*\* \`(\d+)\`/i, '0'));
      rejectedAudioFiles = Number(extractFromMd(audioMd, /\* \*\*Rejected Audio Files:\*\* \`(\d+)\`/i, '0'));
      routePreviewsMapped = Number(extractFromMd(audioMd, /\* \*\*Route Previews Generated:\*\* \`(\d+)\`/i, '0'));
      audioStagingState = extractFromMd(audioMd, /\* \*\*Final Staging Gate State:\*\* \`(.*)\`/i, 'blocked');
      audioSignalSource = 'markdown';
    } catch (e) {
      console.warn(`⚠️ Warning: Failed to parse audio markdown summary: ${(e as Error).message}`);
    }
  }

  // 3. Blocker & Fail-Closed Validations
  const blockers: string[] = [];

  if (modelSignalSource === 'missing' && audioSignalSource === 'missing') {
    console.error("❌ Blocker Incident: Both model validation manifest and audio staging manifests are missing.");
    blockers.push("Source manifests from Phase 11Z-C and Phase 11Z-D are missing.");
  } else {
    if (modelSignalSource === 'missing') {
      blockers.push("Model validation checksum manifest (Phase 11Z-C) is missing.");
    }
    if (audioSignalSource === 'missing') {
      blockers.push("Audio staging validation manifest (Phase 11Z-D) is missing.");
    }
  }

  // Evaluate trust status blocker
  if (modelTrustStatus === 'blocked') {
    blockers.push("Model validation trust status is blocked (Whisper model files are missing/untrusted).");
  }

  if (modelFilesMissing > 0) {
    blockers.push(`${modelFilesMissing} required Whisper model files are missing from models/asr/whisper/.`);
  }

  if (checksumMatches === 0) {
    blockers.push("No offline Whisper model checksum matches have been validated.");
  }

  if (checksumMismatches > 0) {
    blockers.push(`${checksumMismatches} model cryptographic checksum mismatches were detected.`);
  }

  if (eligibleAudioFiles === 0) {
    blockers.push("No eligible audio files verified staged in approved folders.");
  }

  if (rejectedAudioFiles > 0) {
    blockers.push(`${rejectedAudioFiles} unapproved/invalid audio files detected in staging folders.`);
  }

  // Evaluate final combined readiness status
  let finalReadiness: 'blocked' | 'dry_run_ready' = 'blocked';
  
  const isModelReady = (modelTrustStatus === 'dry_run_ready' || modelTrustStatus === 'trusted') && 
                       modelFilesMissing === 0 && 
                       checksumMatches > 0 && 
                       checksumMismatches === 0;

  const isAudioReady = eligibleAudioFiles > 0 && rejectedAudioFiles === 0;

  if (isModelReady && isAudioReady && blockers.length === 0) {
    finalReadiness = 'dry_run_ready';
  } else {
    finalReadiness = 'blocked';
  }

  // 4. Generate Route Eligibility Records
  const simulatedRoutes: SimulatedRoute[] = [];
  let routeIndex = 1;

  // Inspected model filenames (e.g. ggml-base.en.bin, ggml-tiny.bin)
  const models = modelEntriesList.length > 0 ? modelEntriesList : ['ggml-base.en.bin', 'ggml-tiny.bin'];

  if (models.length > 0) {
    models.forEach(modelName => {
      const isModelTrusted = (modelTrustStatus === 'dry_run_ready' || modelTrustStatus === 'trusted') && checksumMatches > 0;
      
      if (audioFilesList.length > 0) {
        audioFilesList.forEach(audioFile => {
          const route_id = `route_eligibility_${String(routeIndex++).padStart(3, '0')}`;
          let route_status: SimulatedRoute['route_status'];
          let blocker_reason: string | null = null;
          let next_action = '';

          if (isModelTrusted) {
            route_status = 'ready_preview';
            next_action = 'Awaiting human release confirmation switch for dry-run rendering.';
          } else {
            route_status = 'blocked_for_model_validation';
            blocker_reason = `Whisper model file is blocked or checksum validation failed.`;
            next_action = 'Model validation gate (Phase 11Z-C) must pass to unblock route eligibility.';
          }

          simulatedRoutes.push({
            route_id,
            audio_file_id: audioFile.id,
            model_id: modelName,
            model_trust_status: modelTrustStatus,
            audio_eligibility_status: 'eligible',
            route_status,
            blocker_reason,
            asr_called: false,
            transcription_generated: false,
            external_api_called: false,
            download_called: false,
            next_action
          });
        });
      } else {
        // No audio files eligible
        const route_id = `route_eligibility_${String(routeIndex++).padStart(3, '0')}`;
        let route_status: SimulatedRoute['route_status'];
        let blocker_reason: string | null = null;
        let next_action = '';

        if (!isModelTrusted) {
          route_status = 'blocked_for_model_and_audio';
          blocker_reason = `Whisper models are missing/blocked AND no eligible audio inputs were staged.`;
          next_action = 'Stage valid audio files and place Whisper models in models/asr/whisper/.';
        } else {
          route_status = 'blocked_for_audio_staging';
          blocker_reason = `No eligible audio inputs staged in recordings/, inputAudio/, or outputs/asr_inputs/.`;
          next_action = 'Stage valid audio files to unblock routes.';
        }

        simulatedRoutes.push({
          route_id,
          audio_file_id: 'None',
          model_id: modelName,
          model_trust_status: modelTrustStatus,
          audio_eligibility_status: 'none_staged',
          route_status,
          blocker_reason,
          asr_called: false,
          transcription_generated: false,
          external_api_called: false,
          download_called: false,
          next_action
        });
      }
    });
  }

  // 5. Template replacement compilation
  const loadAndReplaceTemplate = (templateName: string, replacements: Record<string, string>): string => {
    const tempPath = path.join(TEMPLATE_DIRECTORY, templateName);
    if (!fs.existsSync(tempPath)) {
      throw new Error(`Template not found: ${tempPath}`);
    }
    let content = fs.readFileSync(tempPath, 'utf-8');
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return content;
  };

  // Compile individual templates
  // a) Model readiness signal
  const modelSignalMd = loadAndReplaceTemplate('asr-model-readiness-signal-template.md', {
    MODEL_ENTRIES_INSPECTED: String(modelEntriesInspected),
    MODEL_FILES_FOUND: String(modelFilesFound),
    MODEL_FILES_MISSING: String(modelFilesMissing),
    CHECKSUM_MATCHES: String(checksumMatches),
    CHECKSUM_MISMATCHES: String(checksumMismatches),
    MODEL_TRUST_STATUS: modelTrustStatus
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_model_readiness_signal_${dateStr}.md`), modelSignalMd);

  // b) Audio readiness signal
  const audioSignalMd = loadAndReplaceTemplate('asr-audio-readiness-signal-template.md', {
    DIRECTORIES_SCANNED: String(directoriesScanned),
    DISCOVERED_COUNT: String(audioFilesDiscovered),
    ELIGIBLE_COUNT: String(eligibleAudioFiles),
    REJECTED_COUNT: String(rejectedAudioFiles),
    AUDIO_STAGING_GATE_STATE: audioStagingState
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_readiness_signal_${dateStr}.md`), audioSignalMd);

  // c) Route eligibility preview
  let routesTable = `| Route ID | Audio File ID | Model ID | Model Trust | Audio Status | Route Status | Blocker Reason | Next Action |\n`;
  routesTable += `|---|---|---|---|---|---|---|---|\n`;
  simulatedRoutes.forEach(r => {
    routesTable += `| ${r.route_id} | \`${r.audio_file_id}\` | \`${r.model_id}\` | \`${r.model_trust_status}\` | \`${r.audio_eligibility_status}\` | \`${r.route_status}\` | ${r.blocker_reason || 'None'} | ${r.next_action} |\n`;
  });
  const routeEligibilityMd = loadAndReplaceTemplate('asr-route-eligibility-template.md', {
    ROUTES_TABLE: routesTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_route_eligibility_${dateStr}.md`), routeEligibilityMd);

  // d) Blockers checklist
  let blockersChecklist = '';
  if (blockers.length > 0) {
    blockers.forEach((b, idx) => {
      blockersChecklist += `${idx + 1}. [ ] **Blocker Alert:** ${b}\n`;
    });
  } else {
    blockersChecklist = `* No active blockers identified. System is ready to initialize dry-run routes.`;
  }
  const blockersMd = loadAndReplaceTemplate('asr-readiness-blocker-template.md', {
    BLOCKERS_CHECKLIST: blockersChecklist.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_readiness_blockers_${dateStr}.md`), blockersMd);

  // e) Next Actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-F: ASR Manual Asset Intake Checklist'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // f) Summary Report
  const summaryMd = loadAndReplaceTemplate('asr-readiness-summary-template.md', {
    DATE: dateStr,
    JOIN_ID: `asr_readiness_join_${dateStr}`,
    READINESS_STATUS: finalReadiness,
    MODEL_TRUST_STATUS: modelTrustStatus,
    MODEL_ENTRIES_INSPECTED: String(modelEntriesInspected),
    MODEL_FILES_FOUND: String(modelFilesFound),
    MODEL_FILES_MISSING: String(modelFilesMissing),
    CHECKSUM_MATCHES: String(checksumMatches),
    CHECKSUM_MISMATCHES: String(checksumMismatches),
    DISCOVERED_COUNT: String(audioFilesDiscovered),
    ELIGIBLE_COUNT: String(eligibleAudioFiles),
    REJECTED_COUNT: String(rejectedAudioFiles),
    ROUTES_COUNT: String(simulatedRoutes.length),
    ASR_CALLED: 'false',
    TRANSCRIPTION_GENERATED: 'false',
    EXTERNAL_API_CALLED: '0',
    DOWNLOAD_CALLED: '0'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_readiness_summary_${dateStr}.md`), summaryMd);

  // g) Combined Readiness Join Report
  const joinReportMd = loadAndReplaceTemplate('asr-readiness-join-report-template.md', {
    DATE: dateStr,
    JOIN_ID: `asr_readiness_join_${dateStr}`,
    READINESS_STATUS: finalReadiness,
    MODEL_TRUST_STATUS: modelTrustStatus,
    DISCOVERED_COUNT: String(audioFilesDiscovered),
    ELIGIBLE_COUNT: String(eligibleAudioFiles),
    ROUTES_COUNT: String(simulatedRoutes.length),
    MODEL_READINESS_SIGNAL: modelSignalMd.trim(),
    AUDIO_READINESS_SIGNAL: audioSignalMd.trim(),
    ROUTE_ELIGIBILITY_TABLE: routesTable.trim(),
    BLOCKERS_LIST: blockers.length > 0 ? blockers.map(b => `* ⚠️ **Blocker:** ${b}`).join('\n') : '* No blockers identified.',
    ASR_CALLED: 'false',
    TRANSCRIPTION_GENERATED: 'false',
    EXTERNAL_API_CALLED: 'false',
    DOWNLOAD_CALLED: 'false',
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-F: ASR Manual Asset Intake Checklist'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_readiness_join_report_${dateStr}.md`), joinReportMd);

  // 6. Generate JSON Staging Manifest Output
  const manifestOut: UnifiedManifest = {
    manifest_version: "1.0",
    audit_date: dateStr,
    join_id: `asr_readiness_join_${dateStr}`,
    gate_configuration: {
      ALLOW_ASR_EXECUTION,
      ALLOW_AUDIO_TRANSCRIPTION,
      ALLOW_EXTERNAL_API_CALLS,
      ALLOW_MODEL_DOWNLOAD
    },
    metrics: {
      model_trust_status: modelTrustStatus,
      model_entries_inspected: modelEntriesInspected,
      model_files_found: modelFilesFound,
      model_files_missing: modelFilesMissing,
      checksum_matches: checksumMatches,
      checksum_mismatches: checksumMismatches,
      audio_files_discovered: audioFilesDiscovered,
      eligible_audio_files: eligibleAudioFiles,
      rejected_audio_files: rejectedAudioFiles,
      route_previews_mapped: simulatedRoutes.length,
      readiness_status: finalReadiness
    },
    blockers,
    simulated_routes: simulatedRoutes,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: finalReadiness === 'dry_run_ready' 
      ? 'Awaiting manual join gate and human transcription release confirmation.' 
      : 'Address active blocker checklist items. Whisper model files must be manually staged.'
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_readiness_join_manifest_${dateStr}.json`),
    JSON.stringify(manifestOut, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR READINESS JOIN GATE COMPLETE");
  console.log("=========================================");
  console.log(`Summary Report:   outputs/asr_readiness_join/asr_readiness_summary_${dateStr}.md`);
  console.log(`Join Manifest:    outputs/asr_readiness_join/asr_readiness_join_manifest_${dateStr}.json`);
  console.log(`Final State:      ${finalReadiness.toUpperCase()}`);
  console.log(`Inspected Models: ${modelEntriesInspected} (Matches: ${checksumMatches}, Missing: ${modelFilesMissing})`);
  console.log(`Audio Files:      Staged ${eligibleAudioFiles} (Rejected: ${rejectedAudioFiles})`);
  console.log(`Route Previews:   ${simulatedRoutes.length} mapped (Status: ${finalReadiness.toUpperCase()})`);
  console.log("=========================================");

  await announceCompletion("ASR readiness join gate completed successfully.", "12");
}

runReadinessJoinGate().catch((err) => {
  console.error(`❌ Join gate execution error: ${(err as Error).message}`);
  process.exit(1);
});
