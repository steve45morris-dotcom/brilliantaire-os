import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { REPO_ROOT } from '../config/paths.js';
import { announceIntent, announceCompletion } from './vnp.js';
import { probeMedia, ratioMatches, durationMatches } from './lib/media-probe.js';
import {
  applySignoff,
  parseSignoffArgs,
  pendingReviews,
  SIGNOFF_USAGE,
  type Review,
  type SignoffRecord
} from './lib/asset-signoff.js';
import { classifyRecovery, planRecovery, type RecoveryParent } from './lib/recovery-plan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const identityManifestPath = path.join(REPO_ROOT, 'config', 'icyflamze-identity-manifest.json');
const prodManifestPath = path.join(REPO_ROOT, 'config', 'episode_1_production_manifest.json');

const intakeOutDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'episode_1', 'render_intake');
const incomingDir = path.join(intakeOutDir, 'incoming');
const approvedDir = path.join(intakeOutDir, 'approved');
const rejectedDir = path.join(intakeOutDir, 'rejected');
const reportsDir = path.join(intakeOutDir, 'reports');
const checklistsDir = path.join(intakeOutDir, 'checklists');
const stagingDir = path.join(intakeOutDir, 'obsidian_staging');
const logsDir = path.join(intakeOutDir, 'logs');
const provenancePath = path.join(intakeOutDir, 'provenance_manifest.json');
const eventLogPath = path.join(intakeOutDir, 'provenance_events.jsonl');
const recoveryPlanPath = path.join(reportsDir, 'episode_1_recovery_plan.md');
const jobsPath = path.join(intakeOutDir, 'recovery_jobs.json');

// Load manifests safely
function loadJson(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Critical manifest file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

const identityManifest = loadJson(identityManifestPath);
const prodManifest = loadJson(prodManifestPath);

// Incoming sub-folders mapping
const incomingFolders: Record<string, string> = {
  image: path.join(incomingDir, 'images'),
  video: path.join(incomingDir, 'videos'),
  audio: path.join(incomingDir, 'audio'),
  cover_art: path.join(incomingDir, 'cover_art'),
  caption: path.join(incomingDir, 'captions'),
  assembly: path.join(incomingDir, 'edit_projects')
};

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureDirectories() {
  fs.mkdirSync(intakeOutDir, { recursive: true });
  fs.mkdirSync(incomingDir, { recursive: true });
  for (const dir of Object.values(incomingFolders)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.mkdirSync(approvedDir, { recursive: true });
  fs.mkdirSync(rejectedDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(checklistsDir, { recursive: true });
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });
}

function writeLog(message: string) {
  ensureDirectories();
  const dateStr = getFormattedDate();
  const logFile = path.join(logsDir, `v2_exec_log_${dateStr}.txt`);
  const logEntry = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
}

// Track state modifications dynamically per session loop
let mutationsDetectedThisRun = 0;
let recoveredThisRunCount = 0;

function appendEvent(event: {
  eventType: 'ASSET_DISCOVERED' | 'VALIDATION_PASSED' | 'APPROVED' | 'MUTATION_DETECTED' | 'STATE_INVALIDATED' | 'REVALIDATED' | 'REJECTED' | 'STALE_INVALIDATED' | 'SIGNED_OFF';
  slotId: string;
  version: number;
  fromState: string;
  toState: string;
  reason: string;
  details?: string;
}) {
  ensureDirectories();
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event
  }) + '\n';
  fs.appendFileSync(eventLogPath, logEntry, 'utf-8');
}

function getStagedFiles(category: string): string[] {
  const dir = incomingFolders[category];
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => !f.startsWith('.'));
}

// Lifecycle State definition
type LifecycleState = 
  | 'STAGED'
  | 'VALIDATED'
  | 'IDENTITY_VERIFIED'
  | 'TECHNICALLY_VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'STALE';

interface ProvenanceEntry {
  sha256: string;
  slotId: string;
  version: number;
  source: string;
  generator: string;
  createdTimestamp: string;
  validationTimestamp: string;
  approvalState: LifecycleState;
  parentAsset: string;
  identityScore: 'PASS' | 'FAIL' | 'N/A' | 'PENDING';
  technicalScore: 'PASS' | 'FAIL' | 'PENDING';
  creativeScore: 'PASS' | 'FAIL' | 'PENDING';
  parentLineage: Record<string, number>; // Maps parentAssetId -> parentVersion
  // Human reviews recorded by `signoff`, each bound to the sha256 it was given for.
  // Absent until someone signs off; dropped when the file changes (the mutation
  // path rebuilds the entry without it).
  signoffs?: Partial<Record<Review, SignoffRecord>>;
}

interface ProvenanceDb {
  assets: Record<string, ProvenanceEntry>;
}

function loadProvenanceDb(): ProvenanceDb {
  if (fs.existsSync(provenancePath)) {
    try {
      return JSON.parse(fs.readFileSync(provenancePath, 'utf-8'));
    } catch (e) {
      console.warn(`[!] Failed to parse provenance manifest database, rebuilding...`);
    }
  }
  return { assets: {} };
}

function saveProvenanceDb(db: ProvenanceDb) {
  fs.writeFileSync(provenancePath, JSON.stringify(db, null, 2), 'utf-8');
}

function calculateSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Recovery Job Queue Schemas
type JobStatus = 'AWAITING_APPROVAL' | 'APPROVED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

interface RecoveryJob {
  jobId: string;
  slotId: string;
  reason: string;
  parents: Record<string, number>;
  action: 'REGENERATE';
  status: JobStatus;
  createdTimestamp: string;
  reconciledTimestamp?: string;
}

interface JobsDb {
  jobs: RecoveryJob[];
}

function loadJobsDb(): JobsDb {
  if (fs.existsSync(jobsPath)) {
    try {
      return JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
    } catch (e) {
      console.warn(`[!] Failed to parse recovery jobs database, rebuilding...`);
    }
  }
  return { jobs: [] };
}

function saveJobsDb(db: JobsDb) {
  fs.writeFileSync(jobsPath, JSON.stringify(db, null, 2), 'utf-8');
}

interface AssetVerificationResult {
  assetId: string;
  fileName: string;
  category: string;
  state: LifecycleState;
  checks: {
    structural: boolean;
    technical: boolean;
    identity: boolean;
    creative: boolean;
  };
  details: string[];
}

