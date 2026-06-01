// scripts/offline-tts-dry-run-renderer.ts
// Offline TTS Dry-Run Renderer for Brilliantaire OS.
// Simulates offline TTS rendering lifecycle without generating audio files, calling Piper/say, or external APIs.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_TTS_AUDIO,
  ALLOW_EXTERNAL_API_CALLS,
  FAIL_CLOSED_ON_ERROR,
  DEFAULT_SPEECH_WPM,
  DEFAULT_MAX_CHUNK_WORDS,
  voiceProfileRoutes,
  inputFolders,
  outputFolders
} from '../config/offline-tts-dry-run-renderer.config.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string, forceOverwrite = false): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath) && !forceOverwrite) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    return path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  const logsDir = outputFolders.logs;
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logsDir, `dry_run_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// Locate the latest JSON manifest
function getLatestJSONFile(): string | null {
  const dir = path.join(inputFolders.ttsExport, 'json');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f.startsWith('tts_ready_narration_export_queue'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      time: fs.statSync(path.join(dir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

// Locate fallback markdown file
function getLatestMDFile(): string | null {
  const dir = path.join(inputFolders.ttsExport, 'markdown');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && f.startsWith('tts_ready_script_blocks'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      time: fs.statSync(path.join(dir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

interface ExportedBlockInput {
  export_id: string;
  block_id: string;
  node_id: string;
  source_file: string;
  narrator_text: string;
  approved_for_voice: boolean;
  citation_status: 'Grounded' | 'Weak' | 'Uncited';
  risk_level: 'Low' | 'Medium' | 'High';
  suggested_voice_tone: string;
  suggested_priority: string;
  estimated_word_count: number;
  estimated_duration_seconds: number;
  export_status: string;
  tts_generated: boolean;
}

function parseMarkdownFallback(content: string): ExportedBlockInput[] {
  const blocks: ExportedBlockInput[] = [];
  const sections = content.split(/###\s*🟢\s*Export Block:/g).slice(1);
  for (const sec of sections) {
    const lines = sec.split('\n');
    const headerMatch = lines[0].match(/^\s*`([^`]+)`\s*\(Block:\s*`([^`]+)`\)/);
    if (!headerMatch) continue;
    const export_id = headerMatch[1].trim();
    const block_id = headerMatch[2].trim();

    const nodeMatch = sec.match(/-\s+\*\*Source Node:\*\*\s+`([^`]+)`/);
    const node_id = nodeMatch ? nodeMatch[1].trim() : 'unknown';

    const sourceFileMatch = sec.match(/-\s+\*\*Source File:\*\*\s+`([^`]+)`/);
    const source_file = sourceFileMatch ? sourceFileMatch[1].trim() : 'unknown';

    const durationMatch = sec.match(/-\s+\*\*Estimated Duration:\*\*\s+`([^`]+)`/);
    const estimated_duration_seconds = durationMatch ? parseInt(durationMatch[1], 10) : 0;

    const wordCountMatch = sec.match(/-\s+\*\*Word Count:\*\*\s+`([^`]+)`/);
    const estimated_word_count = wordCountMatch ? parseInt(wordCountMatch[1], 10) : 0;

    const textMatch = sec.match(/>\s*"([^"]+)"/);
    const narrator_text = textMatch ? textMatch[1].trim() : '';

    blocks.push({
      export_id,
      block_id,
      node_id,
      source_file,
      narrator_text,
      approved_for_voice: true,
      citation_status: 'Grounded',
      risk_level: 'Low',
      suggested_voice_tone: 'authoritative / grounded',
      suggested_priority: 'Low',
      estimated_word_count,
      estimated_duration_seconds,
      export_status: 'staged_for_tts',
      tts_generated: false
    });
  }
  return blocks;
}

// Chunker based on sentence boundaries
function chunkNarratorText(text: string, maxWords: number): string[] {
  // Capture sentences ending with . ! ? or end of text
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+(?:\s+|$)/g) || [text];
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) continue;
    const words = cleanSentence.split(/\s+/).filter(Boolean);
    const wordsCount = words.length;

    if (currentWordCount + wordsCount > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [cleanSentence];
      currentWordCount = wordsCount;
    } else {
      currentChunk.push(cleanSentence);
      currentWordCount += wordsCount;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

interface SimulatedChunk {
  chunk_id: string;
  export_id: string;
  block_id: string;
  chunk_text: string;
  word_count: number;
  estimated_duration_seconds: number;
  voice_route: string;
  suggested_voice_tone: string;
  render_status: 'dry_run_only';
  audio_generated: false;
  tts_called: false;
  external_service_called: false;
  readiness_status: 'ready_for_tts_execution' | 'review_required';
  risk_flags: string;
  next_action: string;
}

interface RejectedSimulationBlock {
  block_id: string;
  export_id?: string;
  node_id?: string;
  source_file?: string;
  rejection_reason: string;
}

async function run() {
  const args = process.argv.slice(2);
  const isDryRunArg = args.includes('--dry-run') || args.includes('dry-run');

  console.log(`🛡️ Initializing Offline TTS Dry-Run Renderer...`);

  // Load latest input
  let importedBlocks: ExportedBlockInput[] = [];
  let inputSourceFile = '';

  const latestJSONPath = getLatestJSONFile();
  if (latestJSONPath) {
    console.log(`📂 Primary Input: Loading JSON Export Queue from ${path.basename(latestJSONPath)}`);
    try {
      const content = fs.readFileSync(latestJSONPath, 'utf-8');
      const parsed = JSON.parse(content);
      importedBlocks = parsed.exportedBlocks || [];
      inputSourceFile = path.basename(latestJSONPath);
    } catch (e) {
      console.error(`❌ Error parsing primary JSON file: ${(e as Error).message}`);
      if (FAIL_CLOSED_ON_ERROR) process.exit(1);
    }
  } else {
    console.log(`⚠️ Primary JSON file not found. Searching for fallback Markdown file...`);
    const latestMDPath = getLatestMDFile();
    if (latestMDPath) {
      console.log(`📂 Fallback Input: Loading script blocks from ${path.basename(latestMDPath)}`);
      try {
        const content = fs.readFileSync(latestMDPath, 'utf-8');
        importedBlocks = parseMarkdownFallback(content);
        inputSourceFile = path.basename(latestMDPath);
      } catch (e) {
        console.error(`❌ Error parsing fallback Markdown file: ${(e as Error).message}`);
        if (FAIL_CLOSED_ON_ERROR) process.exit(1);
      }
    } else {
      console.warn(`❌ Fail Closed: No export queue JSON or markdown fallback files found.`);
      if (FAIL_CLOSED_ON_ERROR) {
        process.exit(1);
      }
    }
  }

  // Set up output directories
  const mdDir = outputFolders.markdown;
  const repDir = outputFolders.reports;
  const jDir = outputFolders.json;
  const templateDir = outputFolders.templates;

  const getTemplate = (name: string): string => {
    const p = path.join(templateDir, name);
    if (!fs.existsSync(p)) {
      console.warn(`[Warning] Template ${name} not found. Returning empty template.`);
      return ``;
    }
    return fs.readFileSync(p, 'utf-8');
  };

  const planTpl = getTemplate('tts-dry-run-render-plan-template.md');
  const chunkTpl = getTemplate('tts-dry-run-chunk-template.md');
  const routeTpl = getTemplate('tts-dry-run-voice-route-template.md');
  const timingTpl = getTemplate('tts-dry-run-timing-template.md');
  const riskTpl = getTemplate('tts-dry-run-risk-template.md');
  const summaryTpl = getTemplate('tts-dry-run-summary-template.md');
  const nextActionsTpl = getTemplate('tts-dry-run-next-actions-template.md');

  const dateStr = getFormattedDate();
  const timestampStr = new Date().toISOString();

  const simulatedChunks: SimulatedChunk[] = [];
  const rejectedBlocks: RejectedSimulationBlock[] = [];

  let importedCount = importedBlocks.length;
  let acceptedCount = 0;
  let rejectedCount = 0;

  for (const block of importedBlocks) {
    const {
      export_id,
      block_id,
      node_id,
      source_file,
      narrator_text,
      approved_for_voice,
      citation_status,
      risk_level,
      suggested_voice_tone,
      suggested_priority,
      export_status,
      tts_generated
    } = block;

    // Strict filter and validation checks
    if (approved_for_voice !== true) {
      rejectedBlocks.push({ block_id, export_id, node_id, source_file, rejection_reason: 'Blocked: approved_for_voice is not true.' });
      rejectedCount++;
      continue;
    }

    if (export_status !== 'staged_for_tts') {
      rejectedBlocks.push({ block_id, export_id, node_id, source_file, rejection_reason: `Blocked: export_status is "${export_status}", not "staged_for_tts".` });
      rejectedCount++;
      continue;
    }

    if (tts_generated === true) {
      rejectedBlocks.push({ block_id, export_id, node_id, source_file, rejection_reason: 'Blocked: tts_generated is true.' });
      rejectedCount++;
      continue;
    }

    if (!narrator_text || !narrator_text.trim()) {
      rejectedBlocks.push({ block_id, export_id, node_id, source_file, rejection_reason: 'Blocked: narrator_text is missing or blank.' });
      rejectedCount++;
      continue;
    }

    if (!suggested_voice_tone || !suggested_voice_tone.trim()) {
      rejectedBlocks.push({ block_id, export_id, node_id, source_file, rejection_reason: 'Blocked: suggested_voice_tone is missing or blank.' });
      rejectedCount++;
      continue;
    }

    if (!source_file || !source_file.trim()) {
      rejectedBlocks.push({ block_id, export_id, node_id, source_file: 'missing', rejection_reason: 'Blocked: source_file parameter is missing.' });
      rejectedCount++;
      continue;
    }

    // Passed validations, now simulate TTS lifecycle
    acceptedCount++;
    const chunks = chunkNarratorText(narrator_text, DEFAULT_MAX_CHUNK_WORDS);

    // Map Voice Routing
    const normalizedTone = suggested_voice_tone.trim().toLowerCase();
    const voiceRoute = voiceProfileRoutes[normalizedTone] || 'voice_route_pending';
    const isVoiceRoutePending = voiceRoute === 'voice_route_pending';
    const reviewRequired = isVoiceRoutePending;

    // Calculate timing per chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkTextStr = chunks[i];
      const chunkWordCount = chunkTextStr.split(/\s+/).filter(Boolean).length;
      // timing = chunkWordCount / WPM * 60
      const chunkDuration = Math.max(1, Math.round((chunkWordCount / DEFAULT_SPEECH_WPM) * 60));

      const chunk_id = chunks.length > 1 ? `${export_id}_chunk_${i + 1}` : export_id;
      const readiness_status = reviewRequired ? 'review_required' : 'ready_for_tts_execution';
      const risk_flags = isVoiceRoutePending ? 'voice_route_pending' : 'none';
      const next_action = isVoiceRoutePending ? 'manual_voice_routing_review' : 'none';

      simulatedChunks.push({
        chunk_id,
        export_id,
        block_id,
        chunk_text: chunkTextStr,
        word_count: chunkWordCount,
        estimated_duration_seconds: chunkDuration,
        voice_route: voiceRoute,
        suggested_voice_tone,
        render_status: 'dry_run_only',
        audio_generated: false,
        tts_called: false,
        external_service_called: false,
        readiness_status,
        risk_flags,
        next_action
      });
    }
  }

  // Compile final outputs
  const chunksCount = simulatedChunks.length;
  const totalDuration = simulatedChunks.reduce((acc, curr) => acc + curr.estimated_duration_seconds, 0);

  // Markdown file generation
  let chunksMD = '';
  let routesMD = '';
  let timingMD = '';
  let riskMD = '';

  for (const chunk of simulatedChunks) {
    // Generate script chunks MD
    if (chunkTpl) {
      chunksMD += chunkTpl
        .replace(/{{CHUNK_ID}}/g, chunk.chunk_id)
        .replace(/{{BLOCK_ID}}/g, chunk.block_id)
        .replace(/{{EXPORT_ID}}/g, chunk.export_id)
        .replace(/{{WORD_COUNT}}/g, String(chunk.word_count))
        .replace(/{{ESTIMATED_DURATION}}/g, String(chunk.estimated_duration_seconds))
        .replace(/{{CHUNK_TEXT}}/g, chunk.chunk_text);
    }

    // Generate voice routes MD
    if (routeTpl) {
      routesMD += routeTpl
        .replace(/{{CHUNK_ID}}/g, chunk.chunk_id)
        .replace(/{{BLOCK_ID}}/g, chunk.block_id)
        .replace(/{{VOICE_ROUTE}}/g, chunk.voice_route)
        .replace(/{{SUGGESTED_TONE}}/g, chunk.suggested_voice_tone);
    }

    // Generate timings MD
    if (timingTpl) {
      timingMD += timingTpl
        .replace(/{{CHUNK_ID}}/g, chunk.chunk_id)
        .replace(/{{BLOCK_ID}}/g, chunk.block_id)
        .replace(/{{WORD_COUNT}}/g, String(chunk.word_count))
        .replace(/{{ESTIMATED_DURATION}}/g, String(chunk.estimated_duration_seconds));
    }

    // Generate risk review MD
    if (riskTpl) {
      // Find matching block
      const originBlock = importedBlocks.find(b => b.block_id === chunk.block_id);
      const citation_status = originBlock ? originBlock.citation_status : 'unknown';
      const risk_level = originBlock ? originBlock.risk_level : 'unknown';
      const reviewRequiredStr = chunk.readiness_status === 'review_required' ? 'true' : 'false';

      riskMD += riskTpl
        .replace(/{{CHUNK_ID}}/g, chunk.chunk_id)
        .replace(/{{BLOCK_ID}}/g, chunk.block_id)
        .replace(/{{CITATION_STATUS}}/g, citation_status)
        .replace(/{{RISK_LEVEL}}/g, risk_level)
        .replace(/{{REVIEW_REQUIRED}}/g, reviewRequiredStr)
        .replace(/{{RISK_FLAGS}}/g, chunk.risk_flags);
    }
  }

  // Handle empty state
  if (simulatedChunks.length === 0) {
    chunksMD = `*No render-ready blocks are available. Simulation generated 0 chunks.*\n`;
    routesMD = `*No voice routes simulated. Simulation generated 0 chunks.*\n`;
    timingMD = `*No timing estimations recorded. Simulation generated 0 chunks.*\n`;
    riskMD = `*No risks analyzed. Simulation generated 0 chunks.*\n`;
  }

  // Generate next actions checklist
  let nextActionsListStr = '';
  for (const rb of rejectedBlocks) {
    nextActionsListStr += `- [ ] Resolve block \`${rb.block_id}\` (Export ID: \`${rb.export_id || 'N/A'}\`): ${rb.rejection_reason}\n`;
  }
  // Also add voice pending next actions
  for (const chunk of simulatedChunks) {
    if (chunk.readiness_status === 'review_required') {
      nextActionsListStr += `- [ ] Map pending voice route for chunk \`${chunk.chunk_id}\` (Block: \`${chunk.block_id}\`, Tone: "${chunk.suggested_voice_tone}")\n`;
    }
  }
  if (!nextActionsListStr) {
    nextActionsListStr = '*All script blocks successfully simulated in dry-run render mode. No pending actions.*';
  }

  // Apply placeholders in main templates
  const compiledPlan = planTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{IMPORTED_COUNT}}/g, String(importedCount))
    .replace(/{{ACCEPTED_COUNT}}/g, String(acceptedCount))
    .replace(/{{CHUNKS_COUNT}}/g, String(chunksCount))
    .replace(/{{TOTAL_DURATION}}/g, String(totalDuration))
    .replace(/{{REJECTED_COUNT}}/g, String(rejectedCount));

  const compiledSummary = summaryTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{IMPORTED_COUNT}}/g, String(importedCount))
    .replace(/{{ACCEPTED_COUNT}}/g, String(acceptedCount))
    .replace(/{{REJECTED_COUNT}}/g, String(rejectedCount))
    .replace(/{{CHUNKS_COUNT}}/g, String(chunksCount))
    .replace(/{{TOTAL_DURATION}}/g, String(totalDuration));

  const compiledNextActions = nextActionsTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{NEXT_ACTIONS_LIST}}/g, nextActionsListStr);

  const planPath = getSafeWritePath(mdDir, `tts_dry_run_render_plan_${dateStr}`, '.md', true);
  const chunksPath = getSafeWritePath(mdDir, `tts_dry_run_script_chunks_${dateStr}`, '.md', true);
  const routesPath = getSafeWritePath(mdDir, `tts_dry_run_voice_routes_${dateStr}`, '.md', true);
  const timingPath = getSafeWritePath(mdDir, `tts_dry_run_timing_estimates_${dateStr}`, '.md', true);
  const riskPath = getSafeWritePath(mdDir, `tts_dry_run_risk_review_${dateStr}`, '.md', true);
  const nextActionsPath = getSafeWritePath(mdDir, `tts_dry_run_next_actions_${dateStr}`, '.md', true);
  const summaryPath = getSafeWritePath(repDir, `tts_dry_run_summary_${dateStr}`, '.md', true);
  const jsonPath = getSafeWritePath(jDir, `tts_dry_run_render_manifest_${dateStr}`, '.json', true);

  // Safety checks enforcement
  if (ALLOW_TTS_AUDIO) {
    console.error(`❌ Critical Sandbox Violation: ALLOW_TTS_AUDIO configuration is enabled! Dry-run renderer must fail closed.`);
    process.exit(1);
  }
  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error(`❌ Critical Sandbox Violation: ALLOW_EXTERNAL_API_CALLS configuration is enabled! Dry-run renderer must fail closed.`);
    process.exit(1);
  }

  // Write outputs
  fs.writeFileSync(planPath, compiledPlan);
  fs.writeFileSync(chunksPath, chunksMD);
  fs.writeFileSync(routesPath, routesMD);
  fs.writeFileSync(timingPath, timingMD);
  fs.writeFileSync(riskPath, riskMD);
  fs.writeFileSync(nextActionsPath, compiledNextActions);
  fs.writeFileSync(summaryPath, compiledSummary);

  const manifestJSON = {
    manifestId: `tts_dry_run_${dateStr}`,
    compiledAt: timestampStr,
    sourceExportQueue: inputSourceFile,
    counts: {
      imported: importedCount,
      accepted: acceptedCount,
      chunks: chunksCount,
      rejected: rejectedCount
    },
    timing: {
      defaultSpeechWPM: DEFAULT_SPEECH_WPM,
      totalDurationSeconds: totalDuration
    },
    simulatedChunks,
    rejectedBlocks
  };

  fs.writeFileSync(jsonPath, JSON.stringify(manifestJSON, null, 2));

  console.log(`✅ Dry-Run rendering simulation completed.`);
  console.log(`📂 Outputs generated:`);
  console.log(`   - Plan: ${planPath}`);
  console.log(`   - Chunks: ${chunksPath}`);
  console.log(`   - Routes: ${routesPath}`);
  console.log(`   - Timings: ${timingPath}`);
  console.log(`   - Risks: ${riskPath}`);
  console.log(`   - Actions: ${nextActionsPath}`);
  console.log(`   - Summary: ${summaryPath}`);
  console.log(`   - Manifest JSON: ${jsonPath}`);

  logEvent('Dry-Run Completed', `Imported: ${importedCount}, Accepted: ${acceptedCount}, Chunks: ${chunksCount}, Duration: ${totalDuration}s.`);

  // Speak completion VNP
  await announcePhrase("Signal clean. The streets don't lie, neither does the data.");
  await announceCompletion("Offline TTS Dry-Run rendering simulation completed", "10");
}

run().catch(err => {
  console.error(`❌ Fatal Error during dry-run simulation: ${err.message}`);
  process.exit(1);
});
