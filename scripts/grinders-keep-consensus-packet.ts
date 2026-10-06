import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { inputFiles, outputDirectories } from '../config/grinders-keep-core-brief-engine.js';
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

export async function runConsensusPacket() {
  const dateStr = getFormattedDate();
  console.log(`🤝 Running Grinders Keep Agent Consensus Staging Layer v0.1 for ${dateStr} (Real Data Mode)...`);
  await announceIntent("Staging consensus packet from real pending decisions");

  // Read a real pending design decision from NEXT_ACTIONS.md
  let pendingDecision = 'Transition mock Stripe events to live Webhook verification';
  if (fs.existsSync(inputFiles.nextActions)) {
    const nextActionsContent = fs.readFileSync(inputFiles.nextActions, 'utf-8');
    const lines = nextActionsContent.split('\n');
    const match = lines.find(line => line.includes('- [ ]') && (line.includes('Stripe') || line.includes('webhook') || line.includes('release')));
    if (match) {
      pendingDecision = match.replace(/-\s*\[\s*\]\s*/, '').trim();
    }
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'grinders-keep-consensus-packet-template.md');
  let templateContent = '';
  if (fs.existsSync(templatePath)) {
    templateContent = fs.readFileSync(templatePath, 'utf-8');
  }

  const topic = `Architectural execution for: "${pendingDecision}"`;
  const sourceContext = `Mapped from pending roadmap tasks list under NEXT_ACTIONS.md.`;
  const smallestUsefulVersion = 'A local JS test runner verifying mock signature headers without external HTTP servers.';
  
  const chatgptQuestion = 'How can we structure the signature verification array in Node to prevent timing attacks?';
  const geminiQuestion = 'What are the Google Cloud/Gemini-specific logging mechanisms that keep Stripe webhook failures visible in local telemetry?';
  const claudeQuestion = 'Design a strict TypeScript interface for signature validation payloads under strict local-first constraints.';
  const notebooklmQuestion = 'Summarize how previous local Stripe ledger Sync decisions (Phase 21) affect signature parsing workflows.';

  const scoringRubric = 'Score 1-5 on: (1) Safety Compliance, (2) Integration Simplicity, (3) Performance overhead.';
  const expectedAnswerFormat = 'JSON formatted snippet containing function, type safety rules, and validation checks.';
  const comparisonFields = 'Model, Safety Score, Code Size, Dependency Count';
  const decisionCriteria = 'Strictly 0 external npm dependencies; 100% compliance with local-first security boundaries.';

  let outputContent = '';
  if (templateContent) {
    outputContent = templateContent
      .replace(/{{topic}}/g, topic)
      .replace(/{{source_context}}/g, sourceContext)
      .replace(/{{smallest_useful_version}}/g, smallestUsefulVersion)
      .replace(/{{chatgpt_question}}/g, chatgptQuestion)
      .replace(/{{gemini_question}}/g, geminiQuestion)
      .replace(/{{claude_question}}/g, claudeQuestion)
      .replace(/{{notebooklm_question}}/g, notebooklmQuestion)
      .replace(/{{scoring_rubric}}/g, scoringRubric)
      .replace(/{{expected_answer_format}}/g, expectedAnswerFormat)
      .replace(/{{comparison_fields}}/g, comparisonFields)
      .replace(/{{decision_criteria}}/g, decisionCriteria)
      .replace(/{{commander_approval_required}}/g, 'true');
  } else {
    outputContent = `# 🤝 Agent Consensus Staging Packet: ${topic}\n...`;
  }

  // Ensure output directory exists
  fs.mkdirSync(outputDirectories.consensusPackets, { recursive: true });
  const outputFile = path.join(outputDirectories.consensusPackets, `grinders_keep_consensus_packet_${dateStr}.md`);
  fs.writeFileSync(outputFile, outputContent, 'utf-8');

  console.log(`✅ Saved consensus packet output to: ${outputFile}`);
  await announceCompletion("Consensus packet staging complete", "10");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runConsensusPacket().catch(err => {
    console.error(`❌ Error in Consensus Packet: ${err}`);
    process.exit(1);
  });
}