// Inspect content of mock/text files to perform simulated semantic validation
function performSemanticValidation(
  file: string, 
  category: string, 
  expectedId: string, 
  desc: string, 
  expectedDim: string,
  db: ProvenanceDb,
  // Re-probe even when the bytes match the record. Only recovery-run passes this,
  // for a STALE asset made from the current parents (see lib/recovery-plan.ts).
  forceReprobe = false
): AssetVerificationResult {
  const folder = incomingFolders[category];
  const filePath = path.join(folder, file);
  const ext = path.extname(file).toLowerCase();
  
  const result: AssetVerificationResult = {
    assetId: expectedId,
    fileName: file,
    category,
    state: 'STAGED',
    checks: { structural: false, technical: false, identity: false, creative: false },
    details: []
  };

  const currentHash = calculateSha256(filePath);
  const existingEntry = db.assets[expectedId];

  // If file hasn't changed, preserve existing registry parameters
  if (!forceReprobe && existingEntry && existingEntry.sha256 === currentHash) {
    result.state = existingEntry.approvalState;
    result.checks.structural = existingEntry.approvalState !== 'REJECTED';
    result.checks.technical = existingEntry.technicalScore === 'PASS';
    result.checks.identity = existingEntry.identityScore === 'PASS';
    result.checks.creative = existingEntry.creativeScore === 'PASS';
    result.details.push(`✓ Cached validation matches existing SHA-256 integrity signatures.`);
    db.assets[expectedId].validationTimestamp = new Date().toISOString();
    return result;
  }

  // 1. Structural Check
  const spec = prodManifest.assets.find((a: any) => a.id === expectedId);
  if (!spec) {
    result.details.push(`[!] Unrecognized asset ID match in manifest for file: ${file}`);
    result.state = 'REJECTED';
    return result;
  }

  const isValidExt = spec.allowed_extensions.includes(ext);
  const isValidPrefix = file.startsWith(spec.prefix);
  let structuralPassed = isValidExt && isValidPrefix;

  if (structuralPassed) {
    result.checks.structural = true;
    result.state = 'VALIDATED';
  } else {
    result.details.push(`✗ Structural failed: prefix must be ${spec.prefix}, allowed extensions: ${spec.allowed_extensions.join(', ')}`);
  }

  // Provenance attribution comes from the manifest, not from the file. Generated media
  // carries no trustworthy self-description, and scraping one out of file text was how
  // mock placeholders used to author their own provenance.
  const fileSource = spec.tool;
  const fileGenerator = 'unattributed';

  // Captions and edit projects are documents, not media — the bar is a non-empty file.
  const MEDIA_CATEGORIES = ['image', 'video', 'audio', 'cover_art'];
  const isMedia = MEDIA_CATEGORIES.includes(spec.category);

  // 2. Technical Validation — real container probing (PNG IHDR / JPEG SOF / ffprobe).
  // A text placeholder decodes as nothing and fails here, which is the point.
  let technicalPassed = true;
  let technicalScore: 'PASS' | 'FAIL' | 'PENDING' = 'PASS';
  // A missing toolchain is not an asset defect — hold, do not reject.
  let technicalUnavailable = false;

  if (!structuralPassed) {
    technicalPassed = false;
    technicalScore = 'FAIL';
  } else if (!isMedia) {
    const bytes = fs.statSync(filePath).size;
    if (bytes > 0) {
      result.checks.technical = true;
      result.state = 'TECHNICALLY_VERIFIED';
      result.details.push(`✓ Document present (${bytes} bytes) — no media probe applies to ${spec.category}`);
    } else {
      technicalPassed = false;
      technicalScore = 'FAIL';
      result.details.push(`✗ Technical check failed: file is empty`);
    }
  } else {
    const probe = probeMedia(filePath);

    if (!probe.ok) {
      technicalPassed = false;
      technicalUnavailable = probe.reason === 'PROBE_UNAVAILABLE';
      technicalScore = technicalUnavailable ? 'PENDING' : 'FAIL';
      result.details.push(
        probe.reason === 'PROBE_UNAVAILABLE'
          ? `⏸ Technical check unavailable: ${probe.detail} — install ffmpeg to verify ${spec.category} assets`
          : `✗ Technical check failed: not decodable media (${probe.reason}) — ${probe.detail}`
      );
    } else {
      const problems: string[] = [];

      if (expectedDim && !ratioMatches(probe.width, probe.height, expectedDim)) {
        problems.push(`aspect ratio expected ${expectedDim}, measured ${probe.width}x${probe.height}`);
      }
      if (typeof spec.duration === 'number' && !durationMatches(probe.durationSec, spec.duration)) {
        problems.push(`duration expected ${spec.duration}s, measured ${probe.durationSec ?? 'none'}s`);
      }

      if (problems.length === 0) {
        result.checks.technical = true;
        result.state = 'TECHNICALLY_VERIFIED';
        result.details.push(`✓ Technical verified via ${probe.via}: ${probe.width}x${probe.height}${probe.durationSec !== null ? `, ${probe.durationSec}s` : ''}`);
      } else {
        technicalPassed = false;
        technicalScore = 'FAIL';
        result.details.push(`✗ Technical check failed: ${problems.join('; ')}`);
      }
    }
  }

  // 3. Identity Verification — NOT automatable. Comparing a rendered face against
  // icyflamze_reference_MASTER.jpeg requires human judgement; the previous "does the file
  // contain the string 'drift: true'" test passed everything a real generator could produce.
  const requiresIdentity = desc.toLowerCase().includes('founder') || desc.toLowerCase().includes('character') || desc.toLowerCase().includes('eyes');
  const identityPassed = structuralPassed && technicalPassed;
  const identityScore: 'PASS' | 'FAIL' | 'N/A' | 'PENDING' = !identityPassed
    ? 'FAIL'
    : requiresIdentity ? 'PENDING' : 'N/A';

  result.checks.identity = identityPassed && !requiresIdentity;
  if (identityPassed && requiresIdentity) {
    result.details.push(`⏸ Identity review PENDING — compare against ${identityManifest.reference_asset} by hand, then sign off`);
  }

  // 4. Creative Review — also human. Style compliance against the IP Bible visual language
  // cannot be decided by string matching.
  const creativePassed = identityPassed;
  const creativeScore: 'PASS' | 'FAIL' | 'PENDING' = creativePassed ? 'PENDING' : 'FAIL';
  result.checks.creative = false;
  if (creativePassed) {
    result.details.push(`⏸ Creative review PENDING — check against ip_bible/visual_language, then sign off`);
  }

  // Nothing reaches APPROVED automatically any more. TECHNICALLY_VERIFIED is the furthest
  // the pipeline can carry an asset; APPROVED is a human act.

  // Final Overall State resolution. An unverifiable asset (no ffprobe) is held at STAGED
  // for a later run rather than rejected — only a real defect rejects.
  if (technicalUnavailable) {
    result.state = 'STAGED';
  } else if (!structuralPassed || !technicalPassed || !identityPassed || !creativePassed) {
    result.state = 'REJECTED';
  }

  // Lifecycle & Provenance State Transitions
  let finalVer = 1;
  let finalCreated = new Date().toISOString();
  let mutationEventTriggered = false;

  if (existingEntry) {
    if (existingEntry.sha256 !== currentHash) {
      finalVer = existingEntry.version + 1;
      mutationEventTriggered = true;
      mutationsDetectedThisRun++;
      
      const mutationMsg = `[MUTATION DETECTED] Asset ${expectedId} content modified (SHA256 changed). Resetting lifecycle state to STAGED and incrementing version to ${finalVer}.`;
      console.log(`⚠️  ${mutationMsg}`);
      writeLog(mutationMsg);
      
      appendEvent({
        eventType: 'MUTATION_DETECTED',
        slotId: expectedId,
        version: finalVer,
        fromState: existingEntry.approvalState,
        toState: 'STAGED',
        reason: 'FILE_MODIFIED',
        details: `Previous SHA256: ${existingEntry.sha256.slice(0, 16)}, Current SHA256: ${currentHash.slice(0, 16)}`
      });

      appendEvent({
        eventType: 'STATE_INVALIDATED',
        slotId: expectedId,
        version: finalVer,
        fromState: existingEntry.approvalState,
        toState: 'STAGED',
        reason: 'HASH_MISMATCH'
      });

      result.details.push(`⚠️ Mutation detected: SHA256 changed, state reset, version bumped to ${finalVer}`);
    } else {
      finalVer = existingEntry.version;
      finalCreated = existingEntry.createdTimestamp;
    }
  } else {
    appendEvent({
      eventType: 'ASSET_DISCOVERED',
      slotId: expectedId,
      version: finalVer,
      fromState: 'NONE',
      toState: 'STAGED',
      reason: 'NEW_FILE_STAGED'
    });
  }

  // Resolve dependency parent versions
  const parentLineage: Record<string, number> = {};
  for (const depId of spec.dependencies) {
    const parentProv = db.assets[depId];
    parentLineage[depId] = parentProv ? parentProv.version : 0;
  }

  const isApproved = result.state === 'APPROVED';
  const previousState = existingEntry ? existingEntry.approvalState : 'STAGED';

  if (isApproved && (previousState !== 'APPROVED' || mutationEventTriggered)) {
    appendEvent({
      eventType: 'VALIDATION_PASSED',
      slotId: expectedId,
      version: finalVer,
      fromState: 'STAGED',
      toState: 'APPROVED',
      reason: 'SEMANTIC_CHECKS_PASS'
    });
    appendEvent({
      eventType: 'APPROVED',
      slotId: expectedId,
      version: finalVer,
      fromState: 'VALIDATED',
      toState: 'APPROVED',
      reason: 'VALIDATION_PASSED'
    });
  } else if (result.state === 'REJECTED' && previousState !== 'REJECTED') {
    appendEvent({
      eventType: 'REJECTED',
      slotId: expectedId,
      version: finalVer,
      fromState: previousState,
      toState: 'REJECTED',
      reason: 'VALIDATION_FAILED',
      details: result.details.join('; ')
    });
  }

  db.assets[expectedId] = {
    sha256: currentHash,
    slotId: expectedId,
    version: finalVer,
    source: fileSource,
    generator: fileGenerator,
    createdTimestamp: finalCreated,
    validationTimestamp: new Date().toISOString(),
    approvalState: result.state,
    parentAsset: requiresIdentity ? 'official_icyflamze_portrait' : 'N/A',
    identityScore,
    technicalScore,
    creativeScore,
    parentLineage
  };

  return result;
}


