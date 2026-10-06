import fs from 'fs';
import path from 'path';

export const REPO_ROOT = '/Users/alexanderanthony';
export const PROJECTS_MD_PATH = path.join(REPO_ROOT, 'PROJECTS.md');

export interface CanonicalTarget {
  name: string;
  namePattern: RegExp;
  path: string;
  expectedStatePattern: RegExp;
  completionPattern: RegExp;
  requiredNotesSnippet: string;
}

export const CANONICAL_PROJECT_TARGETS: CanonicalTarget[] = [
  {
    name: 'P.J.K. (Prof John Kush)',
    namePattern: /P\.J\.K\.\s*\(Prof John Kush\)/i,
    path: '/Users/alexanderanthony/PJK',
    expectedStatePattern: /Active/i,
    completionPattern: /90%/i,
    requiredNotesSnippet: 'Ratified AEC3 baseline remains untouched'
  },
  {
    name: 'Voice Vibe',
    namePattern: /Voice Vibe/i,
    path: '/Users/alexanderanthony/voice_vibe_asr',
    expectedStatePattern: /(Persistent\s*\/\s*Supervised|Built\s*\/\s*Standby)/i,
    completionPattern: /(82%|85%|88%)/i,
    requiredNotesSnippet: 'NVIDIA-dependent functions explicitly dependency-gated'
  }
];

export interface CanonicalCheckResult {
  allPassed: boolean;
  verifiedCount: number;
  missingFromDisk: string[];
  missingFromRegistry: string[];
  warnings: string[];
  candidates: string[];
}

