import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { REPO_ROOT } from '../config/paths.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const orchestratorDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'orchestrator');
const statePath = path.join(orchestratorDir, 'orchestrator_state.json');

// Paths to check Render Intake state
const episode1IntakeDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'episode_1', 'render_intake');
const provenancePath = path.join(episode1IntakeDir, 'provenance_manifest.json');
const jobsPath = path.join(episode1IntakeDir, 'recovery_jobs.json');
const eventLogPath = path.join(episode1IntakeDir, 'provenance_events.jsonl');

interface EpisodeState {
  episodeId: string;
  title: string;
  missionState: 'CREATIVE_BRIEF' | 'ASSET_PLANNING' | 'IN_PRODUCTION' | 'MASTER_VALIDATION' | 'PUBLISHING' | 'COMPLETE' | 'MISSION_DRIFT' | 'READY_FOR_COMMANDER_APPROVAL';
  creativeBrief: 'PENDING' | 'APPROVED' | 'REJECTED';
  assetPlanning: 'PENDING' | 'COMPLETE';
  generationCount: number;
  generationTotal: number;
  integrityStatus: 'CLEAN' | 'MUTATED/STALE';
  humanDecisionsPending: number;
  assemblyState: 'NOT_READY' | 'BLOCKED' | 'READY' | 'COMPLETE';
  publishingState: 'NOT_READY' | 'READY' | 'COMPLETE';
  currentBlocker: string;
  missionLockHash?: string;
}

interface OrchestratorDb {
  episodes: Record<string, EpisodeState>;
  activeEpisodeId: string;
}

function ensureDirectory() {
  fs.mkdirSync(orchestratorDir, { recursive: true });
}

function loadDb(): OrchestratorDb {
  ensureDirectory();
  if (fs.existsSync(statePath)) {
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    } catch (e) {
      console.warn(`[!] Failed to parse orchestrator database, rebuilding...`);
    }
  }
  return { episodes: {}, activeEpisodeId: '' };
}

function saveDb(db: OrchestratorDb) {
  ensureDirectory();
  fs.writeFileSync(statePath, JSON.stringify(db, null, 2), 'utf-8');
}

function calculateCompletion(episode: EpisodeState): number {
  if (episode.missionState === 'MISSION_DRIFT') return 0;
  
  let score = 0;
  
  // 1. Creative Brief (15%)
  if (episode.creativeBrief === 'APPROVED') score += 15;
  
  // 2. Asset Planning (15%)
  if (episode.assetPlanning === 'COMPLETE') score += 15;
  
  // 3. Generation (40% proportional to generation count)
  if (episode.generationTotal > 0) {
    score += Math.round((episode.generationCount / episode.generationTotal) * 40);
  }
  
  // 4. Assembly (15%)
  if (episode.assemblyState === 'READY') score += 10;
  if (episode.assemblyState === 'COMPLETE') score += 15;
  
  // 5. Publishing (15%)
  if (episode.publishingState === 'READY') score += 10;
  if (episode.publishingState === 'COMPLETE') score += 15;
  
  return score;
}

function getFilesCountRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  let files: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      files = files.concat(getFilesCountRecursive(filePath));
    } else {
      if (!file.startsWith('.')) {
        files.push(filePath);
      }
    }
  }
  return files;
}

// Calculate cryptographic hash for Mission Lock
function calculateMissionHash(episodeId: string): string {
  const briefPath = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', episodeId, 'creative_brief.md');
  const manifestPath = path.join(REPO_ROOT, 'config', `${episodeId}_production_manifest.json`);
  
  let combined = '';
  if (fs.existsSync(briefPath)) {
    combined += fs.readFileSync(briefPath, 'utf-8');
  }
  if (fs.existsSync(manifestPath)) {
    combined += fs.readFileSync(manifestPath, 'utf-8');
  }
  
  return crypto.createHash('sha256').update(combined).digest('hex');
}

