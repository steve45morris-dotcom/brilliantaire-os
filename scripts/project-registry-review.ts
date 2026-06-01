import fs from 'fs';
import path from 'path';
import {
  REVIEW_ONLY,
  ALLOW_PROJECTS_MD_WRITE,
  ALLOW_FOLDER_MOVE,
  ALLOW_FOLDER_DELETE,
  REQUIRE_MANUAL_APPROVAL,
  SCAN_ROOTS,
  REGISTRY_SOURCE,
  PROJECT_SIGNATURE_FILES,
  CLASSIFICATION_LABELS,
  ACTIVITY_LABELS,
  ClassificationLabel,
  ActivityLabel
} from '../config/project-registry-review.js';
import { printHelp } from './project-registry-review-help.js';

const REPO_ROOT = '/Users/alexanderanthony';

interface ProjectInfo {
  path: string;
  folderName: string;
  signatureFiles: string[];
  likelyType: string;
  lastModified: string;
  activityLabel: ActivityLabel;
  classification: ClassificationLabel;
  confidence: number;
  reason: string;
  recommendedAction: string;
}

// Format date consistently as YYYY-MM-DD
function getScanDate(): string {
  return '2026-06-01'; // Anchor scan date to 2026-06-01 for this phase run consistency
}

// Helper to find latest drift report in outputs/cleanup/reports/
function findLatestDriftReport(): string | null {
  const reportsDir = path.join(REPO_ROOT, 'outputs', 'cleanup', 'reports');
  if (!fs.existsSync(reportsDir)) return null;

  try {
    const files = fs.readdirSync(reportsDir);
    const driftFiles = files
      .filter(f => f.startsWith('project_registry_drift_') && f.endsWith('.md'))
      .sort(); // Lexicographical sort handles YYYY-MM-DD beautifully

    if (driftFiles.length > 0) {
      return path.join(reportsDir, driftFiles[driftFiles.length - 1]);
    }
  } catch (err) {
    console.error('Error finding latest drift report:', err);
  }
  return null;
}

// Parse PROJECTS.md to identify registered projects (fuzzy matching)
function getRegisteredProjects(): Set<string> {
  const registered = new Set<string>();
  const projectsMdPath = path.join(REPO_ROOT, REGISTRY_SOURCE);
  if (fs.existsSync(projectsMdPath)) {
    const content = fs.readFileSync(projectsMdPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*\|\s*\*\*([^*]+)\*\*\s*\|/);
      if (match) {
        registered.add(match[1].trim().toLowerCase());
      }
    }
  }
  return registered;
}

