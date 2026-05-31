import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_MCP_QUERY_EXECUTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_OBSIDIAN_WRITE,
  DETECTION_ONLY,
  REQUIRE_MANUAL_ENABLE,
  candidatePaths,
  candidateConnectorNames,
  outputFolders,
  REPO_ROOT
} from '../config/notebooklm-mcp-detection.js';
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

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath)) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    targetPath = path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  const logDir = outputFolders.logs;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `detection_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function scanFile(filePath: string): { connectorFound: boolean; matchedNames: string[]; content: string } {
  if (!fs.existsSync(filePath)) {
    return { connectorFound: false, matchedNames: [], content: '' };
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matchedNames: string[] = [];
    for (const name of candidateConnectorNames) {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(content)) {
        matchedNames.push(name);
      }
    }
    return {
      connectorFound: matchedNames.length > 0,
      matchedNames,
      content
    };
  } catch (err) {
    return { connectorFound: false, matchedNames: [], content: '' };
  }
}

// 1. Scan Local Configuration Files
async function handleScan() {
  console.log("🔍 Scanning local environment for NotebookLM MCP setup...");
  await announceIntent("Scanning candidate configurations for local NotebookLM MCP setup.");

  const filesChecked: string[] = [];
  const connectorReferencesFound: string[] = [];
  const launchCommandsFound: string[] = [];
  const envVarsFound: string[] = [];
  const packageScriptsFound: string[] = [];

  let matchPathsCount = 0;
  let hasLaunchCommand = false;
  let hasSystemConfig = false;

  for (const entry of candidatePaths) {
    const targetPath = entry.path;
    const resolvedPath = path.relative(REPO_ROOT, targetPath).startsWith('..') ? targetPath : path.relative(REPO_ROOT, targetPath);

    if (entry.type === 'file') {
      if (!fs.existsSync(targetPath)) {
        filesChecked.push(`- [Not Found] ${resolvedPath}`);
        continue;
      }
      filesChecked.push(`- [Checked] ${resolvedPath}`);
      const scanResult = scanFile(targetPath);

      if (scanResult.connectorFound) {
        matchPathsCount++;
        scanResult.matchedNames.forEach(n => {
          if (!connectorReferencesFound.includes(n)) connectorReferencesFound.push(n);
        });

        // Search for env variables
        const envMatches = scanResult.content.match(/\b(NOTEBOOKLM_[A-Z0-9_]+|GOOGLE_[A-Z0-9_]+|GEMINI_[A-Z0-9_]+)\b/g);
        if (envMatches) {
          envMatches.forEach(env => {
            if (!envVarsFound.includes(env)) envVarsFound.push(env);
          });
        }

        // Specific file parsing for launch commands
        if (path.basename(targetPath) === 'package.json') {
          try {
            const pkg = JSON.parse(scanResult.content);
            if (pkg.scripts) {
              for (const [key, val] of Object.entries(pkg.scripts)) {
                if (typeof val === 'string' && candidateConnectorNames.some(name => key.includes(name) || val.includes(name))) {
                  packageScriptsFound.push(`- \`npm run ${key}\`: "${val}"`);
                  launchCommandsFound.push(`npm run ${key}`);
                  hasLaunchCommand = true;
                }
              }
            }
          } catch (_) {}
        } else if (path.basename(targetPath) === 'Taskfile.yml') {
          const lines = scanResult.content.split('\n');
          for (const line of lines) {
            if (candidateConnectorNames.some(name => line.toLowerCase().includes(name))) {
              launchCommandsFound.push(line.trim());
              hasLaunchCommand = true;
            }
          }
        } else {
          // General JSON files check for mcp configurations
          try {
            const mcpConfig = JSON.parse(scanResult.content);
            // Search command properties
            if (mcpConfig.mcpServers) {
              for (const [serverName, serverVal] of Object.entries(mcpConfig.mcpServers)) {
                if (candidateConnectorNames.some(name => serverName.toLowerCase().includes(name))) {
                  const cmdObj = serverVal as any;
                  if (cmdObj && cmdObj.command) {
                    const argsStr = cmdObj.args ? ` ${cmdObj.args.join(' ')}` : '';
                    launchCommandsFound.push(`${cmdObj.command}${argsStr}`);
                    hasLaunchCommand = true;
                  }
                }
              }
            }
          } catch (_) {}
        }

        if (targetPath.includes('.config') || targetPath.includes('.claude') || targetPath.includes('.cursor')) {
          hasSystemConfig = true;
        }
      }
    } else if (entry.type === 'directory') {
      if (!fs.existsSync(targetPath)) {
        filesChecked.push(`- [Not Found] Directory: ${resolvedPath}`);
        continue;
      }
      filesChecked.push(`- [Checked] Directory: ${resolvedPath}`);
      try {
        const files = fs.readdirSync(targetPath);
        for (const file of files) {
          const subPath = path.join(targetPath, file);
          const subResolvedPath = path.relative(REPO_ROOT, subPath).startsWith('..') ? subPath : path.relative(REPO_ROOT, subPath);
          filesChecked.push(`  - [Checked File] ${subResolvedPath}`);
          const scanResult = scanFile(subPath);

          if (scanResult.connectorFound) {
            matchPathsCount++;
            scanResult.matchedNames.forEach(n => {
              if (!connectorReferencesFound.includes(n)) connectorReferencesFound.push(n);
            });
            const envMatches = scanResult.content.match(/\b(NOTEBOOKLM_[A-Z0-9_]+|GOOGLE_[A-Z0-9_]+|GEMINI_[A-Z0-9_]+)\b/g);
            if (envMatches) {
              envMatches.forEach(env => {
                if (!envVarsFound.includes(env)) envVarsFound.push(env);
              });
            }
            try {
              const mcpConfig = JSON.parse(scanResult.content);
              if (mcpConfig.mcpServers) {
                for (const [serverName, serverVal] of Object.entries(mcpConfig.mcpServers)) {
                  if (candidateConnectorNames.some(name => serverName.toLowerCase().includes(name))) {
                    const cmdObj = serverVal as any;
                    if (cmdObj && cmdObj.command) {
                      const argsStr = cmdObj.args ? ` ${cmdObj.args.join(' ')}` : '';
                      launchCommandsFound.push(`${cmdObj.command}${argsStr}`);
                      hasLaunchCommand = true;
                    }
                  }
                }
              }
            } catch (_) {}
            hasSystemConfig = true;
          }
        }
      } catch (_) {}
    }
  }

  // Calculate confidence score
  let confidenceScore = 0;
  if (matchPathsCount > 0) {
    confidenceScore += 40;
    confidenceScore += Math.min(30, (matchPathsCount - 1) * 15);
    if (hasLaunchCommand) confidenceScore += 20;
    if (hasSystemConfig) confidenceScore += 10;
  }
  confidenceScore = Math.min(100, confidenceScore);

  // Safety Warnings
  const safetyWarnings = [
    "- **DANGER:** Direct NotebookLM MCP execution is currently disabled (`ALLOW_MCP_QUERY_EXECUTION: false`). Do not force execution.",
    "- **SECURITY:** External network calls and query API endpoints are disabled. Scans are entirely offline.",
    "- **INTEGRITY:** Tested configurations must not be written to or modified by this script."
  ].join('\n');

  // Next action recommendation
  let nextAction = "Setup a NotebookLM MCP Server mapping in `mcp.json` or `.mcp.json` to begin integration.";
  if (confidenceScore > 0) {
    nextAction = "Generate a detailed capabilities report using `npm run notebooklm-mcp-detect -- \"capability-report\"` to outline adapter specifications.";
  }

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_detection', 'detection-report-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DETECTION_DATE\}\}/g, getFormattedDate())
    .replace(/\{\{CONFIDENCE_SCORE\}\}/g, String(confidenceScore))
    .replace(/\{\{FILES_CHECKED\}\}/g, filesChecked.join('\n'))
    .replace(/\{\{CONNECTOR_REFERENCES_FOUND\}\}/g, connectorReferencesFound.length > 0 ? connectorReferencesFound.map(n => `- \`${n}\``).join('\n') : "None")
    .replace(/\{\{LAUNCH_COMMANDS_FOUND\}\}/g, launchCommandsFound.length > 0 ? launchCommandsFound.map(cmd => `- \`${cmd}\``).join('\n') : "None")
    .replace(/\{\{ENVIRONMENT_VARIABLES\}\}/g, envVarsFound.length > 0 ? envVarsFound.map(env => `- \`${env}\``).join('\n') : "None")
    .replace(/\{\{SAFETY_WARNINGS\}\}/g, safetyWarnings)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_detection_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Scan finished. Reports written to ${path.basename(safePath)}. Confidence score: ${confidenceScore}%.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('SCAN', detailMsg);

  await announceCompletion(`Local NotebookLM MCP configurations scanned. Detection confidence: ${confidenceScore}%.`, String(Math.round(confidenceScore / 10)));
}

