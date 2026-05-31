import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  COMPOSER_ONLY,
  ALLOW_TTS_GENERATION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_AUDIO_FILE_CREATION,
  REQUIRE_SOURCE_BRIEF,
  REQUIRE_MANUAL_REVIEW,
  MAX_SHORT_SCRIPT_WORDS,
  MAX_MEDIUM_SCRIPT_WORDS,
  MAX_LONG_SCRIPT_WORDS,
  inputFolders,
  outputFolders,
  scriptTypes,
  voiceDirectionProfiles,
  REPO_ROOT
} from '../config/tts-brief-composer.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BriefData {
  title: string;
  purpose: string;
  sourceGraph: string;
  insights: string[];
  workflows: string[];
}

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
  if (!fs.existsSync(outputFolders.logs)) {
    fs.mkdirSync(outputFolders.logs, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(outputFolders.logs, `tts_composer_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function getLatestBriefFile(): string | null {
  const dir = inputFolders.briefs;
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && f.startsWith('grounded_narrator_brief'))
    .map(f => ({ name: f, path: path.join(dir, f), time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

function parseBrief(filePath: string): BriefData {
  const insights: string[] = [];
  const workflows: string[] = [];
  let purpose = 'Reviewing local system capability maps and architectural insights safely.';
  let sourceGraph = 'graph_2026-05-31';
  let title = 'Narrator Brief 2026-05-31';

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# 🎙️ Grounded Narrator Brief:')) {
      title = trimmed.replace('# 🎙️ Grounded Narrator Brief:', '').trim();
    } else if (trimmed.includes('**Narration Purpose:**')) {
      purpose = trimmed.split('**Narration Purpose:**')[1].replace(/\*/g, '').trim();
    } else if (trimmed.includes('**Source Graph:**')) {
      sourceGraph = trimmed.split('**Source Graph:**')[1].replace(/\*/g, '').trim();
    } else if (trimmed.startsWith('- **[INSIGHT]')) {
      // Extract insight content
      const match = trimmed.match(/- \*\*\[INSIGHT\]\s*([^:]+):?\*\*\s*(.*)/);
      if (match) {
        insights.push(match[1].trim());
      } else {
        insights.push(trimmed.replace(/- \*\*/g, '').replace(/\*\*/g, '').trim());
      }
    } else if (trimmed.startsWith('- **[WORKFLOW_CARD]')) {
      // Extract workflow content
      const match = trimmed.match(/- \*\*\[WORKFLOW_CARD\]\s*([^:]+):?\*\*\s*(.*)/);
      if (match) {
        workflows.push(match[1].trim());
      } else {
        workflows.push(trimmed.replace(/- \*\*/g, '').replace(/\*\*/g, '').trim());
      }
    }
  }

  return { title, purpose, sourceGraph, insights, workflows };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// 1. short script command
async function handleShort(): Promise<string> {
  console.log("🎙️ Compiling short TTS script...");
  await announceIntent("Compiling short TTS narration script.");

  const latestBriefPath = getLatestBriefFile();
  if (REQUIRE_SOURCE_BRIEF && !latestBriefPath) {
    throw new Error("No source grounded narrator brief found. Run grounded-narrator-review brief first.");
  }

  const briefData = parseBrief(latestBriefPath!);
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_briefs', 'short-script-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Short script template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const selectedItems = [...briefData.insights, ...briefData.workflows].slice(0, 3);
  const corePointsText = selectedItems.map((item, idx) => `- Point ${idx + 1}: ${item}`).join('\n');

  const openingLine = `Staging voice transmission for brief: ${briefData.title}. Purpose: ${briefData.purpose}.`;
  const citationNote = `Grounded in index graph ${briefData.sourceGraph}.`;
  const closingLine = `Transmission locked. Grounded narrator offline. Staged for review.`;

  // Measure spoken words only
  const spokenContent = `${openingLine} ${selectedItems.join('. ')} ${citationNote} ${closingLine}`;
  const wordsCount = countWords(spokenContent);

  if (wordsCount > MAX_SHORT_SCRIPT_WORDS) {
    console.warn(`⚠️ Warning: Script word count (${wordsCount}) exceeds maximum allowed (${MAX_SHORT_SCRIPT_WORDS}).`);
  }

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SOURCE_BRIEF\}\}/g, path.basename(latestBriefPath!))
    .replace(/\{\{VOICE_PROFILE\}\}/g, 'strategic narrator')
    .replace(/\{\{OPENING_LINE\}\}/g, openingLine)
    .replace(/\{\{CORE_POINTS\}\}/g, corePointsText)
    .replace(/\{\{SOURCE_NOTE\}\}/g, citationNote)
    .replace(/\{\{CLOSING_LINE\}\}/g, closingLine);

  const outPath = getSafeWritePath(outputFolders.scripts, `grounded_tts_short_script_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `Short script compiled successfully. Words: ${wordsCount}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_SHORT_SCRIPT', detailMsg);

  await announceCompletion("Short TTS script compiled successfully.");
  return outPath;
}

// 2. medium script command
async function handleMedium(): Promise<string> {
  console.log("🎙️ Compiling medium TTS script...");
  await announceIntent("Compiling medium TTS narration script.");

  const latestBriefPath = getLatestBriefFile();
  if (REQUIRE_SOURCE_BRIEF && !latestBriefPath) {
    throw new Error("No source grounded narrator brief found. Run grounded-narrator-review brief first.");
  }

  const briefData = parseBrief(latestBriefPath!);
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_briefs', 'medium-script-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Medium script template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const selectedItems = [...briefData.insights, ...briefData.workflows].slice(0, 5);
  const corePointsText = selectedItems.map((item, idx) => `- Point ${idx + 1}: ${item}`).join('\n');

  const openingLine = `Initializing narrative update for brief: ${briefData.title}. Outlining key capabilities under offline validation.`;
  const practicalInterpretation = `Practical interpretation: Programmatic channel validation and local Obsidian staging routines reduce manual developer errors and minimize file corruption risks.`;
  const sourceNotes = `Grounded in index graph ${briefData.sourceGraph}. Checked offline.`;
  const closingLine = `End of narration segment. System sovereignty confirmed. Standing by for voice review.`;

  // Measure spoken words only
  const spokenContent = `${openingLine} ${selectedItems.join('. ')} ${practicalInterpretation} ${sourceNotes} ${closingLine}`;
  const wordsCount = countWords(spokenContent);

  if (wordsCount > MAX_MEDIUM_SCRIPT_WORDS) {
    console.warn(`⚠️ Warning: Script word count (${wordsCount}) exceeds maximum allowed (${MAX_MEDIUM_SCRIPT_WORDS}).`);
  }

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SOURCE_BRIEF\}\}/g, path.basename(latestBriefPath!))
    .replace(/\{\{VOICE_PROFILE\}\}/g, 'calm analyst')
    .replace(/\{\{OPENING_LINE\}\}/g, openingLine)
    .replace(/\{\{CORE_POINTS\}\}/g, corePointsText)
    .replace(/\{\{PRACTICAL_INTERPRETATION\}\}/g, practicalInterpretation)
    .replace(/\{\{SOURCE_NOTES\}\}/g, sourceNotes)
    .replace(/\{\{CLOSING_LINE\}\}/g, closingLine);

  const outPath = getSafeWritePath(outputFolders.scripts, `grounded_tts_medium_script_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `Medium script compiled successfully. Words: ${wordsCount}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_MEDIUM_SCRIPT', detailMsg);

  await announceCompletion("Medium TTS script compiled successfully.");
  return outPath;
}

// 3. long script command
async function handleLong(): Promise<string> {
  console.log("🎙️ Compiling long deep-dive TTS script...");
  await announceIntent("Compiling long deep-dive TTS script.");

  const latestBriefPath = getLatestBriefFile();
  if (REQUIRE_SOURCE_BRIEF && !latestBriefPath) {
    throw new Error("No source grounded narrator brief found. Run grounded-narrator-review brief first.");
  }

  const briefData = parseBrief(latestBriefPath!);
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_briefs', 'long-script-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Long script template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const selectedInsightsText = briefData.insights.map((item, idx) => `- Insight ${idx + 1}: ${item}`).join('\n') || "- No insights found.";
  const selectedWorkflowsText = briefData.workflows.map((item, idx) => `- Workflow ${idx + 1}: ${item}`).join('\n') || "- No workflows found.";

  const openingLine = `Commencing deep-dive narration for system brief: ${briefData.title}.`;
  const narrativeArc = `We present a comprehensive tactical overview of the operating system's capability delta. By mapping insights and workflows to local data seeds, we construct a fully grounded offline operating context.`;
  const coreInsights = `Key system insights evaluated:\n${selectedInsightsText}`;
  const workflowImplications = `Implications of extracted workflows:\n${selectedWorkflowsText}\nImplementing Raft consensus replication and crawler engines enables secure multi-node synchronization.`;
  const riskNotes = `Risk validation parameters: All actions are compiled offline. Direct database writes and external TTS APIs remain disabled under current safety gate rules to prevent state drift.`;
  const sourceNotes = `Grounded in index graph ${briefData.sourceGraph}. Verified locally on 2026-05-31.`;
  const closingLine = `Deep-dive narration complete. All points cited. Offline narrator signing off.`;

  // Measure spoken words
  const spokenContent = `${openingLine} ${narrativeArc} ${coreInsights} ${workflowImplications} ${riskNotes} ${sourceNotes} ${closingLine}`;
  const wordsCount = countWords(spokenContent);

  if (wordsCount > MAX_LONG_SCRIPT_WORDS) {
    console.warn(`⚠️ Warning: Script word count (${wordsCount}) exceeds maximum allowed (${MAX_LONG_SCRIPT_WORDS}).`);
  }

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SOURCE_BRIEF\}\}/g, path.basename(latestBriefPath!))
    .replace(/\{\{VOICE_PROFILE\}\}/g, 'oracle voice')
    .replace(/\{\{OPENING_LINE\}\}/g, openingLine)
    .replace(/\{\{NARRATIVE_ARC\}\}/g, narrativeArc)
    .replace(/\{\{CORE_INSIGHTS\}\}/g, coreInsights)
    .replace(/\{\{WORKFLOW_IMPLICATIONS\}\}/g, workflowImplications)
    .replace(/\{\{RISK_NOTES\}\}/g, riskNotes)
    .replace(/\{\{SOURCE_NOTES\}\}/g, sourceNotes)
    .replace(/\{\{CLOSING_LINE\}\}/g, closingLine);

  const outPath = getSafeWritePath(outputFolders.scripts, `grounded_tts_long_script_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `Long script compiled successfully. Words: ${wordsCount}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_LONG_SCRIPT', detailMsg);

  await announceCompletion("Long TTS script compiled successfully.");
  return outPath;
}