// Check and propagate downstream dependency invalidation
function propagateDownstreamInvalidation(db: ProvenanceDb): { staleCount: number; invalidations: string[] } {
  let staleCount = 0;
  const invalidations: string[] = [];
  let propagated = true;

  while (propagated) {
    propagated = false;

    for (const spec of prodManifest.assets) {
      const prov = db.assets[spec.id];
      if (!prov || prov.approvalState === 'REJECTED' || prov.approvalState === 'STALE') continue;

      for (const parentId of spec.dependencies) {
        const parentProv = db.assets[parentId];
        
        const recordedParentVer = prov.parentLineage[parentId] || 0;
        const currentParentVer = parentProv ? parentProv.version : 0;
        const parentNotReady = !parentProv || parentProv.approvalState !== 'APPROVED';

        if (parentNotReady || currentParentVer > recordedParentVer) {
          const fromState = prov.approvalState;
          prov.approvalState = 'STALE';
          prov.identityScore = 'PENDING';
          prov.technicalScore = 'PENDING';
          prov.creativeScore = 'PENDING';
          staleCount++;
          propagated = true;

          const why = currentParentVer > recordedParentVer
            ? `shifted from version ${recordedParentVer} to ${currentParentVer}`
            : `v${currentParentVer} is not APPROVED yet`;
          const reasonMsg = `[STALE INVALIDATION] Downstream asset ${spec.id} marked STALE because parent ${parentId} ${why}`;
          console.log(`⚠️  ${reasonMsg}`);
          writeLog(reasonMsg);
          invalidations.push(reasonMsg);

          appendEvent({
            eventType: 'STALE_INVALIDATED',
            slotId: spec.id,
            version: prov.version,
            fromState,
            toState: 'STALE',
            reason: 'PARENT_MUTATION',
            details: `Parent ${parentId} ${why}`
          });
          
          appendEvent({
            eventType: 'STATE_INVALIDATED',
            slotId: spec.id,
            version: prov.version,
            fromState,
            toState: 'STALE',
            reason: 'PARENT_MUTATION'
          });

          break;
        }
      }
    }
  }

  return { staleCount, invalidations };
}