// 2. Status Output
async function handleStatus() {
  console.log("=========================================");
  console.log("🔍 NOTEBOOKLM MCP DETECTION STATUS");
  console.log("=========================================");

  let reportExists = false;
  let latestReportFile = '';
  if (fs.existsSync(outputFolders.reports)) {
    const files = fs.readdirSync(outputFolders.reports)
      .filter(f => f.startsWith('notebooklm_mcp_detection_') && f.endsWith('.md'))
      .sort();
    if (files.length > 0) {
      reportExists = true;
      latestReportFile = files[files.length - 1];
    }
  }

  let connectorFound = false;
  let confidenceScore = 0;
  if (reportExists && latestReportFile) {
    const reportContent = fs.readFileSync(path.join(outputFolders.reports, latestReportFile), 'utf-8');
    const scoreMatch = reportContent.match(/Confidence Score[:\*]*\s*(\d+)/i);
    if (scoreMatch) {
      confidenceScore = parseInt(scoreMatch[1], 10);
      if (confidenceScore > 0) {
        connectorFound = true;
      }
    }
  }

  console.log(`- **Detection Report Exists:** ${reportExists ? `Yes (${latestReportFile})` : 'No'}`);
  console.log(`- **Connector Found:** ${connectorFound ? 'Yes' : 'No'}`);
  console.log(`- **Confidence Score:** ${confidenceScore}%`);
  console.log(`- **External API Disabled:** ${!ALLOW_EXTERNAL_API_CALLS ? 'Yes' : 'No'}`);
  console.log(`- **MCP Query Execution Disabled:** ${!ALLOW_MCP_QUERY_EXECUTION ? 'Yes' : 'No'}`);
  console.log(`- **Obsidian Write Disabled:** ${!ALLOW_OBSIDIAN_WRITE ? 'Yes' : 'No'}`);

  let nextAction = "Run scan check using `npm run notebooklm-mcp-detect -- \"scan\"` to inspect configuration profiles.";
  if (reportExists && connectorFound) {
    nextAction = "Inspect capabilities with `npm run notebooklm-mcp-detect -- \"capability-report\"`";
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");

  logEvent('STATUS', `Status checked. reportExists=${reportExists}, connectorFound=${connectorFound}, score=${confidenceScore}`);
}

// 3. Compile Capability Report
async function handleCapabilityReport() {
  console.log("🧠 Compiling NotebookLM MCP Capabilities report...");
  await announceIntent("Compiling local capability analysis report for NotebookLM MCP.");

  let detectedConnector = "Unknown/None";
  let detectedLocation = "None";

  // Attempt to extract latest scan data
  if (fs.existsSync(outputFolders.reports)) {
    const files = fs.readdirSync(outputFolders.reports)
      .filter(f => f.startsWith('notebooklm_mcp_detection_') && f.endsWith('.md'))
      .sort();
    if (files.length > 0) {
      const latestReport = files[files.length - 1];
      const reportContent = fs.readFileSync(path.join(outputFolders.reports, latestReport), 'utf-8');
      
      const refsMatch = reportContent.match(/Connector References Found\s*([\s\S]*?)\s*##/);
      if (refsMatch && refsMatch[1]) {
        const refs = refsMatch[1].trim().split('\n').filter(Boolean).map(r => r.replace(/^-\s*/, '').replace(/`/g, ''));
        if (refs.length > 0 && refs[0] !== 'None') {
          detectedConnector = refs.join(', ');
        }
      }

      const filesMatch = reportContent.match(/Files Checked\s*([\s\S]*?)\s*##/);
      if (filesMatch && filesMatch[1]) {
        const paths = filesMatch[1].trim().split('\n').filter(p => p.includes('[Checked]')).map(p => p.replace(/^- \[Checked\]\s*/, ''));
        if (paths.length > 0) {
          detectedLocation = paths.join(', ');
        }
      }
    }
  }

  const possibleCapabilities = [
    "- **Offline Config Read:** Safe mapping discovery and directory scans.",
    "- **Manual Staging Ingest:** Read query files and map local copy-pasted results.",
    "- **Command Execution Validation:** Safe command format checks without triggering calls."
  ].join('\n');

  const unknownCapabilities = [
    "- **Interactive Prompting:** Web-based prompt generation constraints.",
    "- **Real-time Query Resolution:** NotebookLM does not provide an official API, meaning capabilities depend entirely on custom MCP scrapers or local automation engines."
  ].join('\n');

  const requiredSetup = [
    "- Register MCP Server within Cursor or Claude Desktop app config.",
    "- Verify the correct Node version mapping to run execution CLI scripts.",
    "- Ensure appropriate access tokens or API keys are placed in system profile configurations."
  ].join('\n');

  const risks = [
    "- **Resource Collision:** Writing directly to active Obsidian vault directories could cause synchronizer conflicts.",
    "- **Execution Leak:** A malicious answer file could injection scripts if parsed directly by the command router without sandboxing."
  ].join('\n');

  const safeActivationRequirements = [
    "- Config `ALLOW_MCP_QUERY_EXECUTION` must be manually enabled by the user.",
    "- Clear signature verification step before parsing or outputting data profiles."
  ].join('\n');

  const recommendedNextPhase = [
    "- **Phase 11D:** Establish the NotebookLM MCP Adapter executing secure local calls in dry-run mode, matching verified connector properties with zero-auth simulation."
  ].join('\n');

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'mcp_detection', 'capability-report-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{CONNECTOR_NAME\}\}/g, detectedConnector)
    .replace(/\{\{DETECTED_LOCATION\}\}/g, detectedLocation)
    .replace(/\{\{DATE_COMPILED\}\}/g, getFormattedDate())
    .replace(/\{\{POSSIBLE_CAPABILITIES\}\}/g, possibleCapabilities)
    .replace(/\{\{UNKNOWN_CAPABILITIES\}\}/g, unknownCapabilities)
    .replace(/\{\{REQUIRED_SETUP\}\}/g, requiredSetup)
    .replace(/\{\{RISKS\}\}/g, risks)
    .replace(/\{\{SAFE_ACTIVATION_REQUIREMENTS\}\}/g, safeActivationRequirements)
    .replace(/\{\{RECOMMENDED_NEXT_PHASE\}\}/g, recommendedNextPhase);

  const safePath = getSafeWritePath(outputFolders.reports, `notebooklm_mcp_capabilities_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const detailMsg = `Capability report written to ${path.basename(safePath)}.`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CAPABILITY_REPORT', detailMsg);

  await announceCompletion("NotebookLM MCP capability report compiled successfully.", "10");
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  const command = rawInput.trim();

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-mcp-detect-help.js');
    await import(helpPath);
    return;
  }

  // Hard safety boundaries checks
  if (ALLOW_MCP_QUERY_EXECUTION) {
    console.error("❌ Error: ALLOW_MCP_QUERY_EXECUTION must remain disabled in detection phase.");
    process.exit(1);
  }
  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Error: ALLOW_EXTERNAL_API_CALLS must remain disabled in detection phase.");
    process.exit(1);
  }
  if (ALLOW_OBSIDIAN_WRITE) {
    console.error("❌ Error: ALLOW_OBSIDIAN_WRITE must remain disabled in detection phase.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'scan':
        await handleScan();
        break;
      case 'status':
        await handleStatus();
        break;
      case 'capability-report':
        await handleCapabilityReport();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-mcp-detect-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Operation failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal runtime error: ${err}`);
  process.exit(1);
});