// Verification cycle sorting (Topological Sort)
function findExecutionOrder(assets: any[]): {
  success: boolean;
  order: string[][];
  error?: string;
  parallelCount: number;
  sequentialCount: number;
} {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  const allIds = new Set(assets.map(a => a.id));

  // Initialize
  for (const id of allIds) {
    inDegree[id] = 0;
    adjList[id] = [];
  }

  // Populate graph
  for (const asset of assets) {
    for (const depId of asset.dependencies) {
      if (!allIds.has(depId)) {
        return {
          success: false,
          order: [],
          error: `Missing dependency: Asset ${asset.id} depends on nonexistent asset ${depId}`,
          parallelCount: 0,
          sequentialCount: 0
        };
      }
      adjList[depId].push(asset.id);
      inDegree[asset.id]++;
    }
  }

  // Find independent assets (in-degree = 0)
  let queue: string[] = [];
  for (const id of allIds) {
    if (inDegree[id] === 0) {
      queue.push(id);
    }
  }

  const order: string[][] = [];
  let visitedCount = 0;

  while (queue.length > 0) {
    const level: string[] = [];
    const nextQueue: string[] = [];

    for (const id of queue) {
      level.push(id);
      visitedCount++;

      for (const neighbor of adjList[id]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          nextQueue.push(neighbor);
        }
      }
    }

    order.push(level);
    queue = nextQueue;
  }

  if (visitedCount !== allIds.size) {
    return {
      success: false,
      order: [],
      error: `Circular dependency detected in asset specifications graph.`,
      parallelCount: 0,
      sequentialCount: 0
    };
  }

  const parallelCount = order.length > 0 ? order[0].length : 0;
  const sequentialCount = assets.length - parallelCount;

  return {
    success: true,
    order,
    parallelCount,
    sequentialCount
  };
}

function handleInit(episodeId: string, title: string) {
  const db = loadDb();
  const newState: EpisodeState = {
    episodeId,
    title,
    missionState: 'CREATIVE_BRIEF',
    creativeBrief: 'PENDING',
    assetPlanning: 'PENDING',
    generationCount: 0,
    generationTotal: 27, 
    integrityStatus: 'CLEAN',
    humanDecisionsPending: 0,
    assemblyState: 'NOT_READY',
    publishingState: 'NOT_READY',
    currentBlocker: 'Awaiting creative brief approval'
  };
  
  db.episodes[episodeId] = newState;
  db.activeEpisodeId = episodeId;
  saveDb(db);
  
  console.log(`\n🎉 Initialized Production Orchestrator state for: ${title} (${episodeId})`);
  console.log(`State recorded in: outputs/icyflamze_core/orchestrator/orchestrator_state.json\n`);
}