// Enqueue jobs for all stale assets
function ensureRecoveryJobs(db: ProvenanceDb, jobsDb: JobsDb) {
  for (const spec of prodManifest.assets) {
    const prov = db.assets[spec.id];
    if (!prov || prov.approvalState !== 'STALE') continue;

    // Resolve current versions of dependencies
    const parentVersions: Record<string, number> = {};
    for (const depId of spec.dependencies) {
      const p = db.assets[depId];
      parentVersions[depId] = p ? p.version : 0;
    }

    const targetJobId = `REC-${spec.id}-${Object.values(parentVersions).join('-')}`;
    const jobExists = jobsDb.jobs.some(j => j.jobId === targetJobId);

    if (!jobExists) {
      const newJob: RecoveryJob = {
        jobId: targetJobId,
        slotId: spec.id,
        reason: 'PARENT_MUTATION',
        parents: parentVersions,
        action: 'REGENERATE',
        status: 'AWAITING_APPROVAL',
        createdTimestamp: new Date().toISOString()
      };
      jobsDb.jobs.push(newJob);
      const enqueueMsg = `[RECOVERY QUEUED] Auto-enqueued recovery job ${targetJobId} for slot ${spec.id} (Awaiting human approval).`;
      console.log(`➕ ${enqueueMsg}`);
      writeLog(enqueueMsg);
    }
  }
}

// 1. scan command
function handleScan(dateStr: string) {
  ensureDirectories();
  console.log(`\n=========================================`);
  console.log(`🎬 ${prodManifest.project_name}: ${prodManifest.season_title}`);
  console.log(`Episode ${prodManifest.episode_number}: "${prodManifest.episode_title}"`);
  console.log(`=========================================`);

  const categoryCounts: Record<string, { total: number; staged: number }> = {
    image: { total: 0, staged: 0 },
    video: { total: 0, staged: 0 },
    audio: { total: 0, staged: 0 },
    cover_art: { total: 0, staged: 0 },
    caption: { total: 0, staged: 0 },
    assembly: { total: 0, staged: 0 }
  };

  for (const asset of prodManifest.assets) {
    if (categoryCounts[asset.category]) {
      categoryCounts[asset.category].total++;
    }
  }

  for (const cat of Object.keys(categoryCounts)) {
    categoryCounts[cat].staged = getStagedFiles(cat).length;
  }

  console.log(`Production Manifest Summary (Timestamps staged):`);
  let totalRequired = 0;
  let totalStaged = 0;
  for (const [cat, metrics] of Object.entries(categoryCounts)) {
    totalRequired += metrics.total;
    totalStaged += metrics.staged;
    console.log(`- ${cat.padEnd(12)}: ${metrics.staged}/${metrics.total} staged`);
  }

  const overallPercent = Math.round((totalStaged / totalRequired) * 100);
  console.log(`-----------------------------------------`);
  console.log(`Production Readiness Score: ${overallPercent}%`);
  console.log(`=========================================\n`);

  writeLog(`Scanned registry. Staged files count: ${totalStaged}/${totalRequired} (${overallPercent}%)`);
}

// Generate recovery plan markdown file
function generateRecoveryPlan(db: ProvenanceDb): string {
  let staleCount = 0;
  for (const prov of Object.values(db.assets)) {
    if (prov.approvalState === 'STALE') staleCount++;
  }

  let planMd = `# Recovery and Reconciliation Plan\n\n`;
  planMd += `### Status Metadata:\n`;
  planMd += `- **Generated:** ${new Date().toISOString()}\n`;
  planMd += `- **Integrity Health:** ${staleCount === 0 ? 'CLEAN' : 'STALE_LINKS_DETECTED'}\n`;
  planMd += `- **Estimated Recovery Scope:** ${staleCount} asset rebuilds\n\n`;

  if (staleCount === 0) {
    planMd += `✅ **System integrity is currently CLEAN. No recovery actions are required.**\n`;
    fs.writeFileSync(recoveryPlanPath, planMd, 'utf-8');
    return planMd;
  }

  planMd += `## ⚠️ Integrity Fault Analysis\n\n`;
  planMd += `The following downstream assets are currently flagged **STALE** due to parent mutations:\n\n`;

  const actions: string[] = [];
  
  for (const spec of prodManifest.assets) {
    const prov = db.assets[spec.id];
    if (prov && prov.approvalState === 'STALE') {
      planMd += `### Slot: **${spec.id}** (${spec.role})\n`;
      planMd += `- **Previous lineage compiled on:**\n`;
      
      const parentList: string[] = [];
      for (const parentId of spec.dependencies) {
        const parentProv = db.assets[parentId];
        const recordedParentVer = prov.parentLineage[parentId] || 0;
        const currentParentVer = parentProv ? parentProv.version : 0;
        const outOfDate = currentParentVer > recordedParentVer;

        planMd += `  - Parent **${parentId}**: recorded v${recordedParentVer} ${outOfDate ? `🔴 -> current v${currentParentVer} (MUTATED)` : `🟢`}\n`;
        parentList.push(`${parentId} v${currentParentVer}`);
      }

      const rebuildStep = `Regenerate **${spec.id}** (${spec.role}) using parent dependencies: **${parentList.join(', ')}**`;
      actions.push(rebuildStep);
      
      planMd += `- **Required Action:**\n`;
      planMd += `  1. Re-render/regenerate asset from the updated parent versions.\n`;
      planMd += `  2. Move the old file to \`render_intake/superseded/\` and place the new one in \`${path.relative(intakeOutDir, incomingFolders[spec.category])}/\`.\n`;
      planMd += `  3. Re-run structural, technical, identity, and creative validation checks.\n\n`;
    }
  }

  planMd += `## 🛠️ Step-by-Step Reconciliation Steps\n\n`;
  actions.forEach((act, idx) => {
    planMd += `${idx + 1}. **${act}**\n`;
    planMd += `   - Revalidate structural attributes\n`;
    planMd += `   - Verify face similarity against portrait manifest\n`;
    planMd += `   - Validate creative compliance\n`;
  });

  planMd += `\n**Integrity Target:** CLEAN\n`;

  fs.writeFileSync(recoveryPlanPath, planMd, 'utf-8');
  return planMd;
}

