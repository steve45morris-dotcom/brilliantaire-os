import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  APPROVED_AUDIO_INPUT_DIRECTORIES,
  ALLOWED_AUDIO_EXTENSIONS,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  CHECKSUM_VALIDATION_MANIFEST_DIR
} from '../config/asr-audio-input-staging-validation-gate.js';
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

interface InspectedAudio {
  file_id: string;
  filename: string;
  local_path: string;
  extension: string;
  size_bytes: number;
  modified_time: string;
  directory_source: string;
  eligibility_status: 'eligible' | 'rejected';
  rejection_reason: string | null;
  risk_flags: string;
  route_preview_status: 'blocked_for_model_validation' | 'ready_preview';
}

interface SimulatedRoute {
  route_id: string;
  file_id: string;
  audio_file: string;
  model_trust_status: 'blocked' | 'trusted';
  route_status: 'blocked_for_model_validation' | 'ready_preview';
  asr_called: false;
  transcription_generated: false;
  external_service_called: false;
  download_called: false;
  next_action: string;
}

async function runStagingValidationGate() {
  console.log("🚦 Starting ASR Audio Input Staging Validation Gate (Phase 11Z-D)...");
  await announcePhrase("Knight standing by. Validating offline audio staging parameters.");
  await announceIntent("Running ASR audio input staging validation gate.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // 1. Read model trust status from Phase 11Z-C manifest
  let modelTrustStatus: 'blocked' | 'trusted' = 'blocked';
  const manifestPath = path.join(CHECKSUM_VALIDATION_MANIFEST_DIR, `asr_checksum_validation_manifest_${dateStr}.json`);
  
  if (fs.existsSync(manifestPath)) {
    try {
      const manifestRaw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const trustVal = manifestRaw?.checks_metrics?.final_model_trust_status;
      if (trustVal === 'dry_run_ready') {
        modelTrustStatus = 'trusted';
      }
    } catch (e) {
      console.warn(`⚠️ Error reading Phase 11Z-C validation manifest: ${(e as Error).message}`);
    }
  } else {
    console.log(`ℹ️ Phase 11Z-C validation manifest for ${dateStr} not found. Model trust defaults to blocked.`);
  }

  const inspectedAudios: InspectedAudio[] = [];
  let fileCounter = 1;

  // 2. Scan approved directories
  for (const dir of APPROVED_AUDIO_INPUT_DIRECTORIES) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      continue;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
      // Ignore system assets silently
      if (file === '.DS_Store' || file === '.gitkeep' || file === 'README.md') continue;

      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (!stat.isFile()) continue;

      const file_id = `audio_${String(fileCounter++).padStart(3, '0')}`;
      const ext = path.extname(file).toLowerCase();
      
      let isEligible = true;
      const reasons: string[] = [];
      const risks: string[] = [];

      // Check format
      const isFormatSupported = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
      if (!isFormatSupported) {
        isEligible = false;
        reasons.push(`Unsupported file extension: ${ext}`);
      }

      // Check size
      if (stat.size === 0) {
        isEligible = false;
        reasons.push("File is empty (0 bytes)");
      }

      // Check path boundary
      const resolvedPath = path.resolve(filePath);
      if (!resolvedPath.startsWith(REPO_ROOT)) {
        isEligible = false;
        reasons.push("File path lies outside approved project root boundary.");
        risks.push("OUTSIDE_BOUNDARY_ACCESS_ATTEMPT");
      }

      // Check directory source is approved
      const isDirApproved = APPROVED_AUDIO_INPUT_DIRECTORIES.some(approvedDir => {
        return resolvedPath.startsWith(path.resolve(approvedDir));
      });
      if (!isDirApproved) {
        isEligible = false;
        reasons.push("File lies outside approved audio staging directories.");
        risks.push("UNAPPROVED_STAGING_LOCATION");
      }

      // Check filename safety: traversal patterns
      const hasTraversal = file.includes('..') || file.includes('/') || file.includes('\\');
      if (hasTraversal) {
        isEligible = false;
        reasons.push("Filename contains unsafe directory traversal markers.");
        risks.push("PATH_TRAVERSAL_SUSPICIOUS");
      }

      // Check filename safety: suspicious executable markers
      const executableExtensions = ['.sh', '.bat', '.cmd', '.exe', '.py', '.js', '.msi', '.com'];
      const hasSuspiciousMarkers = executableExtensions.some(execExt => {
        // checks if filename has double extensions or contains executable flags
        return file.toLowerCase().includes(execExt);
      });
      if (hasSuspiciousMarkers) {
        isEligible = false;
        reasons.push("Filename contains suspicious executable extensions or flags.");
        risks.push("SUSPICIOUS_EXECUTABLE_MARKER");
      }

      // Check readability
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch (err) {
        isEligible = false;
        reasons.push("File is not readable by process.");
        risks.push("READ_ACCESS_DENIED");
      }

      const risk_flags = risks.length > 0 ? risks.join(' | ') : 'None';
      const route_preview_status = modelTrustStatus === 'trusted' ? 'ready_preview' : 'blocked_for_model_validation';

      inspectedAudios.push({
        file_id,
        filename: file,
        local_path: path.relative(REPO_ROOT, filePath),
        extension: ext,
        size_bytes: stat.size,
        modified_time: stat.mtime.toISOString(),
        directory_source: path.relative(REPO_ROOT, dir),
        eligibility_status: isEligible ? 'eligible' : 'rejected',
        rejection_reason: isEligible ? null : reasons.join(', '),
        risk_flags,
        route_preview_status
      });
    }
  }

  const eligibleAudios = inspectedAudios.filter(a => a.eligibility_status === 'eligible');
  const rejectedAudios = inspectedAudios.filter(a => a.eligibility_status === 'rejected');

  // 3. Generate Simulated Routes preview
  const routes: SimulatedRoute[] = [];
  let routeCounter = 1;

  for (const audio of eligibleAudios) {
    const route_id = `route_preview_${String(routeCounter++).padStart(3, '0')}`;
    const route_status = modelTrustStatus === 'trusted' ? 'ready_preview' : 'blocked_for_model_validation';
    const next_action = modelTrustStatus === 'trusted' 
      ? 'Awaiting manual join gate and human transcription release confirmation.' 
      : 'Model validation gate (Phase 11Z-C) must pass to unblock route readiness.';

    routes.push({
      route_id,
      file_id: audio.file_id,
      audio_file: audio.filename,
      model_trust_status: modelTrustStatus,
      route_status,
      asr_called: false,
      transcription_generated: false,
      external_service_called: false,
      download_called: false,
      next_action
    });
  }

  // Determine overall staging gate state
  let overallState: 'blocked' | 'dry_run_ready' = 'dry_run_ready';
  if (inspectedAudios.length === 0) {
    overallState = 'blocked'; // Fail closed if no inputs staged
  } else if (rejectedAudios.length > 0) {
    overallState = 'blocked'; // Fail closed if any rejected files are present in approved folders
  }

  // 4. Template replacement compilation
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
  // a) file validation
  let audioInvTable = `| File ID | Filename | Source Dir | Size (Bytes) | Extension | Status |\n`;
  audioInvTable += `|---|---|---|---|---|---|\n`;
  if (inspectedAudios.length > 0) {
    inspectedAudios.forEach(a => {
      audioInvTable += `| ${a.file_id} | ${a.filename} | \`${a.directory_source}\` | ${a.size_bytes} | \`${a.extension}\` | \`${a.eligibility_status}\` |\n`;
    });
  } else {
    audioInvTable += `| *No audio files found in approved folders* | - | - | - | - | - |\n`;
  }
  const fileValMd = loadAndReplaceTemplate('asr-audio-file-validation-template.md', {
    DATE: dateStr,
    AUDIO_INVENTORY_TABLE: audioInvTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_file_validation_${dateStr}.md`), fileValMd);

  // b) Eligible files
  let eligibleTable = `| File ID | Filename | Local Path | Size (Bytes) | Source Note |\n`;
  eligibleTable += `|---|---|---|---|---|\n`;
  if (eligibleAudios.length > 0) {
    eligibleAudios.forEach(a => {
      eligibleTable += `| ${a.file_id} | ${a.filename} | \`${a.local_path}\` | ${a.size_bytes} | Verified eligible staging location |\n`;
    });
  } else {
    eligibleTable += `| *No eligible audio files verified* | - | - | - | - |\n`;
  }
  const eligibleMd = loadAndReplaceTemplate('asr-audio-eligible-template.md', {
    DATE: dateStr,
    ELIGIBLE_FILES_TABLE: eligibleTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_eligible_files_${dateStr}.md`), eligibleMd);

  // c) Rejected files
  let rejectedTable = `| File ID | Filename | Path | Rejection Reason | Risk Flags |\n`;
  rejectedTable += `|---|---|---|---|---|\n`;
  if (rejectedAudios.length > 0) {
    rejectedAudios.forEach(a => {
      rejectedTable += `| ${a.file_id} | ${a.filename} | \`${a.local_path}\` | ${a.rejection_reason} | \`${a.risk_flags}\` |\n`;
    });
  } else {
    rejectedTable += `| *No rejected audio files detected* | - | - | - | - |\n`;
  }
  const rejectedMd = loadAndReplaceTemplate('asr-audio-rejected-template.md', {
    DATE: dateStr,
    REJECTED_FILES_TABLE: rejectedTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_rejected_files_${dateStr}.md`), rejectedMd);

  // d) Route Previews
  let routesTable = `| Route ID | File ID | Audio File | Model Trust | Route Status | Next Action |\n`;
  routesTable += `|---|---|---|---|---|---|\n`;
  if (routes.length > 0) {
    routes.forEach(r => {
      routesTable += `| ${r.route_id} | ${r.file_id} | ${r.audio_file} | \`${r.model_trust_status}\` | \`${r.route_status}\` | ${r.next_action} |\n`;
    });
  } else {
    routesTable += `| *No routes mapped (no eligible audio files verified)* | - | - | - | - | - |\n`;
  }
  const routePreviewMd = loadAndReplaceTemplate('asr-audio-route-preview-template.md', {
    DATE: dateStr,
    ROUTES_TABLE: routesTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_route_preview_${dateStr}.md`), routePreviewMd);

  // e) Risk & Safety review
  const riskMd = loadAndReplaceTemplate('asr-audio-risk-review-template.md', {
    DATE: dateStr,
    SAFETY_STATUS: rejectedAudios.length > 0 ? 'WARNING (Suspicious or invalid files staged)' : 'SECURE (All safety constraints verified compliant)'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_risk_review_${dateStr}.md`), riskMd);

  // f) Next Actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-E: ASR Readiness Join Gate'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // g) Summary Report
  const summaryMd = loadAndReplaceTemplate('asr-audio-summary-template.md', {
    DATE: dateStr,
    FOLDERS_COUNT: String(APPROVED_AUDIO_INPUT_DIRECTORIES.length),
    DISCOVERED_COUNT: String(inspectedAudios.length),
    ELIGIBLE_COUNT: String(eligibleAudios.length),
    REJECTED_COUNT: String(rejectedAudios.length),
    ROUTES_COUNT: String(routes.length),
    MODEL_TRUST_DEPENDENCY_STATUS: modelTrustStatus,
    AUDIO_STAGING_GATE_STATE: overallState
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_summary_${dateStr}.md`), summaryMd);

  // h) Staging Report
  let details = `### Approved Folders Crawl Checklist:\n`;
  APPROVED_AUDIO_INPUT_DIRECTORIES.forEach(dir => {
    details += `* Crawling Approved Dir: \`/${path.relative(REPO_ROOT, dir)}\` -> Initialized & Scanned\n`;
  });
  details += `\n### Execution Checks Summary:\n`;
  details += `* Discovered Files: \`${inspectedAudios.length}\`\n`;
  details += `* Eligible Files: \`${eligibleAudios.length}\`\n`;
  details += `* Rejected Files: \`${rejectedAudios.length}\`\n`;
  details += `* Simulated Routes: \`${routes.length}\`\n`;

  if (rejectedAudios.length > 0) {
    details += `\n⚠️ Warning: Staging gate holds in fail-closed BLOCKED state due to invalid or unapproved files.\n`;
  }
  
  const reportMd = loadAndReplaceTemplate('asr-audio-staging-report-template.md', {
    DATE: dateStr,
    AUDIO_STAGING_GATE_STATE: overallState,
    MODEL_TRUST_DEPENDENCY_STATUS: modelTrustStatus,
    FOLDERS_COUNT: String(APPROVED_AUDIO_INPUT_DIRECTORIES.length),
    DISCOVERED_COUNT: String(inspectedAudios.length),
    STAGING_DETAILS: details.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_staging_report_${dateStr}.md`), reportMd);

  // 5. Generate JSON Staging Manifest Output
  const manifestOut = {
    manifest_version: "1.0",
    audit_date: dateStr,
    gate_configuration: {
      ALLOW_ASR_EXECUTION,
      ALLOW_AUDIO_TRANSCRIPTION,
      ALLOW_EXTERNAL_API_CALLS,
      ALLOW_MODEL_DOWNLOAD
    },
    audio_readiness_metrics: {
      directories_scanned: APPROVED_AUDIO_INPUT_DIRECTORIES.length,
      discovered_files_count: inspectedAudios.length,
      eligible_files_count: eligibleAudios.length,
      rejected_files_count: rejectedAudios.length,
      simulated_routes_count: routes.length,
      model_trust_dependency_status: modelTrustStatus,
      final_audio_staging_gate_state: overallState
    },
    scanned_audio_files: inspectedAudios,
    simulated_routes: routes
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_audio_staging_manifest_${dateStr}.json`),
    JSON.stringify(manifestOut, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR AUDIO STAGING GATE COMPLETE");
  console.log("=========================================");
  console.log(`Summary Report:   outputs/asr_audio_staging/asr_audio_summary_${dateStr}.md`);
  console.log(`Staging Manifest: outputs/asr_audio_staging/asr_audio_staging_manifest_${dateStr}.json`);
  console.log(`Final State:      ${overallState.toUpperCase()}`);
  console.log(`Audio Files:      Discovered ${inspectedAudios.length} (Eligible ${eligibleAudios.length}, Rejected ${rejectedAudios.length})`);
  console.log(`Route Previews:   ${routes.length} mapped (Trust dependency: ${modelTrustStatus.toUpperCase()})`);
  console.log("=========================================");

  await announceCompletion("ASR audio input staging validation gate completed successfully.", "12");
}

runStagingValidationGate().catch((err) => {
  console.error(`❌ Audio validation execution error: ${(err as Error).message}`);
  process.exit(1);
});