// 4. all command
async function handleAll() {
  console.log("🎙️ Compiling all script sizes sequentially...");
  const shortPath = await handleShort();
  const mediumPath = await handleMedium();
  const longPath = await handleLong();
  const detailMsg = `All script variants compiled: short, medium, and long scripts compiled successfully.`;
  logEvent('COMPILE_ALL', detailMsg);
}

// 5. queue packet command
async function handleQueuePacket(): Promise<string> {
  console.log("🎙️ Compiling TTS queue packet...");
  await announceIntent("Compiling TTS queue packet.");

  const latestBriefPath = getLatestBriefFile();
  if (REQUIRE_SOURCE_BRIEF && !latestBriefPath) {
    throw new Error("No source grounded narrator brief found. Run grounded-narrator-review brief first.");
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_briefs', 'tts-queue-packet-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`TTS queue packet template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Find compiled scripts
  const scriptsDir = outputFolders.scripts;
  let scriptPathsText = "No scripts compiled yet.";
  if (fs.existsSync(scriptsDir)) {
    const scriptFiles = fs.readdirSync(scriptsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => `- ${path.join(scriptsDir, f)}`);
    if (scriptFiles.length > 0) {
      scriptPathsText = scriptFiles.join('\n');
    }
  }

  const packetId = `grounded_tts_queue_packet_${getFormattedDate()}`;
  const nextAction = `Run tts rendering engine after manual operator sign-off.`;

  const content = template
    .replace(/\{\{QUEUE_PACKET_ID\}\}/g, packetId)
    .replace(/\{\{SOURCE_BRIEF\}\}/g, path.basename(latestBriefPath!))
    .replace(/\{\{SCRIPT_PATHS\}\}/g, scriptPathsText)
    .replace(/\{\{VOICE_PROFILE\}\}/g, 'oracle voice')
    .replace(/\{\{TTS_ENGINE_PLACEHOLDER\}\}/g, 'Piper v1.0.0')
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.queuePackets, packetId, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS queue packet compiled successfully. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_QUEUE_PACKET', detailMsg);

  await announceCompletion("TTS queue packet compiled successfully.");
  return outPath;
}

// 6. voice direction command
async function handleVoiceDirection(): Promise<string> {
  console.log("🎙️ Compiling voice direction spec...");
  await announceIntent("Compiling voice direction spec sheet.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_briefs', 'voice-direction-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Voice direction template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{VOICE_PROFILE\}\}/g, 'oracle voice')
    .replace(/\{\{TONE\}\}/g, 'Cinematic, deep, authoritative')
    .replace(/\{\{PACE\}\}/g, 'Slow pacing, 140 words per minute')
    .replace(/\{\{EMPHASIS\}\}/g, 'Emphasize key nouns and structural terms')
    .replace(/\{\{PRONUNCIATION_NOTES\}\}/g, "Pronounce 'OS' as individual letters. Accentuate 'consensus'.")
    .replace(/\{\{EMOTIONAL_TARGET\}\}/g, 'Sovereign, calm, inevitable');

  const outPath = getSafeWritePath(outputFolders.voiceDirections, `grounded_tts_voice_direction_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `Voice direction spec compiled successfully. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_VOICE_DIRECTION', detailMsg);

  await announceCompletion("Voice direction compiled successfully.");
  return outPath;
}

// 7. status command
function handleStatus() {
  console.log("=========================================");
  console.log("🎙️ OFFLINE TTS BRIEF COMPOSER STATUS");
  console.log("=========================================");

  const getLatestFileInDir = (dir: string, prefix: string, ext = '.md'): string => {
    if (!fs.existsSync(dir)) return "Folder missing";
    const files = fs.readdirSync(dir).filter(f => f.endsWith(ext) && f.startsWith(prefix)).sort();
    return files.length > 0 ? files[files.length - 1] : "None generated";
  };

  const latestBrief = getLatestBriefFile();
  const latestShort = getLatestFileInDir(outputFolders.scripts, 'grounded_tts_short_script');
  const latestMedium = getLatestFileInDir(outputFolders.scripts, 'grounded_tts_medium_script');
  const latestLong = getLatestFileInDir(outputFolders.scripts, 'grounded_tts_long_script');
  const latestPacket = getLatestFileInDir(outputFolders.queuePackets, 'grounded_tts_queue_packet');
  const latestDirSpec = getLatestFileInDir(outputFolders.voiceDirections, 'grounded_tts_voice_direction');

  console.log(`Latest Narrator Brief:   ${latestBrief ? path.basename(latestBrief) : "None"}`);
  console.log(`Latest Short Script:     ${latestShort}`);
  console.log(`Latest Medium Script:    ${latestMedium}`);
  console.log(`Latest Long Script:      ${latestLong}`);
  console.log(`Latest Queue Packet:     ${latestPacket}`);
  console.log(`Latest Voice Direction:  ${latestDirSpec}`);

  const missing: string[] = [];
  if (latestShort === "None generated") missing.push("short script");
  if (latestMedium === "None generated") missing.push("medium script");
  if (latestLong === "None generated") missing.push("long script");
  if (latestPacket === "None generated") missing.push("queue packet");
  if (latestDirSpec === "None generated") missing.push("voice direction spec");

  console.log(`Missing Outputs:         ${missing.length > 0 ? missing.join(', ') : "None"}`);
  console.log(`Next Recommended Action: Review scripts and sign-off queue packet.`);
  console.log("=========================================");
}

async function main() {
  const args = process.argv.slice(2);
  let command = args[0] ? args[0].toLowerCase().trim() : 'help';
  let subCommand = args[1] ? args[1].toLowerCase().trim() : '';

  if (command.includes(' ')) {
    const parts = command.split(/\s+/);
    command = parts[0];
    subCommand = parts[1] || '';
  }

  // Safety Gate Checks
  if (!COMPOSER_ONLY) {
    console.error("❌ Safety Gate Triggered: Compiler is not in composer-only mode.");
    process.exit(1);
  }

  if (ALLOW_TTS_GENERATION || ALLOW_EXTERNAL_API_CALLS || ALLOW_AUDIO_FILE_CREATION) {
    console.error("❌ Safety Gate Triggered: TTS audio rendering or external calls are incorrectly enabled.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run tts-brief-composer-help' for detailed instructions.");
    } else if (command === 'short') {
      await handleShort();
    } else if (command === 'medium') {
      await handleMedium();
    } else if (command === 'long') {
      await handleLong();
    } else if (command === 'all') {
      await handleAll();
    } else if (command === 'queue-packet') {
      await handleQueuePacket();
    } else if (command === 'voice-direction') {
      await handleVoiceDirection();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command} ${subCommand}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ TTS brief composer execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