function printConsoleRecoveryPlan(db: ProvenanceDb) {
  let staleCount = 0;
  for (const prov of Object.values(db.assets)) {
    if (prov.approvalState === 'STALE') staleCount++;
  }
  if (staleCount === 0) return;

  console.log(`\n=========================================`);
  console.log(`🛠️  RECOVERY PLAN: RECONCILIATION NEEDED`);
  console.log(`=========================================`);
  
  let actionIdx = 1;
  for (const spec of prodManifest.assets) {
    const prov = db.assets[spec.id];
    if (prov && prov.approvalState === 'STALE') {
      const mutList: string[] = [];
      const parentList: string[] = [];
      for (const parentId of spec.dependencies) {
        const parentProv = db.assets[parentId];
        const recordedParentVer = prov.parentLineage[parentId] || 0;
        const currentParentVer = parentProv ? parentProv.version : 0;
        parentList.push(`${parentId} v${currentParentVer}`);
        if (currentParentVer > recordedParentVer) {
          mutList.push(`${parentId} changed v${recordedParentVer} → v${currentParentVer}`);
        } else if (!parentProv || parentProv.approvalState !== 'APPROVED') {
          mutList.push(`${parentId} v${currentParentVer} not APPROVED yet`);
        }
      }
      
      console.log(`Root Cause:`);
      console.log(`  ${mutList.join(', ')}`);
      console.log(`Affected:`);
      console.log(`  ${spec.id} v${prov.version} (${prov.approvalState})`);
      console.log(`Required Actions:`);
      console.log(`  ${actionIdx}. Regenerate ${spec.id} from ${parentList.join(' + ')}`);
      console.log(`  ${actionIdx + 1}. Re-run validation loops`);
      actionIdx += 2;
      console.log(`-----------------------------------------`);
    }
  }
  
  console.log(`Estimated Recovery Scope: ${staleCount} asset rebuild`);
  console.log(`Integrity Target:         CLEAN`);
  console.log(`=========================================\n`);
}

// 2. validate command
function handleValidate(dateStr: string) {
  ensureDirectories();
  console.log(`\n🔍 Initiating Semantic Asset Gate Validation...`);

  const db = loadProvenanceDb();
  const jobsDb = loadJobsDb();
  const results: AssetVerificationResult[] = [];
  let totalCount = 0;
  let passedCount = 0;

  for (const spec of prodManifest.assets) {
    const files = getStagedFiles(spec.category).filter(f => f.startsWith(spec.prefix));
    
    if (files.length === 0) {
      continue;
    }

    totalCount++;
    const file = files[0];
    const res = performSemanticValidation(file, spec.category, spec.id, spec.description, spec.dimensions || '', db);
    results.push(res);
  }

  const invalidationReport = propagateDownstreamInvalidation(db);

  for (const r of results) {
    const prov = db.assets[r.assetId];
    if (prov && prov.approvalState === 'APPROVED') {
      passedCount++;
    } else {
      r.state = prov ? prov.approvalState : 'STAGED';
    }
  }

  ensureRecoveryJobs(db, jobsDb);
  generateRecoveryPlan(db);
  saveJobsDb(jobsDb);
  saveProvenanceDb(db);

  const reportPath = path.join(reportsDir, `v2_asset_validation_report_${dateStr}.md`);
  let mdContent = `# Semantic Asset Gate Verification Report: ${dateStr}\n\n`;
  mdContent += `### System Details:\n`;
  mdContent += `- **Episode:** ${prodManifest.episode_title} (Season: ${prodManifest.season_title})\n`;
  mdContent += `- **Character ID:** ${identityManifest.character_id} (Lock Mode: ${identityManifest.identity_lock})\n`;
  mdContent += `- **Scan Time:** ${new Date().toISOString()}\n\n`;
  
  mdContent += `## 🔬 Lifecycle Verification Table\n\n`;
  mdContent += `| Asset ID | File Name | Category | Lifecycle State | Structural | Technical | Identity | Creative | Details |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|---|\n`;

  for (const r of results) {
    const prov = db.assets[r.assetId];
    mdContent += `| ${r.assetId} | ${r.fileName} | ${r.category} | **${prov ? prov.approvalState : r.state}** | ${r.checks.structural ? '✓' : '✗'} | ${r.checks.technical ? '✓' : '✗'} | ${r.checks.identity ? '✓' : '✗'} | ${r.checks.creative ? '✓' : '✗'} | ${r.details.join('; ')} |\n`;
  }

  fs.writeFileSync(reportPath, mdContent, 'utf-8');
  console.log(`✅ Semantic validation report written: outputs/icyflamze_core/episode_1/render_intake/reports/v2_asset_validation_report_${dateStr}.md`);
  console.log(`Result: ${passedCount}/${totalCount} assets successfully verified to APPROVED state.`);
  writeLog(`Validated assets. Results: ${passedCount}/${totalCount} approved. Report written to ${reportPath}`);
}