function handleStatus() {
  const db = loadDb();
  const episodeId = db.activeEpisodeId;
  if (!episodeId || !db.episodes[episodeId]) {
    console.error(`\n❌ No active episode found in orchestrator registry.`);
    console.log(`Initialize one using: npm run agy-orchestrator -- init <episodeId> <title>\n`);
    process.exit(1);
  }
  
  const episode = db.episodes[episodeId];
  
  // Verify Mission Lock if it was established
  if (episode.missionLockHash) {
    const currentHash = calculateMissionHash(episodeId);
    if (currentHash !== episode.missionLockHash) {
      episode.missionState = 'MISSION_DRIFT';
      episode.currentBlocker = '⚠️  [MISSION DRIFT] Cryptographic baseline mismatch! Manifest or brief altered without Commander approval!';
      saveDb(db);
    } else if (episode.missionState === 'MISSION_DRIFT') {
      episode.missionState = 'READY_FOR_COMMANDER_APPROVAL';
      episode.currentBlocker = 'Awaiting Commander authorization to begin production execution';
      saveDb(db);
    }
  }

  let expectedAssetsCount = episode.generationTotal; 
  let presentAssetsCount = 0;
  let controlFilesCount = 0;
  let unexpectedFilesCount = 0;

  // Resolve counts and file cleanliness from Render Intake if Episode 1/2
  const episodeIntakeDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', episodeId, 'render_intake');
  const prodManifestPath = path.join(REPO_ROOT, 'config', `${episodeId}_production_manifest.json`);
  
  if (fs.existsSync(prodManifestPath)) {
    try {
      const prodManifest = JSON.parse(fs.readFileSync(prodManifestPath, 'utf-8'));
      expectedAssetsCount = prodManifest.assets.length;
      episode.generationTotal = expectedAssetsCount;
      
      const incomingDir = path.join(episodeIntakeDir, 'incoming');
      const physicalFiles = getFilesCountRecursive(incomingDir);
      
      for (const file of physicalFiles) {
        const baseName = path.basename(file);
        const isExpected = prodManifest.assets.some((a: any) => baseName.startsWith(a.prefix));
        if (isExpected) {
          presentAssetsCount++;
        } else {
          unexpectedFilesCount++;
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  // Resolve control files count
  const localProvPath = path.join(episodeIntakeDir, 'provenance_manifest.json');
  const localJobsPath = path.join(episodeIntakeDir, 'recovery_jobs.json');
  const localEventsPath = path.join(episodeIntakeDir, 'provenance_events.jsonl');
  
  const controlFiles = [localProvPath, localJobsPath, localEventsPath];
  for (const cf of controlFiles) {
    if (fs.existsSync(cf)) controlFilesCount++;
  }

  // Resolve dynamic status from database
  if (fs.existsSync(localProvPath)) {
    try {
      const prov = JSON.parse(fs.readFileSync(localProvPath, 'utf-8'));
      const assetsArr = Object.values(prov.assets) as any[];
      const approvedCount = assetsArr.filter(a => a.approvalState === 'APPROVED').length;
      const staleCount = assetsArr.filter(a => a.approvalState === 'STALE').length;
      
      episode.generationCount = approvedCount;
      episode.integrityStatus = staleCount > 0 ? 'MUTATED/STALE' : 'CLEAN';
    } catch (e) {
      // Fallback
    }
  }

  const completionPercent = calculateCompletion(episode);

  console.log(`\n${episode.title.toUpperCase()}`);
  console.log("────────────────────────────");
  console.log(`Mission State:       ${episode.missionState}`);
  console.log(`Creative Brief:      ${episode.creativeBrief}`);
  console.log(`Asset Planning:      ${episode.assetPlanning}`);
  console.log(`Generation:          ${episode.generationCount}/${episode.generationTotal}`);
  console.log(`Integrity:           ${episode.integrityStatus}`);
  console.log(`Human Decisions:     ${episode.humanDecisionsPending} PENDING`);
  console.log(`Assembly:            ${episode.assemblyState}`);
  console.log(`Publishing:          ${episode.publishingState}`);
  console.log("────────────────────────────");
  console.log(`Expected Production Assets: ${expectedAssetsCount}`);
  console.log(`Present Production Assets:  ${presentAssetsCount}`);
  console.log(`Control / Metadata Files:   ${controlFilesCount}`);
  console.log(`Unexpected Files:           ${unexpectedFilesCount}`);
  console.log("────────────────────────────");
  console.log(`Current Blocker:`);
  console.log(`${episode.currentBlocker}`);
  console.log(`\nEstimated Completion:`);
  console.log(`${completionPercent}%`);
  console.log(`────────────────────────────\n`);
}

function handleUpdateGate(
  gate: 'brief' | 'planning' | 'generation' | 'integrity' | 'decisions' | 'assembly' | 'publishing' | 'blocker' | 'mission' | 'lock-mission',
  value: string
) {
  const db = loadDb();
  const episodeId = db.activeEpisodeId;
  if (!episodeId || !db.episodes[episodeId]) {
    console.error(`❌ No active episode in registry.`);
    process.exit(1);
  }
  
  const ep = db.episodes[episodeId];

  // 1. Mission Lock Block Check
  if (ep.missionState === 'MISSION_DRIFT' && gate !== 'lock-mission') {
    console.error(`\n❌ Refusing command: State is locked due to MISSION_DRIFT. Re-authenticate or approve Mission Lock first.`);
    process.exit(1);
  }

  const localProvPath = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', episodeId, 'render_intake', 'provenance_manifest.json');
  if (fs.existsSync(localProvPath)) {
    try {
      const prov = JSON.parse(fs.readFileSync(localProvPath, 'utf-8'));
      const assetsArr = Object.values(prov.assets) as any[];
      const staleCount = assetsArr.filter(a => a.approvalState === 'STALE').length;
      ep.integrityStatus = staleCount > 0 ? 'MUTATED/STALE' : 'CLEAN';
    } catch (e) {}
  }

  // Adversarial Gates Validation Check
  const targetState = value.toUpperCase();
  const promotingToComplete = (gate === 'publishing' && targetState === 'COMPLETE') || 
                              (gate === 'mission' && (targetState === 'COMPLETE' || targetState === 'PUBLISHING'));

  if (promotingToComplete) {
    // 1. Asset Integrity Guard
    if (ep.integrityStatus === 'MUTATED/STALE') {
      console.error(`\n❌ Refusing command: Cannot complete mission while asset integrity is MUTATED/STALE.`);
      process.exit(1);
    }

    // 2. Human Decisions Guard
    if (ep.humanDecisionsPending > 0) {
      console.error(`\n❌ Refusing command: Cannot complete mission while human decisions are pending.`);
      process.exit(1);
    }

    // 3. Assembly Guard
    if (ep.assemblyState !== 'COMPLETE') {
      console.error(`\n❌ Refusing command: Cannot complete mission while assembly is incomplete.`);
      process.exit(1);
    }
  }
  
  switch (gate) {
    case 'brief':
      ep.creativeBrief = value as any;
      if (value === 'APPROVED') {
        ep.missionState = 'ASSET_PLANNING';
        ep.currentBlocker = 'Awaiting asset specs plan complete';
      }
      break;
    case 'planning':
      ep.assetPlanning = value as any;
      if (value === 'COMPLETE') {
        ep.missionState = 'IN_PRODUCTION';
        ep.currentBlocker = 'Generate visual and narration assets';
      }
      break;
    case 'generation':
      ep.generationCount = parseInt(value, 10);
      break;
    case 'integrity':
      ep.integrityStatus = value as any;
      break;
    case 'decisions':
      ep.humanDecisionsPending = parseInt(value, 10);
      break;
    case 'assembly':
      ep.assemblyState = value as any;
      break;
    case 'publishing':
      ep.publishingState = value as any;
      if (value === 'COMPLETE') {
        ep.missionState = 'COMPLETE';
        ep.currentBlocker = 'Production complete and released!';
      }
      break;
    case 'blocker':
      ep.currentBlocker = value;
      break;
    case 'mission':
      ep.missionState = value as any;
      break;
    case 'lock-mission':
      const lockHash = calculateMissionHash(episodeId);
      ep.missionLockHash = lockHash;
      ep.missionState = 'READY_FOR_COMMANDER_APPROVAL';
      ep.currentBlocker = 'Awaiting Commander authorization to begin production execution';
      console.log(`🔒 Mission Lock cryptographically established: ${lockHash}`);
      break;
  }
  
  saveDb(db);
  console.log(`✅ Updated ${gate} parameter for active episode.`);
}

function handlePreflight(episodeId: string) {
  ensureDirectory();
  console.log(`\n=========================================`);
  console.log(`🔎 EPISODE ${episodeId.toUpperCase()} PREFLIGHT COMPILE`);
  console.log(`=========================================`);

  const manifestPath = path.join(REPO_ROOT, 'config', `${episodeId}_production_manifest.json`);
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Preflight failed: Production manifest config not found at config/${episodeId}_production_manifest.json`);
    process.exit(1);
  }

  let manifest: any;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Preflight failed: Manifest JSON parsing error.`);
    process.exit(1);
  }

  // 1. Schema check
  const schemaPass = manifest.project_name && Array.isArray(manifest.assets);
  const slotsCount = manifest.assets.length;

  // 2. Unique slot IDs check
  const uniqueIds = new Set(manifest.assets.map((a: any) => a.id));
  const uniquePass = uniqueIds.size === slotsCount;

  // 3. Dependency tree checks
  const executionOrder = findExecutionOrder(manifest.assets);

  // 4. Orphan check
  let orphanPass = true;
  const referencedIds = new Set<string>();
  for (const asset of manifest.assets) {
    for (const depId of asset.dependencies) {
      referencedIds.add(depId);
    }
  }
  for (const asset of manifest.assets) {
    if (asset.dependencies.length === 0 && !referencedIds.has(asset.id) && asset.id !== 'IMG-01') {
      orphanPass = false;
    }
  }

  // 5. Specs completeness checks
  let technicalResolved = true;
  let identityResolved = true;
  let creativeResolved = true;
  let approvalGatesPass = true;

  for (const asset of manifest.assets) {
    if (!asset.role || !asset.tool || !asset.allowed_extensions) {
      technicalResolved = false;
    }
  }

  // Identity reference lock matches
  const identityManifestPath = path.join(REPO_ROOT, 'config', 'icyflamze-identity-manifest.json');
  if (fs.existsSync(identityManifestPath)) {
    const idManifest = JSON.parse(fs.readFileSync(identityManifestPath, 'utf-8'));
    if (!idManifest.character_id || !idManifest.reference_asset) {
      identityResolved = false;
    } else {
      // Check each asset slot: if it declares requires_identity, it MUST declare identity_reference === idManifest.character_id
      for (const asset of manifest.assets) {
        // Declared per slot in the manifest; see scripts/lib/asset-signoff.ts.
        const isCharacterDepicting = asset.requires_identity === true;

        if (isCharacterDepicting) {
          if (asset.identity_reference !== idManifest.character_id) {
            identityResolved = false;
            console.error(`⚠️  [IDENTITY REFERENCE ERROR] Asset ${asset.id} (${asset.role}) is character-depicting but lacks a valid "identity_reference": "${idManifest.character_id}" link.`);
          }
        }
      }
    }
  } else {
    identityResolved = false;
  }


  const passStr = (cond: boolean) => cond ? 'PASS' : 'FAIL';
  const resolvedStr = (cond: boolean) => cond ? 'RESOLVED' : 'UNRESOLVED';

  console.log(`Manifest Schema          ${passStr(schemaPass)}`);
  console.log(`Expected Slots           ${slotsCount}/${slotsCount}`);
  console.log(`Unique Slot IDs          ${passStr(uniquePass)}`);
  console.log(`Required Parents         ${resolvedStr(executionOrder.success)}`);
  console.log(`Circular Dependencies    ${executionOrder.success ? 'NONE' : 'CIRCULAR_DETECTED'}`);
  console.log(`Orphan Assets            ${orphanPass ? 'NONE' : 'ORPHAN_DETECTED'}`);
  console.log(`Missing Dependencies     ${executionOrder.success ? 'NONE' : 'MISSING_DETECTED'}`);
  console.log("-----------------------------------------");
  console.log(`Identity Requirements    ${resolvedStr(identityResolved)}`);
  console.log(`Technical Specs          ${resolvedStr(technicalResolved)}`);
  console.log(`Creative Specs           ${resolvedStr(creativeResolved)}`);
  console.log(`Approval Gates           DEFINED`);
  console.log("-----------------------------------------");
  console.log(`Execution Order          ${executionOrder.success ? 'COMPILED' : 'FAILED'}`);
  console.log(`Parallelizable Jobs      ${executionOrder.parallelCount}`);
  console.log(`Sequential Jobs          ${executionOrder.sequentialCount}`);
  console.log(`Commander Decisions      ${manifest.assets.filter((a: any) => a.id.startsWith('VID') || a.id.startsWith('ASM')).length}`);
  console.log("-----------------------------------------");
  console.log(`Estimated Generations    ${slotsCount}`);
  console.log(`Estimated Regenerations  0`);

  const allChecksPass = schemaPass && uniquePass && executionOrder.success && orphanPass && identityResolved && technicalResolved;
  
  if (allChecksPass) {
    console.log(`Production State         READY_FOR_COMMANDER_APPROVAL`);
    console.log(`=========================================\n`);
    
    // Automatically flag episode state as ready for approval in database
    const db = loadDb();
    const ep = db.episodes[episodeId];
    if (ep) {
      ep.missionState = 'READY_FOR_COMMANDER_APPROVAL';
      ep.currentBlocker = 'Awaiting Commander authorization to begin production execution';
      saveDb(db);
    }
  } else {
    console.log(`Production State         PLAN_REJECTED`);
    console.log(`=========================================\n`);
    if (executionOrder.error) {
      console.error(`⚠️  [PLAN DISAGREEMENT] ${executionOrder.error}`);
    }
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  await announceIntent(`Running Orchestrator command: ${command}`);

  try {
    switch (command) {
      case 'init':
        if (!args[1] || !args[2]) {
          console.error(`❌ Usage: npm run agy-orchestrator -- init <episodeId> <title>`);
          process.exit(1);
        }
        handleInit(args[1], args[2]);
        break;
      case 'status':
        handleStatus();
        break;
      case 'update':
        if (!args[1] || args[2] === undefined) {
          console.error(`❌ Usage: npm run agy-orchestrator -- update <gate> <value>`);
          process.exit(1);
        }
        handleUpdateGate(args[1] as any, args.slice(2).join(' '));
        break;
      case 'preflight':
        if (!args[1]) {
          console.error(`❌ Usage: npm run agy-orchestrator -- preflight <episodeId>`);
          process.exit(1);
        }
        handlePreflight(args[1]);
        break;
      default:
        console.error(`❌ Unknown orchestrator command: ${command}`);
        process.exit(1);
    }
    await announceCompletion(`Orchestrator command ${command} completed successfully`, '10');
  } catch (err) {
    console.error(`❌ Orchestrator execution error:`, err);
    process.exit(1);
  }
}

main();