export function runCanonicalCheck(): CanonicalCheckResult {
  console.log('====================================================');
  console.log('🛡️  CANONICAL PROJECT REGISTRY INTEGRITY VERIFICATION');
  console.log('====================================================\n');

  const result: CanonicalCheckResult = {
    allPassed: true,
    verifiedCount: 0,
    missingFromDisk: [],
    missingFromRegistry: [],
    warnings: [],
    candidates: []
  };

  if (!fs.existsSync(PROJECTS_MD_PATH)) {
    console.error(`❌ Registry file not found: ${PROJECTS_MD_PATH}`);
    result.allPassed = false;
    result.warnings.push(`Registry file not found: ${PROJECTS_MD_PATH}`);
    return result;
  }

  const projectsContent = fs.readFileSync(PROJECTS_MD_PATH, 'utf-8');
  const lines = projectsContent.split('\n');

  console.log(`[1] Auditing Required Canonical Target Registrations:\n`);

  for (const target of CANONICAL_PROJECT_TARGETS) {
    console.log(`🔍 Checking canonical project: "${target.name}"`);
    console.log(`   Path: ${target.path}`);

    // Check disk existence
    const existsOnDisk = fs.existsSync(target.path);
    if (!existsOnDisk) {
      console.warn(`   ⚠️  WARNING: Project path does not exist on filesystem: ${target.path}`);
      result.missingFromDisk.push(target.path);
      result.allPassed = false;
    } else {
      console.log(`   ✅ Verified on filesystem.`);
    }

    // Check registry row presence
    const matchingLine = lines.find(l => {
      if (!l.trim().startsWith('|')) return false;
      return target.namePattern.test(l) && l.includes(target.path);
    });

    if (!matchingLine) {
      console.error(`   ❌ FAIL: Not found in canonical registry (${PROJECTS_MD_PATH})!`);
      result.missingFromRegistry.push(target.name);
      result.allPassed = false;
      continue;
    }

    // Validate Status & Completion
    // Note: Notes column may contain escaped pipes (\|)
    const cols = matchingLine.split('|').map(c => c.trim());
    const statusCol = cols[3] || '';
    const notesCol = cols.slice(7).join(' | ');

    // Guard against premature "VERIFIED COMPLETE" or "Complete"
    if (statusCol.toLowerCase().includes('complete') && !statusCol.toLowerCase().includes('standby')) {
      console.warn(`   ⚠️  GOVERNANCE VIOLATION: Project status prematurely marked as Complete: "${statusCol}"`);
      result.warnings.push(`${target.name} has premature completion status: "${statusCol}"`);
      result.allPassed = false;
    }

    if (!target.expectedStatePattern.test(statusCol)) {
      console.warn(`   ⚠️  Status mismatch: Expected pattern ${target.expectedStatePattern}, found: "${statusCol}"`);
      result.warnings.push(`${target.name} status mismatch: "${statusCol}"`);
    }

    if (!target.completionPattern.test(notesCol)) {
      console.warn(`   ⚠️  Completion percentage mismatch in notes: "${notesCol}"`);
      result.warnings.push(`${target.name} missing expected completion percentage`);
    }

    if (target.requiredNotesSnippet && !notesCol.includes(target.requiredNotesSnippet)) {
      console.warn(`   ⚠️  Missing required governance constraint note: "${target.requiredNotesSnippet}"`);
      result.warnings.push(`${target.name} missing note: "${target.requiredNotesSnippet}"`);
    }

    console.log(`   ✅ Verified in canonical registry with status "${statusCol}".`);
    result.verifiedCount++;
    console.log('');
  }

  // Passive scan for candidate standalone repositories in $HOME
  console.log(`[2] Passive Drift Scan for Standalone Filesystem Candidates:`);
  try {
    const entries = fs.readdirSync(REPO_ROOT, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      // Skip standard OS and known directories
      const skipDirs = new Set([
        'Applications', 'Desktop', 'Documents', 'Downloads', 'Library', 'Movies', 'Music',
        'Pictures', 'Public', 'Projects', 'TreeGrooveProjects', 'outputs', 'node_modules',
        'dist', 'data', 'docs', 'scratch', 'dashboard', 'components', 'logs', 'recordings',
        'supernova', 'supernova_workspace', 'supernova_tools', 'supernova_design_system',
        'supernova_memory_vault', 'Sovereign_Intelligence', 'Supernova_System', 'work',
        'workflows', 'workspaces', 'test_inputs', 'inputAudio', 'voice_sessions', 'voice_queue'
      ]);

      if (skipDirs.has(entry.name)) continue;

      const candidatePath = path.join(REPO_ROOT, entry.name);
      const isGitRepo = fs.existsSync(path.join(candidatePath, '.git'));
      const isPythonProject = fs.existsSync(path.join(candidatePath, 'pyproject.toml'));

      if (isGitRepo || isPythonProject) {
        // Check if already registered in PROJECTS.md
        const isRegistered = projectsContent.toLowerCase().includes(candidatePath.toLowerCase()) ||
                             projectsContent.toLowerCase().includes(entry.name.toLowerCase());

        if (!isRegistered) {
          console.log(`   🔍 [CANDIDATE DISCOVERED] ${candidatePath}`);
          console.log(`      Status: Unregistered filesystem repository.`);
          console.log(`      Governance rule: Detection only. Manual approval required for registration.`);
          result.candidates.push(candidatePath);
        }
      }
    }
  } catch (err) {
    console.warn(`   ⚠️  Passive candidate scan encountered read notice: ${err}`);
  }

  if (result.candidates.length === 0) {
    console.log(`   ✅ No unmapped standalone candidate repositories detected.\n`);
  } else {
    console.log(`   ℹ️  Detected ${result.candidates.length} unregistered candidate directory(ies) for governance review.\n`);
  }

  console.log('====================================================');
  console.log(`Audit Summary:`);
  console.log(`  - Verified Canonical Systems: ${result.verifiedCount}/${CANONICAL_PROJECT_TARGETS.length}`);
  console.log(`  - Missing From Disk:          ${result.missingFromDisk.length}`);
  console.log(`  - Missing From Registry:      ${result.missingFromRegistry.length}`);
  console.log(`  - Governance Warnings:        ${result.warnings.length}`);
  console.log(`  - Unregistered Candidates:    ${result.candidates.length}`);
  console.log(`  - Overall Integrity Status:   ${result.allPassed ? 'PASS (HEALTHY)' : 'FAIL (ACTION REQUIRED)'}`);
  console.log('====================================================\n');

  return result;
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('project-registry-canonical-check.ts')) {
  const result = runCanonicalCheck();
  if (!result.allPassed) {
    process.exit(1);
  }
}