// 3. status command
function handleStatus() {
  ensureDirectories();
  
  const db = loadProvenanceDb();
  const jobsDb = loadJobsDb();

  const categoryCounts: Record<string, { total: number; staged: number; approved: number }> = {
    image: { total: 0, staged: 0, approved: 0 },
    video: { total: 0, staged: 0, approved: 0 },
    audio: { total: 0, staged: 0, approved: 0 },
    cover_art: { total: 0, staged: 0, approved: 0 },
    caption: { total: 0, staged: 0, approved: 0 },
    assembly: { total: 0, staged: 0, approved: 0 }
  };

  for (const asset of prodManifest.assets) {
    if (categoryCounts[asset.category]) {
      categoryCounts[asset.category].total++;
    }
  }

  const results: AssetVerificationResult[] = [];
  const stagedSpecs: any[] = [];
  let totalStaged = 0;

  for (const spec of prodManifest.assets) {
    const files = getStagedFiles(spec.category).filter(f => f.startsWith(spec.prefix));
    if (files.length > 0) {
      totalStaged++;
      categoryCounts[spec.category].staged++;
      const file = files[0];
      const res = performSemanticValidation(file, spec.category, spec.id, spec.description, spec.dimensions || '', db);
      results.push(res);
      stagedSpecs.push({ spec, res });
    }
  }

  const invalidationReport = propagateDownstreamInvalidation(db);

  let verifiedCount = 0;
  let pendingCount = 0;
  let mutatedCount = 0;
  let staleCount = 0;
  let rejectedCount = 0;

  for (const spec of prodManifest.assets) {
    const prov = db.assets[spec.id];
    if (prov) {
      if (prov.approvalState === 'APPROVED') {
        verifiedCount++;
        categoryCounts[spec.category].approved++;
      } else if (prov.approvalState === 'STALE') {
        staleCount++;
      } else if (prov.approvalState === 'REJECTED') {
        rejectedCount++;
      } else {
        pendingCount++;
      }
      
      if (prov.version > 1 && prov.approvalState === 'STAGED') {
        mutatedCount++;
      }
    }
  }

  ensureRecoveryJobs(db, jobsDb);
  generateRecoveryPlan(db);
  saveJobsDb(jobsDb);
  saveProvenanceDb(db);

  const totalAssetsCount = prodManifest.assets.length;
  const readinessPercentage = Math.round((verifiedCount / totalAssetsCount) * 100);

  let blockingDependency = 'None';
  for (const spec of prodManifest.assets) {
    const isStaged = getStagedFiles(spec.category).some(f => f.startsWith(spec.prefix));
    if (!isStaged) {
      blockingDependency = spec.id;
      break;
    }
  }

  const cleanStatus = (staleCount === 0 && mutationsDetectedThisRun === 0 && rejectedCount === 0) ? 'CLEAN' : 'MUTATED/STALE';
  const depHealth = Math.round(((totalAssetsCount - staleCount) / totalAssetsCount) * 100);

  // Recovery Job Telemetry Counts
  const awaitingCount = jobsDb.jobs.filter(j => j.status === 'AWAITING_APPROVAL').length;
  const runningCount = jobsDb.jobs.filter(j => j.status === 'RUNNING').length;
  const failedJobsCount = jobsDb.jobs.filter(j => j.status === 'FAILED').length;

  console.log(`\n=========================================`);
  console.log(`📊 PRODUCTION CONTROL PLANE: EPISODE 1`);
  console.log(`=========================================`);
  console.log(`Visuals       ${categoryCounts.image.approved}/${categoryCounts.image.total}`);
  console.log(`Video         ${categoryCounts.video.approved}/${categoryCounts.video.total}`);
  console.log(`Cover Art     ${categoryCounts.cover_art.approved}/${categoryCounts.cover_art.total}`);
  console.log(`Narration     ${categoryCounts.audio.approved}/${categoryCounts.audio.total} (Narration + SFX)`);
  console.log(`Captions      ${categoryCounts.caption.approved}/${categoryCounts.caption.total}`);
  console.log(`Assembly      ${categoryCounts.assembly.approved}/${categoryCounts.assembly.total}`);
  console.log(`-----------------------------------------`);
  console.log(`Production Readiness Score: ${readinessPercentage}%`);
  console.log(`Blocking Dependency:        ${blockingDependency}`);
  console.log(`=========================================`);
  console.log(`Integrity Summary:`);
  console.log(`  Verified Assets:            ${verifiedCount}`);
  console.log(`  Pending Assets:             ${pendingCount}`);
  console.log(`  Unverified Mutations:       ${mutatedCount}`);
  console.log(`  Stale Assets:               ${staleCount}`);
  console.log(`  Rejected Assets:            ${rejectedCount}`);
  console.log(`-----------------------------------------`);
  console.log(`Integrity Status:             ${cleanStatus}`);
  console.log(`Dependency Health:            ${depHealth}%`);
  console.log(`Stale Descendants:            ${staleCount}`);
  console.log(`Mutations Detected This Run:  ${mutationsDetectedThisRun}`);
  console.log(`=========================================`);
  console.log(`Recovery Telemetry:`);
  console.log(`  Recovery Jobs Queue:        ${jobsDb.jobs.length}`);
  console.log(`  Awaiting Approval:          ${awaitingCount}`);
  console.log(`  Running:                    ${runningCount}`);
  console.log(`  Recovered This Run:         ${recoveredThisRunCount}`);
  console.log(`  Failed Recovery Jobs:       ${failedJobsCount}`);
  console.log(`=========================================`);

  printConsoleRecoveryPlan(db);

  if (stagedSpecs.length > 0) {
    console.log(`🔍 DETAILED ASSET PROVENANCE REGISTRY:`);
    console.log("-----------------------------------------");
    for (const item of stagedSpecs) {
      const prov = db.assets[item.spec.id];
      if (!prov) continue;

      let lineageStr = 'NONE';
      let integrityStr = 'VALID';

      if (item.spec.dependencies.length > 0) {
        lineageStr = item.spec.dependencies.map((d: string) => `${d} v${prov.parentLineage[d] || 0}`).join(', ');
        
        let parentsCurrent = true;
        for (const depId of item.spec.dependencies) {
          const parentProv = db.assets[depId];
          if (!parentProv) {
            parentsCurrent = false;
          } else {
            const recordedParentVer = prov.parentLineage[depId] || 0;
            const currentParentVer = parentProv.version;
            if (currentParentVer > recordedParentVer) {
              parentsCurrent = false;
            }
          }
        }
        
        integrityStr = parentsCurrent ? 'VALID' : 'INVALIDATED';
      }

      let availabilityStr = 'READY';
      for (const depId of item.spec.dependencies) {
        const depSpec = prodManifest.assets.find((a: any) => a.id === depId);
        if (depSpec) {
          const hasFile = getStagedFiles(depSpec.category).some(f => f.startsWith(depSpec.prefix));
          if (!hasFile) {
            availabilityStr = 'MISSING';
            break;
          }
        }
      }
      
      console.log(`${item.spec.id}`);
      console.log(`  Status:                     ${prov.approvalState}`);
      console.log(`  SHA256:                     ${prov.sha256.slice(0, 16)}...`);
      console.log(`  Version:                    ${prov.version}`);
      console.log(`  Source:                     ${prov.source}`);
      console.log(`  Generator:                  ${prov.generator}`);
      console.log(`  Reference:                  ${prov.parentAsset}`);
      console.log(`  Identity Score:             ${prov.identityScore}`);
      console.log(`  Technical Score:            ${prov.technicalScore}`);
      console.log(`  Creative Review:            ${prov.creativeScore === 'PASS' ? 'APPROVED' : prov.creativeScore}`);
      for (const review of ['identity', 'creative'] as const) {
        const rec = prov.signoffs?.[review];
        const score = review === 'identity' ? prov.identityScore : prov.creativeScore;
        if (rec && rec.sha256 === prov.sha256 && rec.verdict === score) {
          const label = `${review === 'identity' ? 'Identity' : 'Creative'} Sign-off:`.padEnd(28);
          console.log(`  ${label}${rec.verdict} by ${rec.reviewer}, ${rec.timestamp.slice(0, 10)}${rec.note ? ` (${rec.note})` : ''}`);
        }
      }
      const owed = pendingReviews(prov);
      if (owed.length > 0) {
        console.log(`  Awaiting Sign-off:          ${owed.join(', ')}`);
      }
      console.log(`  Dependency Availability:    ${availabilityStr}`);
      console.log(`  Dependency Integrity:       ${integrityStr}`);
      console.log(`  Parent Lineage:             ${lineageStr}`);
      console.log("-----------------------------------------");
    }
  }
  
  writeLog(`Printed Control Plane status. Score: ${readinessPercentage}%`);
}