// Read drift report or fallback to direct scan
function getUnregisteredPaths(): string[] {
  const latestReport = findLatestDriftReport();
  if (latestReport) {
    console.log(`🧭 Reading drift paths from report: ${latestReport}`);
    try {
      const content = fs.readFileSync(latestReport, 'utf-8');
      const lines = content.split('\n');
      const paths: string[] = [];
      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length > 2) {
          const p = parts[1];
          if (p.startsWith('/') || p.startsWith('`')) {
            const cleanedPath = p.replace(/`/g, '');
            if (fs.existsSync(cleanedPath)) {
              paths.push(cleanedPath);
            }
          }
        }
      }
      if (paths.length > 0) {
        return paths;
      }
    } catch (err) {
      console.warn('Failed parsing drift report table, falling back to direct scan root search.', err);
    }
  }

  console.log('🧭 Drift report missing or unparseable. Scanning roots directly.');
  const registered = getRegisteredProjects();
  const paths: string[] = [];

  for (const root of SCAN_ROOTS) {
    if (!fs.existsSync(root)) continue;
    try {
      const entries = fs.readdirSync(root, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        if (entry.name === 'one-system') continue;

        const projectPath = path.join(root, entry.name);
        const nameLower = entry.name.toLowerCase();

        let isRegistered = registered.has(nameLower);
        if (!isRegistered) {
          const normalized = nameLower.replace(/[-_]/g, ' ');
          for (const reg of registered) {
            const regNorm = reg.toLowerCase().replace(/[-_]/g, ' ');
            if (normalized === regNorm || normalized.includes(regNorm) || regNorm.includes(normalized)) {
              isRegistered = true;
              break;
            }
          }
        }

        if (!isRegistered) {
          paths.push(projectPath);
        }
      }
    } catch {}
  }
  return paths;
}

// Compute metadata and classify a single unregistered project path
function processProjectPath(projectPath: string): ProjectInfo {
  const folderName = path.basename(projectPath);
  const detectedSignatures: string[] = [];

  // Signature check
  if (fs.existsSync(projectPath)) {
    try {
      const contents = fs.readdirSync(projectPath);
      for (const file of PROJECT_SIGNATURE_FILES) {
        if (contents.includes(file)) {
          detectedSignatures.push(file);
        }
      }
    } catch {}
  }

  // Type guessing
  let likelyType = 'unknown';
  if (detectedSignatures.includes('package.json')) likelyType = 'node';
  else if (detectedSignatures.includes('pyproject.toml')) likelyType = 'python';
  else if (detectedSignatures.includes('Cargo.toml')) likelyType = 'rust';
  else if (detectedSignatures.includes('go.mod')) likelyType = 'go';
  else if (detectedSignatures.includes('pubspec.yaml')) likelyType = 'flutter';
  else if (detectedSignatures.includes('docker-compose.yml')) likelyType = 'docker';
  else if (detectedSignatures.includes('Taskfile.yml')) likelyType = 'taskfile';
  else if (detectedSignatures.includes('README.md')) likelyType = 'docs';

  // Last modified checking
  let mtime = 0;
  try {
    const stats = fs.statSync(projectPath);
    mtime = stats.mtimeMs;
    // Check root files to find max mtime
    const rootFiles = fs.readdirSync(projectPath);
    for (const f of rootFiles) {
      try {
        const fStats = fs.statSync(path.join(projectPath, f));
        if (fStats.mtimeMs > mtime) {
          mtime = fStats.mtimeMs;
        }
      } catch {}
    }
  } catch {}

  const lastModified = mtime ? new Date(mtime).toISOString().split('T')[0] : 'unknown';
  const daysDiff = mtime ? (Date.now() - mtime) / (1000 * 60 * 60 * 24) : Infinity;

  // Activity Label
  let activityLabel: ActivityLabel = 'unknown';
  if (daysDiff !== Infinity) {
    if (daysDiff <= 30) activityLabel = 'recent';
    else if (daysDiff <= 90) activityLabel = 'active';
    else activityLabel = 'stale';
  }

  // Classification & Scoring
  let classification: ClassificationLabel = 'inspect_manually';
  let confidence = 50;
  let reason = 'Insufficient active indicator metadata.';
  let recommendedAction = 'Manual code inspection required to resolve operational status.';

  const nameLower = folderName.toLowerCase();
  const isIgnorePattern = nameLower.startsWith('.') || ['node_modules', 'venv', 'env', 'dist', 'build', 'tmp', 'temp', 'cache', '.cache', '__pycache__'].includes(nameLower);
  const isTemplatePattern = nameLower.includes('template') || nameLower.includes('starter') || nameLower.includes('boilerplate') || nameLower.includes('example') || nameLower.includes('sample') || nameLower.includes('demo');

  if (isIgnorePattern) {
    classification = 'ignore';
    confidence = 95;
    reason = 'Identified as a build, dependency, or runtime cache folder path.';
    recommendedAction = 'Ignore and omit from projects matrix entries.';
  } else if (isTemplatePattern) {
    classification = 'dependency_or_template';
    confidence = 85;
    reason = 'Matches names containing common template, clone, sample or setup identifiers.';
    recommendedAction = 'Keep as static workspace reference if needed.';
  } else if (activityLabel === 'recent' || activityLabel === 'active') {
    if (detectedSignatures.length >= 2 || detectedSignatures.includes('.git') || detectedSignatures.includes('package.json') || detectedSignatures.includes('pyproject.toml')) {
      classification = 'register';
      confidence = 90;
      reason = `Recently active project directory containing important signature files (${detectedSignatures.join(', ')}).`;
      recommendedAction = 'Register in PROJECTS.md matrix.';
    } else {
      classification = 'active_experiment';
      confidence = 75;
      reason = 'Recent folder activity detected, but lacks typical structured codebase signature files.';
      recommendedAction = 'Monitor workspace usage before registering.';
    }
  } else if (activityLabel === 'stale') {
    if (detectedSignatures.length === 0) {
      classification = 'archive_candidate';
      confidence = 85;
      reason = 'Folder is inactive (no changes for over 90 days) and lacks configuration signatures.';
      recommendedAction = 'Flag for future manual archiving.';
    } else {
      classification = 'archive_candidate';
      confidence = 70;
      reason = 'Stale folder with configuration signatures, inactive codebase.';
      recommendedAction = 'Archive folder to reduce local filesystem drift clutter.';
    }
  } else {
    classification = 'inspect_manually';
    confidence = 55;
    reason = 'Undetermined activity and minimal configuration files.';
    recommendedAction = 'Inspect manually to determine if project is active or safe for archival.';
  }

  return {
    path: projectPath,
    folderName,
    signatureFiles: detectedSignatures.length > 0 ? detectedSignatures : ['none'],
    likelyType,
    lastModified,
    activityLabel,
    classification,
    confidence,
    reason,
    recommendedAction
  };
}

// 1. "classify" subcommand logic
function runClassify(): ProjectInfo[] {
  console.log('🧭 Initiating classification of unregistered directories...');
  const unregistered = getUnregisteredPaths();
  const results: ProjectInfo[] = unregistered.map(p => processProjectPath(p));

  // Load classification profile template
  const templatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'project-classification-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    console.error('Classification template missing. Falling back to default format.');
    template = `# 📋 Project Classification Profile: {{folderName}}\n- **Path:** {{path}}\n- **Folder Name:** {{folderName}}\n- **Signature Files:** {{signatureFiles}}\n- **Likely Type:** {{likelyType}}\n- **Last Modified:** {{lastModified}}\n- **Activity Label:** {{activityLabel}}\n- **Classification:** {{classification}}\n- **Confidence Score:** {{confidence}}%\n- **Reason:** {{reason}}\n- **Recommended Action:** {{recommendedAction}}`;
  }

  const profiles = results.map(res => {
    return template
      .replace(/{{folderName}}/g, res.folderName)
      .replace(/{{path}}/g, res.path)
      .replace(/{{signatureFiles}}/g, res.signatureFiles.join(', '))
      .replace(/{{likelyType}}/g, res.likelyType)
      .replace(/{{lastModified}}/g, res.lastModified)
      .replace(/{{activityLabel}}/g, res.activityLabel)
      .replace(/{{classification}}/g, res.classification)
      .replace(/{{confidence}}/g, res.confidence.toString())
      .replace(/{{reason}}/g, res.reason)
      .replace(/{{recommendedAction}}/g, res.recommendedAction);
  });

  const scanDate = getScanDate();
  const fileContent = `# 🧭 Project Registry Classification Report - ${scanDate}\n\nThis report lists profiles and action classifications for unregistered folders.\n\n---\n\n` + profiles.join('\n\n---\n\n');

  const destPath = path.join(REPO_ROOT, 'outputs', 'project_registry', 'classification', `project_classification_${scanDate}.md`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Classification report generated: file://${destPath}`);
  return results;
}

// 2. "staged-entries" subcommand logic
function runStagedEntries(classifiedProjects?: ProjectInfo[]) {
  console.log('🧭 Generating PROJECTS.md staged candidate entry proposals...');
  const projects = classifiedProjects || getUnregisteredPaths().map(p => processProjectPath(p));

  const eligibleClassifications: string[] = ['register', 'active_experiment', 'inspect_manually'];
  const candidates = projects.filter(p => eligibleClassifications.includes(p.classification));

  // Load entry template
  const templatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'project-registry-entry-template.md');
  let rowTemplate = '';
  if (fs.existsSync(templatePath)) {
    rowTemplate = fs.readFileSync(templatePath, 'utf-8').trim();
  } else {
    rowTemplate = '| **{{projectName}}** | {{purpose}} | {{status}} | {{priority}} | {{nextAction}} | {{relatedTools}} | {{notes}} |';
  }

  const rows = candidates.map(c => {
    // Guess pretty project name
    const prettyName = c.folderName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const status = c.activityLabel === 'recent' || c.activityLabel === 'active' ? 'Active' : 'Building';
    const relatedTools = c.signatureFiles.join(', ');

    return rowTemplate
      .replace('{{projectName}}', prettyName)
      .replace('{{purpose}}', `Development repository (Path: \`${c.path}\`)`)
      .replace('{{status}}', status)
      .replace('{{priority}}', 'Medium')
      .replace('{{nextAction}}', 'Verify project structure and catalog system dependencies')
      .replace('{{relatedTools}}', relatedTools)
      .replace('{{notes}}', `Staged during drift scan (${c.classification} classification, confidence ${c.confidence}%)`);
  });

  const scanDate = getScanDate();
  const fileContent = `# 📂 Proposed PROJECTS.md Candidate Staged Entries\n\nGenerated on ${scanDate}. Table entries are proposed for manual verification.\n\n| Project Name | Purpose | Status | Priority | Next Action | Related Tools | Notes |\n|---|---|---|---|---|---|---|\n` + rows.join('\n');

  const destPath = path.join(REPO_ROOT, 'outputs', 'project_registry', 'staged_entries', `project_registry_candidate_entries_${scanDate}.md`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Staged candidate entries generated: file://${destPath}`);
}

// 3. "summary" subcommand logic
function runSummary(classifiedProjects?: ProjectInfo[]) {
  console.log('🧭 Generating project registry drift summary...');
  const projects = classifiedProjects || getUnregisteredPaths().map(p => processProjectPath(p));

  const typeCounts: Record<string, number> = {};
  const activityCounts: Record<string, number> = {};
  const classificationCounts: Record<string, number> = {};

  projects.forEach(p => {
    typeCounts[p.likelyType] = (typeCounts[p.likelyType] || 0) + 1;
    activityCounts[p.activityLabel] = (activityCounts[p.activityLabel] || 0) + 1;
    classificationCounts[p.classification] = (classificationCounts[p.classification] || 0) + 1;
  });

  const topRegister = projects
    .filter(p => p.classification === 'register')
    .slice(0, 10)
    .map(p => `- **${p.folderName}** (\`${p.path}\`) - Confidence: ${p.confidence}%`);

  const topArchive = projects
    .filter(p => p.classification === 'archive_candidate')
    .map(p => `- **${p.folderName}** (\`${p.path}\`) - Modified: ${p.lastModified}`);

  const topIgnore = projects
    .filter(p => p.classification === 'ignore')
    .map(p => `- **${p.folderName}** (\`${p.path}\`)`);

  // Load summary template
  const templatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'project-drift-summary-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🧭 Project Registry Drift Summary\n\n- **Total Unregistered:** {{totalUnregistered}}\n\n## 📊 Counts By Type\n{{countsByType}}\n\n## 📈 Counts By Activity\n{{countsByActivity}}\n\n## 🏷️ Counts By Classification\n{{countsByClassification}}\n\n## ⭐️ Top Register Candidates\n{{topRegisterCandidates}}\n\n## 📦 Archive Candidates\n{{archiveCandidates}}\n\n## 🚫 Ignore Candidates\n{{ignoreCandidates}}\n\n## ➡️ Next Action\n{{nextAction}}`;
  }

  const formatRecord = (rec: Record<string, number>) => {
    return Object.entries(rec)
      .map(([key, val]) => `  - **${key}:** ${val}`)
      .join('\n');
  };

  const fileContent = template
    .replace('{{totalUnregistered}}', projects.length.toString())
    .replace('{{countsByType}}', formatRecord(typeCounts))
    .replace('{{countsByActivity}}', formatRecord(activityCounts))
    .replace('{{countsByClassification}}', formatRecord(classificationCounts))
    .replace('{{topRegisterCandidates}}', topRegister.length > 0 ? topRegister.join('\n') : '  None')
    .replace('{{archiveCandidates}}', topArchive.length > 0 ? topArchive.join('\n') : '  None')
    .replace('{{ignoreCandidates}}', topIgnore.length > 0 ? topIgnore.join('\n') : '  None')
    .replace('{{nextAction}}', 'Conduct manual review of staged candidate matrix lines before appending to PROJECTS.md.');

  const scanDate = getScanDate();
  const destPath = path.join(REPO_ROOT, 'outputs', 'project_registry', 'reports', `project_registry_drift_summary_${scanDate}.md`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Registry drift summary report generated: file://${destPath}`);
}

// 4. "action-plan" subcommand logic
function runActionPlan(classifiedProjects?: ProjectInfo[]) {
  console.log('🧭 Generating project registry action plan...');
  const projects = classifiedProjects || getUnregisteredPaths().map(p => processProjectPath(p));

  // Load action plan template
  const templatePath = path.join(REPO_ROOT, 'templates', 'project_registry', 'project-action-plan-template.md');
  let planTemplate = '';
  if (fs.existsSync(templatePath)) {
    planTemplate = fs.readFileSync(templatePath, 'utf-8');
  } else {
    planTemplate = `# 🛡️ Project Registry Action Plan\n\n## {{actionGroup}}\n- **Projects:** {{projects}}\n- **Reason:** {{reason}}\n- **Required Review:** {{requiredReview}}\n- **Approval Status:** {{approvalStatus}}\n- **Next Step:** {{nextStep}}`;
  }

  const groups = [
    {
      groupName: 'Immediate Register Candidates',
      label: 'register',
      reason: 'Active project directories with verified signature configuration files.',
      review: 'Confirm project name, purpose, and priority level descriptors align with projects matrix rules.',
      step: 'Merge approved staged candidate rows into PROJECTS.md.'
    },
    {
      groupName: 'Inspect Manually Candidates',
      label: 'inspect_manually',
      reason: 'Projects with weak metadata signal or ambiguous structure.',
      review: 'Scan files inside directories to identify ownership and utility parameters.',
      step: 'Decide whether to register, ignore, or flag for archiving.'
    },
    {
      groupName: 'Archive Candidates',
      label: 'archive_candidate',
      reason: 'Stale folders inactive for 90+ days.',
      review: 'Verify codebase contains no uncommitted work or critical assets.',
      step: 'Move to long-term archive directory.'
    },
    {
      groupName: 'Ignore Candidates',
      label: 'ignore',
      reason: 'Build artifacts, caches, dependencies, or metadata stubs.',
      review: 'Confirm folders match build configuration patterns.',
      step: 'Add to clean scan exclude filters.'
    }
  ];

  const blocks = groups.map(g => {
    const list = projects
      .filter(p => p.classification === g.label)
      .map(p => `\`${p.folderName}\` (${p.path})`);

    const projectListStr = list.length > 0 ? list.join(', ') : 'None';

    return planTemplate
      .replace('## {{actionGroup}}', `## ${g.groupName}`)
      .replace('{{projects}}', projectListStr)
      .replace('{{reason}}', g.reason)
      .replace('{{requiredReview}}', g.review)
      .replace('{{approvalStatus}}', REQUIRE_MANUAL_APPROVAL ? 'PENDING OPERATOR SIGN-OFF' : 'BYPASS')
      .replace('{{nextStep}}', g.step);
  });

  const scanDate = getScanDate();
  const header = `# 🛡️ Project Registry Action Plan - ${scanDate}\n\nAction groups for resolving local workspace directory drift.\n\n`;
  const footer = `\n## 📝 Human Verification Checklist\n\n- [ ] Review immediate register candidates list\n- [ ] Inspect manual review candidates contents\n- [ ] Audit archive candidates for uncommitted code\n- [ ] Confirm ignore folder rules match build configuration\n- [ ] Append verified candidates to PROJECTS.md manually\n`;

  const fileContent = header + blocks.join('\n\n---\n\n') + footer;
  const destPath = path.join(REPO_ROOT, 'outputs', 'project_registry', 'reports', `project_registry_action_plan_${scanDate}.md`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, fileContent, 'utf-8');

  console.log(`✅ Project action plan generated: file://${destPath}`);
}

// 5. "status" subcommand logic
function runStatus() {
  console.log('🧭 Retrieving latest project registry status...');
  const scanDate = getScanDate();

  const classPath = path.join(REPO_ROOT, 'outputs', 'project_registry', 'classification', `project_classification_${scanDate}.md`);
  const stagedPath = path.join(REPO_ROOT, 'outputs', 'project_registry', 'staged_entries', `project_registry_candidate_entries_${scanDate}.md`);
  const sumPath = path.join(REPO_ROOT, 'outputs', 'project_registry', 'reports', `project_registry_drift_summary_${scanDate}.md`);
  const planPath = path.join(REPO_ROOT, 'outputs', 'project_registry', 'reports', `project_registry_action_plan_${scanDate}.md`);

  const classFound = fs.existsSync(classPath);
  const stagedFound = fs.existsSync(stagedPath);
  const sumFound = fs.existsSync(sumPath);
  const planFound = fs.existsSync(planPath);

  let regCount = 0;
  let inspectCount = 0;
  let archiveCount = 0;

  if (classFound) {
    const projects = getUnregisteredPaths().map(p => processProjectPath(p));
    regCount = projects.filter(p => p.classification === 'register').length;
    inspectCount = projects.filter(p => p.classification === 'inspect_manually').length;
    archiveCount = projects.filter(p => p.classification === 'archive_candidate').length;
  }

  console.log(`
📊 Project Registry Drift Review Status Dashboard:

Files Status:
  - Classification report:   ${classFound ? `file://${classPath} (FOUND)` : 'NOT FOUND'}
  - Staged entries table:    ${stagedFound ? `file://${stagedPath} (FOUND)` : 'NOT FOUND'}
  - Drift summary:           ${sumFound ? `file://${sumPath} (FOUND)` : 'NOT FOUND'}
  - Action plan checklist:   ${planFound ? `file://${planPath} (FOUND)` : 'NOT FOUND'}

Metrics & Counts (Latest Run):
  - Register Candidates:     ${regCount}
  - Inspect Candidates:      ${inspectCount}
  - Archive Candidates:      ${archiveCount}

Next Action Recommendation:
  - Check staged candidate matrix lines manually and review action plan checklist.
`);
}

// Main Router
function main() {
  const arg = process.argv[2]?.trim().toLowerCase();

  if (REVIEW_ONLY) {
    if (ALLOW_PROJECTS_MD_WRITE || ALLOW_FOLDER_MOVE || ALLOW_FOLDER_DELETE) {
      console.error('❌ Security Violation: Configuration violates REVIEW_ONLY constraints.');
      process.exit(1);
    }
  }

  switch (arg) {
    case 'classify': {
      runClassify();
      break;
    }
    case 'staged-entries': {
      runStagedEntries();
      break;
    }
    case 'summary': {
      runSummary();
      break;
    }
    case 'action-plan': {
      runActionPlan();
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined: {
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${arg}". Use "help" to see available commands.`);
      process.exit(1);
    }
  }
}

main();
