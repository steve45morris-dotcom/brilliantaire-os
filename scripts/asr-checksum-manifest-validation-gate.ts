import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  MODEL_DIRECTORY,
  ROOT_MANIFEST_PATH,
  OFFICIAL_MANIFEST_PATH,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY
} from '../config/asr-checksum-manifest-validation-gate.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Formatted Date YYYY-MM-DD
function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Deep Comparison of two JSON objects
function deepEqual(x: any, y: any): boolean {
  if (x === y) return true;
  if (typeof x === "object" && x != null && typeof y === "object" && y != null) {
    if (Object.keys(x).length !== Object.keys(y).length) return false;
    for (const prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!deepEqual(x[prop], y[prop])) return false;
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
}

interface ValidationEntry {
  model_filename: string;
  expected_sha256: string;
  file_size_bytes: number;
  local_exists: boolean;
  local_sha256: string | null;
  local_size_bytes: number | null;
  hash_match: boolean;
  size_match: boolean;
  errors: string[];
}

async function runValidationGate() {
  console.log("🚦 Starting ASR Checksum Manifest Validation Gate (Phase 11Z-C)...");
  await announcePhrase("Knight standing by. Running cryptographic manifest validations.");
  await announceIntent("Running ASR checksum manifest validation gate checks.");

  const dateStr = getFormattedDate();

  // 1. Ensure Output Directory
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  const errors: string[] = [];
  let rootManifest: any = null;
  let officialManifest: any = null;
  let manifestConflictStatus = 'NO_CONFLICT';

  // Read root manifest
  if (!fs.existsSync(ROOT_MANIFEST_PATH)) {
    errors.push(`Root manifest is missing: ${path.basename(ROOT_MANIFEST_PATH)}`);
  } else {
    try {
      rootManifest = JSON.parse(fs.readFileSync(ROOT_MANIFEST_PATH, 'utf-8'));
    } catch (e) {
      errors.push(`Root manifest JSON parse error: ${(e as Error).message}`);
    }
  }

  // Read official manifest
  if (fs.existsSync(OFFICIAL_MANIFEST_PATH)) {
    try {
      officialManifest = JSON.parse(fs.readFileSync(OFFICIAL_MANIFEST_PATH, 'utf-8'));
    } catch (e) {
      errors.push(`Official manifest JSON parse error: ${(e as Error).message}`);
    }
  } else {
    console.log("ℹ️ Official path manifest not found. Proceeding with root manifest only.");
  }

  // Compare if both exist
  if (rootManifest && officialManifest) {
    if (!deepEqual(rootManifest, officialManifest)) {
      manifestConflictStatus = 'CONFLICT_DETECTED';
      errors.push("Conflict detected between root manifest and official path manifest configurations.");
    }
  }

  const manifestToValidate = rootManifest || officialManifest;
  if (!manifestToValidate) {
    errors.push("No valid manifest structure is available for validation check.");
  }

  const validatedEntries: ValidationEntry[] = [];
  let inspectedCount = 0;
  let foundCount = 0;
  let missingCount = 0;
  let matchCount = 0;
  let mismatchCount = 0;
  let sizeMatchCount = 0;
  let sizeMismatchCount = 0;

  if (manifestToValidate && errors.length === 0) {
    for (const [key, entryObj] of Object.entries(manifestToValidate)) {
      inspectedCount++;
      const entry = entryObj as any;
      const entryErrors: string[] = [];

      // Required fields validation
      const requiredFields = [
        'model_id',
        'model_family',
        'model_filename',
        'expected_path',
        'expected_sha256',
        'file_size_bytes',
        'source_note',
        'acquisition_method',
        'download_allowed',
        'asr_execution_allowed',
        'external_api_allowed',
        'trust_status'
      ];

      for (const field of requiredFields) {
        if (entry[field] === undefined) {
          entryErrors.push(`Missing required field: ${field}`);
        }
      }

      if (entryErrors.length > 0) {
        errors.push(`Model "${key}" entry is invalid: ${entryErrors.join(', ')}`);
        continue;
      }

      // Check fields policies
      if (entry.acquisition_method !== 'manual_only') {
        entryErrors.push(`Field policy violation: acquisition_method must equal 'manual_only'. Got '${entry.acquisition_method}'`);
      }
      if (entry.download_allowed !== false) {
        entryErrors.push(`Field policy violation: download_allowed must equal 'false'.`);
      }
      if (entry.asr_execution_allowed !== false) {
        entryErrors.push(`Field policy violation: asr_execution_allowed must equal 'false'.`);
      }
      if (entry.external_api_allowed !== false) {
        entryErrors.push(`Field policy violation: external_api_allowed must equal 'false'.`);
      }
      if (entry.trust_status !== 'pending_manual_verification' && entry.trust_status !== 'blocked') {
        entryErrors.push(`Field policy violation: trust_status must begin as 'pending_manual_verification' or 'blocked'. Got '${entry.trust_status}'`);
      }

      const expectedPathNormal = path.normalize(entry.expected_path);
      const isExpectedPathInsideWhisper = expectedPathNormal.replace(/\\/g, '/').includes('models/asr/whisper/');
      if (!isExpectedPathInsideWhisper) {
        entryErrors.push(`Field policy violation: expected_path must remain inside models/asr/whisper/. Got '${entry.expected_path}'`);
      }

      const isHexSha256 = /^[a-fA-F0-9]{64}$/.test(entry.expected_sha256);
      if (!isHexSha256) {
        entryErrors.push(`Field policy violation: expected_sha256 is not a valid SHA256 hex string.`);
      }

      if (typeof entry.file_size_bytes !== 'number' || entry.file_size_bytes <= 0) {
        entryErrors.push(`Field policy violation: file_size_bytes must be a positive number.`);
      }

      if (entryErrors.length > 0) {
        errors.push(`Model "${key}" policies failed: ${entryErrors.join(' | ')}`);
        continue;
      }

      // File validations
      const filePath = path.join(MODEL_DIRECTORY, entry.model_filename);
      const exists = fs.existsSync(filePath);

      let localSha256: string | null = null;
      let localSize: number | null = null;
      let hashMatch = false;
      let sizeMatch = false;

      if (exists) {
        foundCount++;
        const stat = fs.statSync(filePath);
        localSize = stat.size;
        localSha256 = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
        
        hashMatch = localSha256 === entry.expected_sha256;
        sizeMatch = localSize === entry.file_size_bytes;

        if (hashMatch) matchCount++;
        else {
          mismatchCount++;
          entryErrors.push("SHA256 hash mismatch.");
        }

        if (sizeMatch) sizeMatchCount++;
        else {
          sizeMismatchCount++;
          entryErrors.push(`File size mismatch. Expected ${entry.file_size_bytes} but got ${localSize} bytes.`);
        }
      } else {
        missingCount++;
        entryErrors.push("Model file does not exist locally.");
      }

      validatedEntries.push({
        model_filename: entry.model_filename,
        expected_sha256: entry.expected_sha256,
        file_size_bytes: entry.file_size_bytes,
        local_exists: exists,
        local_sha256: localSha256,
        local_size_bytes: localSize,
        hash_match: hashMatch,
        size_match: sizeMatch,
        errors: entryErrors
      });

      if (entryErrors.length > 0) {
        errors.push(`Model verification failed for ${entry.model_filename}: ${entryErrors.join(', ')}`);
      }
    }
  }

  // Final Gate Trust Determination (Fail closed if errors or mismatch or missing files)
  const isManifestValid = errors.length === 0;
  let finalModelTrustStatus: 'blocked' | 'dry_run_ready' = 'blocked';

  if (isManifestValid && inspectedCount > 0 && missingCount === 0 && mismatchCount === 0 && sizeMismatchCount === 0) {
    finalModelTrustStatus = 'dry_run_ready';
  } else {
    finalModelTrustStatus = 'blocked';
  }

  // 4. Load and replacement templates helper
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
  // a) model file validation
  let modelInvTable = `| Model Filename | Local Existence | Expected Path | Expected Size (Bytes) |\n`;
  modelInvTable += `|---|---|---|---|\n`;
  if (validatedEntries.length > 0) {
    validatedEntries.forEach(e => {
      modelInvTable += `| ${e.model_filename} | \`${e.local_exists ? 'Found' : 'Missing'}\` | \`models/asr/whisper/${e.model_filename}\` | ${e.file_size_bytes} |\n`;
    });
  } else {
    modelInvTable += `| *No models declared in manifest* | - | - | - |\n`;
  }
  const fileValMd = loadAndReplaceTemplate('asr-model-file-validation-template.md', {
    DATE: dateStr,
    MODEL_INVENTORY_TABLE: modelInvTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_model_file_validation_${dateStr}.md`), fileValMd);

  // b) Checksum matches
  let matchesTable = `| Model Filename | Expected Hash | Local Hash | Match Status |\n`;
  matchesTable += `|---|---|---|---|\n`;
  const matchingEntries = validatedEntries.filter(e => e.hash_match);
  if (matchingEntries.length > 0) {
    matchingEntries.forEach(e => {
      matchesTable += `| ${e.model_filename} | \`${e.expected_sha256}\` | \`${e.local_sha256}\` | Match |\n`;
    });
  } else {
    matchesTable += `| *No hash matches verified* | - | - | - |\n`;
  }
  const matchMd = loadAndReplaceTemplate('asr-checksum-match-template.md', {
    DATE: dateStr,
    MATCHES_TABLE: matchesTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_checksum_matches_${dateStr}.md`), matchMd);

  // c) Checksum mismatches
  let mismatchesTable = `| Model Filename | Expected Hash | Local Hash | Mismatch Error |\n`;
  mismatchesTable += `|---|---|---|---|\n`;
  const mismatchingEntries = validatedEntries.filter(e => e.local_exists && !e.hash_match);
  if (mismatchingEntries.length > 0) {
    mismatchingEntries.forEach(e => {
      mismatchesTable += `| ${e.model_filename} | \`${e.expected_sha256}\` | \`${e.local_sha256}\` | Checksum Mismatch |\n`;
    });
  } else {
    mismatchesTable += `| *No hash mismatches detected* | - | - | - |\n`;
  }
  const mismatchMd = loadAndReplaceTemplate('asr-checksum-mismatch-template.md', {
    DATE: dateStr,
    MISMATCHES_TABLE: mismatchesTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_checksum_mismatches_${dateStr}.md`), mismatchMd);

  // d) Manifest errors
  let errorsList = '';
  if (errors.length > 0) {
    errors.forEach(e => {
      errorsList += `* 🚫 ${e}\n`;
    });
  } else {
    errorsList = `* No validation errors detected. Manifest layout compliant.`;
  }
  const errorsMd = loadAndReplaceTemplate('asr-manifest-error-template.md', {
    DATE: dateStr,
    ERRORS_LIST: errorsList.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_manifest_errors_${dateStr}.md`), errorsMd);

  // e) Next actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-D: ASR Audio Input Staging Validation Gate'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // f) Validation summary
  const summaryMd = loadAndReplaceTemplate('asr-validation-summary-template.md', {
    DATE: dateStr,
    CONFLICT_STATUS: manifestConflictStatus,
    INSPECTED_COUNT: String(inspectedCount),
    FOUND_COUNT: String(foundCount),
    MISSING_COUNT: String(missingCount),
    MATCH_COUNT: String(matchCount),
    MISMATCH_COUNT: String(mismatchCount),
    SIZE_MATCH_COUNT: String(sizeMatchCount),
    SIZE_MISMATCH_COUNT: String(sizeMismatchCount),
    MODEL_TRUST_STATUS: finalModelTrustStatus
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_validation_summary_${dateStr}.md`), summaryMd);

  // g) Validation Report
  let checksDetails = `### Validation Results detail:\n`;
  checksDetails += `* Manifest Conflict Status: \`${manifestConflictStatus}\`\n`;
  checksDetails += `* Manifest Validation State: \`${isManifestValid ? 'PASS' : 'FAIL_CLOSED'}\`\n`;
  if (errors.length > 0) {
    checksDetails += `\n#### Gate Errors Encountered:\n`;
    errors.forEach(e => {
      checksDetails += `* ❌ ${e}\n`;
    });
  }
  const reportMd = loadAndReplaceTemplate('asr-checksum-validation-report-template.md', {
    DATE: dateStr,
    MODEL_TRUST_STATUS: finalModelTrustStatus,
    CONFLICT_STATUS: manifestConflictStatus,
    CHECKS_DETAILS: checksDetails.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_checksum_validation_report_${dateStr}.md`), reportMd);

  // 5. Generate JSON Validation Manifest Output
  const manifestOut = {
    manifest_version: "1.0",
    audit_date: dateStr,
    gate_configuration: {
      ALLOW_ASR_EXECUTION,
      ALLOW_AUDIO_TRANSCRIPTION,
      ALLOW_EXTERNAL_API_CALLS,
      ALLOW_MODEL_DOWNLOAD
    },
    checks_metrics: {
      manifest_conflict_status: manifestConflictStatus,
      manifest_valid: isManifestValid,
      model_entries_inspected: inspectedCount,
      model_files_found: foundCount,
      model_files_missing: missingCount,
      checksum_matches: matchCount,
      checksum_mismatches: mismatchCount,
      size_matches: sizeMatchCount,
      size_mismatches: sizeMismatchCount,
      final_model_trust_status: finalModelTrustStatus
    },
    inspected_entries: validatedEntries,
    gate_errors: errors
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_checksum_validation_manifest_${dateStr}.json`),
    JSON.stringify(manifestOut, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR CHECKSUM VALIDATION COMPLETE");
  console.log("=========================================");
  console.log(`Summary Report:   outputs/asr_validation/asr_validation_summary_${dateStr}.md`);
  console.log(`Manifest JSON:    outputs/asr_validation/asr_checksum_validation_manifest_${dateStr}.json`);
  console.log(`Final Trust:      ${finalModelTrustStatus.toUpperCase()}`);
  console.log(`Model Entries:    Inspected ${inspectedCount} (Found ${foundCount}, Missing ${missingCount})`);
  console.log(`Checksum Matches: ${matchCount} matches (Mismatches: ${mismatchCount})`);
  console.log("=========================================");

  await announceCompletion("ASR checksum manifest validation gate completed successfully.", "12");
}

runValidationGate().catch((err) => {
  console.error(`❌ Validation execution error: ${(err as Error).message}`);
  process.exit(1);
});