// 4. human sign-off
// The file validate would check for a slot: the first match in name order.
function stagedFileFor(spec: any): string | null {
  const files = getStagedFiles(spec.category).filter(f => f.startsWith(spec.prefix));
  return files.length > 0 ? files[0] : null;
}

function currentReviewer(): string {
  try {
    return os.userInfo().username || 'unknown';
  } catch {
    return 'unknown';
  }
}

function handleSignoff(args: string[]) {
  ensureDirectories();
  const req = parseSignoffArgs(args);
  if ('error' in req) {
    console.error(`❌ ${req.error}`);
    process.exit(1);
  }

  const spec = prodManifest.assets.find((a: any) => a.id === req.slotId);
  if (!spec) {
    console.error(`❌ Unknown slot ${req.slotId}. Slots: ${prodManifest.assets.map((a: any) => a.id).join(', ')}`);
    process.exit(1);
  }

  const db = loadProvenanceDb();
  const entry = db.assets[spec.id];
  const file = stagedFileFor(spec);
  const currentSha = file ? calculateSha256(path.join(incomingFolders[spec.category], file)) : null;

  const outcome = applySignoff(entry, req.review, req.verdict, currentSha);
  if (!outcome.ok) {
    console.error(`❌ Sign-off refused for ${spec.id}: ${outcome.reason}`);
    writeLog(`Sign-off refused for ${spec.id} (${req.review} ${req.verdict}): ${outcome.reason}`);
    process.exit(1);
  }

  const record: SignoffRecord = {
    verdict: req.verdict,
    reviewer: currentReviewer(),
    timestamp: new Date().toISOString(),
    sha256: entry.sha256,
    note: req.note
  };
  const fromState = entry.approvalState;

  entry.identityScore = outcome.identityScore;
  entry.creativeScore = outcome.creativeScore;
  entry.approvalState = outcome.approvalState;
  entry.signoffs = { ...entry.signoffs, [req.review]: record };
  saveProvenanceDb(db);

  appendEvent({
    eventType: 'SIGNED_OFF',
    slotId: spec.id,
    version: entry.version,
    fromState,
    toState: entry.approvalState,
    reason: `HUMAN_${req.review.toUpperCase()}_${req.verdict}`,
    details: `reviewer=${record.reviewer}; sha256=${record.sha256.slice(0, 16)}${record.note ? `; note=${record.note}` : ''}`
  });
  if (entry.approvalState !== fromState && (entry.approvalState === 'APPROVED' || entry.approvalState === 'REJECTED')) {
    appendEvent({
      eventType: entry.approvalState,
      slotId: spec.id,
      version: entry.version,
      fromState,
      toState: entry.approvalState,
      reason: 'HUMAN_SIGNOFF'
    });
  }
  writeLog(`Sign-off recorded for ${spec.id}: ${req.review} ${req.verdict} by ${record.reviewer}; ${fromState} -> ${entry.approvalState}`);

  console.log(`✅ ${spec.id} ${spec.role}: ${req.review} ${req.verdict} recorded for ${file} (v${entry.version}).`);
  console.log(`   State: ${fromState} -> ${entry.approvalState}`);
  const owed = pendingReviews(entry);
  if (owed.length > 0) {
    console.log(`   Still awaiting: ${owed.join(', ')}`);
  }
}

function handleSignoffPending() {
  ensureDirectories();
  const db = loadProvenanceDb();
  const lines: string[] = [];

  for (const spec of prodManifest.assets) {
    const entry = db.assets[spec.id];
    if (!entry) continue;
    const owed = pendingReviews(entry);
    if (owed.length === 0) continue;

    const file = stagedFileFor(spec);
    const filePath = file ? path.relative(REPO_ROOT, path.join(incomingFolders[spec.category], file)) : null;
    const unchanged = file !== null && calculateSha256(path.join(incomingFolders[spec.category], file)) === entry.sha256;

    lines.push(`${spec.id} ${spec.role}`);
    lines.push(`  File:   ${filePath ?? 'none staged'}`);
    if (!unchanged) {
      lines.push(`  ⚠️  The file changed since validate. Run validate before signing off.`);
    } else {
      if (owed.includes('identity')) {
        lines.push(`  Identity: compare against ${identityManifest.reference_asset}`);
      }
      lines.push(`  Creative: check against the IP bible's visual language`);
      for (const review of owed) {
        lines.push(`  npm run command -- "icyflamze-core-episode-1-render-intake-v2" -- "signoff" "${spec.id}" "${review}" "pass"`);
      }
    }
    lines.push('');
  }

  console.log(`\n=========================================`);
  console.log(`✍️  AWAITING HUMAN SIGN-OFF`);
  console.log(`=========================================`);
  if (lines.length === 0) {
    console.log(`Nothing is waiting. Assets appear here once validate marks them TECHNICALLY_VERIFIED.`);
  } else {
    console.log(lines.join('\n'));
    console.log(`A fail needs a note: ... "signoff" "IMG-01" "identity" "fail" "glasses changed shape"`);
  }
  console.log(`=========================================\n`);
}

// 5. recovery commands
function handleRecoveryShow() {
  ensureDirectories();
  const jobsDb = loadJobsDb();
  console.log(`\n=========================================`);
  console.log(`🛠️  RECOVERY JOB QUEUE`);
  console.log(`=========================================`);
  if (jobsDb.jobs.length === 0) {
    console.log(`Queue is empty. No jobs found.`);
    console.log(`=========================================\n`);
    return;
  }
  
  for (const j of jobsDb.jobs) {
    const parentVerStr = Object.entries(j.parents).map(([pId, v]) => `${pId} v${v}`).join(', ');
    console.log(`Job ID:      ${j.jobId}`);
    console.log(`  Slot ID:   ${j.slotId}`);
    console.log(`  Status:    ${j.status}`);
    console.log(`  Action:    ${j.action}`);
    console.log(`  Parents:   ${parentVerStr}`);
    console.log(`  Reason:    ${j.reason}`);
    console.log(`  Created:   ${j.createdTimestamp}`);
    console.log(`-----------------------------------------`);
  }
  console.log(`=========================================\n`);
}

