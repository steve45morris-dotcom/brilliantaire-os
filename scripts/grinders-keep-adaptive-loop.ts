import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { inputFiles, inputDirectories, outputDirectories } from '../config/grinders-keep-core-brief-engine.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function runAdaptiveLoop() {
  const dateStr = getFormattedDate();
  console.log(`🔁 Running Grinders Keep Adaptive Learning Loop v0.1 for ${dateStr} (Real Data Enforcement Mode)...`);
  await announceIntent("Running adaptive learning loop analysis on real logs");

  // Read command logs dynamically to find blocked aliases
  const commandLogDir = path.join(REPO_ROOT, 'outputs', 'command_logs');
  let blockedAliasesCount = 0;
  let totalCommandAttempts = 0;
  let successAttempts = 0;
  let logsScanned: string[] = [];

  if (fs.existsSync(commandLogDir)) {
    try {
      const files = fs.readdirSync(commandLogDir).filter(f => f.startsWith('command_log_') && f.endsWith('.md'));
      for (const file of files) {
        logsScanned.push(file);
        const filePath = path.join(commandLogDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Match attempts
        const attempts = content.split('## [').length - 1;
        totalCommandAttempts += attempts;

        // Match blocked alias attempts
        const blockedMatches = content.match(/Result Status:\s*`Blocked: Alias Used for Exact Name`/g);
        if (blockedMatches) {
          blockedAliasesCount += blockedMatches.length;
        }

        // Match successes
        const successMatches = content.match(/Result Status:\s*`Success`/g);
        if (successMatches) {
          successAttempts += successMatches.length;
        }
      }
    } catch (e) {
      console.warn(`[Adaptive Loop Warning] Failed to scan command logs: ${(e as Error).message}`);
    }
  }

  // Scan for stale outputs in outputs/notebooklm_bridge
  let staleOutputsCount = 0;
  const bridgeDir = inputDirectories.notebooklmBridge;
  if (fs.existsSync(bridgeDir)) {
    try {
      const walk = (dir: string) => {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            walk(filePath);
          } else {
            const ageInMs = Date.now() - stat.mtimeMs;
            if (ageInMs > 24 * 60 * 60 * 1000) {
              staleOutputsCount++;
            }
          }
        });
      };
      walk(bridgeDir);
    } catch (e) {
      // Ignore
    }
  }

  // Check for missing folders
  const missingFolders: string[] = [];
  const requiredFolders = [
    { name: 'reports/knowledge_harvest', path: path.join(REPO_ROOT, 'reports', 'knowledge_harvest') },
    { name: 'outputs/knowledge_harvest', path: inputDirectories.knowledgeHarvest },
    { name: 'reports/sentinel_safety', path: inputDirectories.reportsSentinelSafety }
  ];

  requiredFolders.forEach(folder => {
    if (!fs.existsSync(folder.path)) {
      missingFolders.push(folder.name);
    }
  });

  // Construct real findings
  const signalId = 'AL-2026-06-01-REAL';
  const signalName = 'Command Alias Collision and Stale Folder Inventory';
  
  let observedPattern = `Detected ${blockedAliasesCount} blocked command alias violations across ${totalCommandAttempts} attempts in ${logsScanned.length} scanned log files. `;
  observedPattern += `Found ${staleOutputsCount} files older than 24 hours under outputs/notebooklm_bridge/. `;
  observedPattern += `Discovered ${missingFolders.length} missing system folders: [${missingFolders.join(', ')}].`;

  const lesson = 'Command exactName restrictions effectively isolate execution paths but require operator awareness of exact names. Stale output counts indicate a need for cleanup checks.';
  const systemAdjustmentSuggestion = 'Maintain exact-name restrictions. Provide fallback CLI prompts when aliases are blocked to guide operator execution.';
  
  let evidenceSource = '';
  let evidenceStatus = '';
  let confidenceScore = 1;
  let impact = '';
  let suggestedNextAction = '';

  if (logsScanned.length > 0) {
    evidenceSource = `outputs/command_logs/ [Scanned: ${logsScanned.join(', ')}]`;
    evidenceStatus = 'available';
    confidenceScore = 9;
    impact = 'Alias blocks prevent execution velocity but guarantee security boundary enforcement.';
    suggestedNextAction = 'Document whitelisted exact command names in the console help menu.';
  } else {
    // Missing format
    evidenceSource = 'outputs/command_logs/';
    evidenceStatus = 'missing';
    confidenceScore = 1;
    impact = 'No execution logs available to audit routine outcomes or check for command drift.';
    suggestedNextAction = 'Execute at least one Command Router script using npm run command to initialize log files.';
  }

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'grinders-keep-adaptive-learning-template.md');
  let templateContent = '';
  if (fs.existsSync(templatePath)) {
    templateContent = fs.readFileSync(templatePath, 'utf-8');
  }

  let outputContent = '';
  if (evidenceStatus === 'missing') {
    outputContent = `# 🔁 Adaptive Learning Loop Signal: Missing Execution Logs

- **Signal ID:** ${signalId}
- **Signal Name:** Missing Command Log Repository
- **Evidence Source:** ${evidenceSource}
- **Evidence Status:**
* source_status: missing
* evidence_status: unavailable
* confidence_score_1_to_10: 1
* impact: ${impact}
* suggested_next_action: ${suggestedNextAction}
- **Observed Pattern:** No local command execution logs detected under outputs/command_logs/.
- **Lesson:** System metrics cannot be computed without operational run data.
- **System Adjustment Suggestion:** Ensure Command Router appends output logs on child process termination.
- **Commander Action:** Run any pre-approved script to generate logs.
- **Confidence Score (1-10):** 1
- **Commander Approval Required:** true`;
  } else {
    outputContent = templateContent
      .replace(/{{signal_id}}/g, signalId)
      .replace(/{{signal_name}}/g, signalName)
      .replace(/{{evidence_source}}/g, evidenceSource)
      .replace(/{{evidence_status}}/g, evidenceStatus)
      .replace(/{{observed_pattern}}/g, observedPattern)
      .replace(/{{lesson}}/g, lesson)
      .replace(/{{system_adjustment_suggestion}}/g, systemAdjustmentSuggestion)
      .replace(/{{commander_action}}/g, suggestedNextAction)
      .replace(/{{confidence_score_1_to_10}}/g, String(confidenceScore))
      .replace(/{{commander_approval_required}}/g, 'true');
  }

  // Ensure output directory exists
  fs.mkdirSync(outputDirectories.adaptiveLearning, { recursive: true });
  const outputFile = path.join(outputDirectories.adaptiveLearning, `grinders_keep_adaptive_loop_${dateStr}.md`);
  fs.writeFileSync(outputFile, outputContent, 'utf-8');

  console.log(`✅ Saved adaptive learning output to: ${outputFile}`);
  await announceCompletion("Adaptive learning loop execution complete", "10");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAdaptiveLoop().catch(err => {
    console.error(`❌ Error in Adaptive Loop: ${err}`);
    process.exit(1);
  });
}