function handleRecoveryApprove(jobId: string) {
  ensureDirectories();
  const jobsDb = loadJobsDb();
  const job = jobsDb.jobs.find(j => j.jobId === jobId);
  if (!job) {
    console.error(`❌ Job not found in queue: ${jobId}`);
    process.exit(1);
  }
  job.status = 'APPROVED';
  saveJobsDb(jobsDb);
  console.log(`✅ Approved recovery job ${jobId}. Ready to run.`);
  writeLog(`Approved recovery job: ${jobId}`);
}

function handleRecoveryReject(jobId: string) {
  ensureDirectories();
  const jobsDb = loadJobsDb();
  const job = jobsDb.jobs.find(j => j.jobId === jobId);
  if (!job) {
    console.error(`❌ Job not found in queue: ${jobId}`);
    process.exit(1);
  }
  job.status = 'REJECTED';
  saveJobsDb(jobsDb);
  console.log(`🚫 Rejected recovery job ${jobId}.`);
  writeLog(`Rejected recovery job: ${jobId}`);
}

function handleRecoveryRun() {
  ensureDirectories();
  const jobsDb = loadJobsDb();
  const db = loadProvenanceDb();

  const approvedJobs = jobsDb.jobs.filter(j => j.status === 'APPROVED');
  if (approvedJobs.length === 0) {
    console.log(`No approved recovery jobs found in queue.`);
    return;
  }

  // Generation is manual, so this never writes to an asset file. It checks what
  // the Commander placed for each approved job and reconciles the record.
  console.log(`\n⚙️  Reconciling Approved Recovery Jobs...`);

  for (const job of approvedJobs) {
    const spec = prodManifest.assets.find((a: any) => a.id === job.slotId);
    if (!spec) {
      job.status = 'FAILED';
      console.error(`❌ ${job.jobId}: slot ${job.slotId} is not in the production manifest.`);
      continue;
    }

    const entry = db.assets[spec.id];
    const file = stagedFileFor(spec);
    const folder = incomingFolders[spec.category];
    const stagedSha = file ? calculateSha256(path.join(folder, file)) : null;

    const parents: RecoveryParent[] = spec.dependencies.map((depId: string) => {
      const parentProv = db.assets[depId];
      return {
        id: depId,
        recordedVersion: entry?.parentLineage[depId] || 0,
        currentVersion: parentProv ? parentProv.version : 0,
        approved: parentProv?.approvalState === 'APPROVED'
      };
    });

    const plan = planRecovery({ stagedSha, entry, parents });

    if (plan.kind === 'await_file') {
      const where = path.relative(REPO_ROOT, folder);
      console.log(`⏸  ${job.jobId}: waiting on you. ${plan.reason}`);
      console.log(`   Place it in ${where}/ as ${spec.prefix}_<name>_v<nn><ext>, after moving the old file to render_intake/superseded/, then rerun recovery-run.`);
      writeLog(`Recovery ${job.jobId} awaiting a hand-made file: ${plan.reason}`);
      continue;
    }

    const fromState = entry ? entry.approvalState : 'NONE';
    const res = performSemanticValidation(file!, spec.category, spec.id, spec.description, spec.dimensions || '', db, plan.force);
    propagateDownstreamInvalidation(db);
    const stateAfter = db.assets[spec.id]?.approvalState ?? res.state;
    const outcome = classifyRecovery(stateAfter);

    if (outcome === 'COMPLETED') {
      job.status = 'COMPLETED';
      job.reconciledTimestamp = new Date().toISOString();
      recoveredThisRunCount++;
      console.log(`✅ ${job.jobId}: ${spec.id} is ${stateAfter} (v${db.assets[spec.id].version}). Sign it off when you have reviewed it.`);
      appendEvent({
        eventType: 'REVALIDATED',
        slotId: spec.id,
        version: db.assets[spec.id].version,
        fromState,
        toState: stateAfter,
        reason: plan.force ? 'RECOVERY_REPROBE_PASSED' : 'RECOVERY_NEW_FILE_PASSED'
      });
    } else if (outcome === 'WAITING_ON_PARENTS') {
      const unapproved = spec.dependencies.filter((d: string) => db.assets[d]?.approvalState !== 'APPROVED');
      console.log(`⏸  ${job.jobId}: ${spec.id} is still STALE. Sign off ${unapproved.join(', ') || 'its parents'} first, then rerun recovery-run.`);
    } else if (outcome === 'FAILED_CHECKS') {
      console.log(`❌ ${job.jobId}: ${spec.id} failed its checks: ${res.details.join('; ')}`);
      console.log(`   The job stays approved. Place a corrected file and rerun recovery-run.`);
    } else {
      console.log(`⏸  ${job.jobId}: ${spec.id} could not be checked: ${res.details.join('; ')}`);
    }
    writeLog(`Recovery ${job.jobId}: ${outcome} (${fromState} -> ${stateAfter})`);
  }

  ensureRecoveryJobs(db, jobsDb);
  generateRecoveryPlan(db);
  saveJobsDb(jobsDb);
  saveProvenanceDb(db);
  console.log(`Reconciliation finished. ${recoveredThisRunCount} assets recovered.\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const dateStr = getFormattedDate();

  await announceIntent(`Compiling Render Intake v2: ${command}`);

  try {
    switch (command) {
      case 'scan':
        handleScan(dateStr);
        break;
      case 'validate':
        handleValidate(dateStr);
        break;
      case 'status':
        handleStatus();
        break;
      case 'signoff':
        handleSignoff(args.slice(1));
        break;
      case 'signoff-pending':
        handleSignoffPending();
        break;
      case 'recovery-show':
        handleRecoveryShow();
        break;
      case 'recovery-approve':
        if (!args[1]) {
          console.error(`❌ Job ID required. Usage: npm run icyflamze-core-episode-1-render-intake-v2 -- recovery-approve <jobId>`);
          process.exit(1);
        }
        handleRecoveryApprove(args[1]);
        break;
      case 'recovery-reject':
        if (!args[1]) {
          console.error(`❌ Job ID required. Usage: npm run icyflamze-core-episode-1-render-intake-v2 -- recovery-reject <jobId>`);
          process.exit(1);
        }
        handleRecoveryReject(args[1]);
        break;
      case 'recovery-run':
        handleRecoveryRun();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error(`   Commands: scan, validate, status, signoff-pending, ${SIGNOFF_USAGE}, recovery-show, recovery-approve <jobId>, recovery-reject <jobId>, recovery-run`);
        process.exit(1);
    }
    await announceCompletion(`Render intake v2 command ${command} completed successfully`, '10');
  } catch (error) {
    console.error(`❌ Error executing command ${command}:`, error);
    process.exit(1);
  }
}

main();
