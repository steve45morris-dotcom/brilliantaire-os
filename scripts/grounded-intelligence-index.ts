import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LOCAL_GRAPH_ONLY,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_VECTOR_DB_WRITE,
  ALLOW_OBSIDIAN_WRITE,
  REQUIRE_MANUAL_REVIEW,
  MAX_GRAPH_NODES,
  MAX_GRAPH_EDGES,
  inputFolders,
  outputFolders,
  nodeTypes,
  edgeTypes,
  REPO_ROOT
} from '../config/grounded-intelligence-index.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Node {
  id: string;
  type: string;
  title: string;
  sourceFile: string;
  summary: string;
  confidence: string;
  tags: string[];
  reviewStatus: string;
}

interface Edge {
  id: string;
  type: string;
  from: string;
  to: string;
  rationale: string;
  confidence: string;
}

interface Graph {
  graphId: string;
  createdAt: string;
  sourceFiles: string[];
  nodes: Node[];
  edges: Edge[];
  safetyFlags: {
    localOnly: boolean;
    noExternalCalls: boolean;
    noVectorDbWrite: boolean;
    noObsidianWrite: boolean;
  };
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
  const logFile = path.join(outputFolders.logs, `graph_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// Find the latest markdown file in a directory
function getLatestFile(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({ name: f, path: path.join(dir, f), time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

// Build the graph by reading response intelligence files
async function buildGraph(): Promise<Graph> {
  const sourceFiles: string[] = [];
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let nodeCount = 0;
  let edgeCount = 0;

  const createNode = (type: string, title: string, srcFile: string, summary: string, conf = "High", tags: string[] = [], status = "staged_for_manual_review"): Node => {
    nodeCount++;
    const id = `${type}_${nodeCount}`;
    const node: Node = { id, type, title, sourceFile: path.basename(srcFile), summary, confidence: conf, tags, reviewStatus: status };
    nodes.push(node);
    return node;
  };

  const createEdge = (type: string, from: string, to: string, rationale: string, conf = "High"): Edge => {
    edgeCount++;
    const id = `edge_${edgeCount}`;
    const edge: Edge = { id, type, from, to, rationale, confidence: conf };
    edges.push(edge);
    return edge;
  };

  // 1. Source Response Node
  const latestIndexFile = getLatestFile(inputFolders.insightIndexes);
  let sourceFileName = "notebooklm_normalized_response_notebooklm_live_response_sample_2026-05-31.md";
  if (latestIndexFile) {
    sourceFiles.push(latestIndexFile);
    const content = fs.readFileSync(latestIndexFile, 'utf-8');
    const sourceMatch = content.match(/-\s+\*\*Source Response:\*\*\s*(.+)$/m);
    if (sourceMatch) {
      sourceFileName = sourceMatch[1].trim();
    }
  }
  const sourceNode = createNode('source_response', sourceFileName, latestIndexFile || '', "The raw normalized response file serving as the grounded source data.");

  // 2. Parse Insight Index
  if (latestIndexFile) {
    const content = fs.readFileSync(latestIndexFile, 'utf-8');
    // Extract key ideas
    const ideasSection = content.split('## Key Ideas')[1]?.split('##')[0];
    if (ideasSection) {
      const ideas = ideasSection.split('\n').map(l => l.replace(/^[-*+]\s+/, '').trim()).filter(l => l && !l.startsWith('##'));
      for (const idea of ideas) {
        const n = createNode('insight', idea, latestIndexFile, "Key actionable insight or takeaway parsed from NotebookLM response.");
        createEdge('derived_from', n.id, sourceNode.id, "Insight was derived directly from the source response text.");
      }
    }
  }

  // Helper to find insight node ID by text similarity
  const findInsightIdByText = (text: string): string => {
    const match = nodes.find(n => n.type === 'insight' && (text.toLowerCase().includes(n.title.toLowerCase()) || n.title.toLowerCase().includes(text.toLowerCase())));
    return match ? match.id : sourceNode.id;
  };

  // 3. Parse Citations Map
  const latestCitationsFile = getLatestFile(inputFolders.citationMaps);
  if (latestCitationsFile) {
    sourceFiles.push(latestCitationsFile);
    const content = fs.readFileSync(latestCitationsFile, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('|') && !line.includes('Citation') && !line.includes('---|---')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 6) {
          const citationId = parts[1]; // e.g. [1]
          const claim = parts[2];
          const sourceDoc = parts[3];
          const conf = parts[4];
          const warning = parts[5];

          const n = createNode('citation', citationId, latestCitationsFile, `Citation reference to external document: ${sourceDoc}. Warning: ${warning}`, conf, [sourceDoc]);
          createEdge('supports', n.id, sourceNode.id, `Citation supports claim: "${claim}" in the source response.`, conf);
        }
      }
    }
  }

  // 4. Parse Weak Claims
  const latestWeakClaimsFile = getLatestFile(inputFolders.weakClaims);
  if (latestWeakClaimsFile) {
    sourceFiles.push(latestWeakClaimsFile);
    const content = fs.readFileSync(latestWeakClaimsFile, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('|') && !line.includes('Claim') && !line.includes('---|---')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 6) {
          const claim = parts[1];
          const weakness = parts[2];
          const evidence = parts[3];
          const riskLevel = parts[4];
          const step = parts[5];

          const n = createNode('weak_claim', claim, latestWeakClaimsFile, `Weak claim: ${weakness}. Missing: ${evidence}`, "Medium", [riskLevel]);
          createEdge('contradicts', n.id, sourceNode.id, "Claim contradicts system safety constraints or lacks documented evidence.");

          // Create risk node
          const rNode = createNode('risk', `Risk: ${claim}`, latestWeakClaimsFile, `Identified system risk with level ${riskLevel} from weak claim.`, "High", [riskLevel]);
          createEdge('needs_verification', n.id, rNode.id, `Weak claim introduces system risk requiring mitigation.`);

          // Create next action node
          const naNode = createNode('next_action', step, latestWeakClaimsFile, "Mitigation next action to verify or correct the weak claim.", "High");
          createEdge('becomes_next_action', n.id, naNode.id, "Prescribed verification step to resolve the weak claim.");
        }
      }
    }
  }

  // 5. Parse Workflow Cards
  const latestWorkflowCardsFile = getLatestFile(inputFolders.workflowCards);
  if (latestWorkflowCardsFile) {
    sourceFiles.push(latestWorkflowCardsFile);
    const content = fs.readFileSync(latestWorkflowCardsFile, 'utf-8');
    const sections = content.split('### Workflow:');
    for (const section of sections.slice(1)) {
      const lines = section.split('\n');
      const title = lines[0].trim();
      let insightText = '';
      let tool = 'None';
      let agent = 'Workflow Auditor';
      let benefit = '';
      let risk = '';
      let action = '';

      for (const line of lines) {
        if (line.includes('**Source Insight:**')) insightText = line.split('**Source Insight:**')[1].trim();
        if (line.includes('**Required Tool:**')) tool = line.split('**Required Tool:**')[1].trim();
        if (line.includes('**Relevant Agent:**')) agent = line.split('**Relevant Agent:**')[1].trim();
        if (line.includes('**Expected Benefit:**')) benefit = line.split('**Expected Benefit:**')[1].trim();
        if (line.includes('**Risk:**')) risk = line.split('**Risk:**')[1].trim();
        if (line.includes('**Next Action:**')) action = line.split('**Next Action:**')[1].trim();
      }

      const n = createNode('workflow_card', title, latestWorkflowCardsFile, `Workflow utilizing ${tool} for expected benefit: ${benefit}`);
      const insightId = findInsightIdByText(insightText);
      createEdge('derived_from', n.id, insightId, "Workflow card is derived from the parsed key insight node.");

      // Agent Node
      let agentNode = nodes.find(x => x.type === 'agent' && x.title === agent);
      if (!agentNode) {
        agentNode = createNode('agent', agent, latestWorkflowCardsFile, `Productivity Agent council member overseeing operations.`);
      }
      createEdge('owned_by_agent', n.id, agentNode.id, "Workflow execution is owned by the productivity agent.");

      // Risk Node
      if (risk) {
        const rNode = createNode('risk', `Risk: ${title}`, latestWorkflowCardsFile, risk, "Medium");
        createEdge('needs_verification', n.id, rNode.id, "Workflow steps introduce potential risks requiring manual checks.");
      }

      // Next Action Node
      if (action) {
        const naNode = createNode('next_action', action, latestWorkflowCardsFile, `Next action for workflow: ${action}`, "High");
        createEdge('becomes_next_action', n.id, naNode.id, "Mitigation next action to resolve workflow risk or execute setup.");
      }
    }
  }

  // 6. Parse OS Suggestions
  const latestOSSuggestionsFile = getLatestFile(inputFolders.osModuleSuggestions);
  if (latestOSSuggestionsFile) {
    sourceFiles.push(latestOSSuggestionsFile);
    const content = fs.readFileSync(latestOSSuggestionsFile, 'utf-8');
    const sections = content.split('### OS Module:');
    for (const section of sections.slice(1)) {
      const lines = section.split('\n');
      const title = lines[0].trim();
      let insightText = '';
      let purpose = '';
      let agent = 'Workflow Auditor';
      let inputs = '';
      let outputs = '';
      let difficulty = 'Medium';
      let score = '8/10';
      let action = '';

      for (const line of lines) {
        if (line.includes('**Source Insight:**')) insightText = line.split('**Source Insight:**')[1].trim();
        if (line.includes('**Purpose:**')) purpose = line.split('**Purpose:**')[1].trim();
        if (line.includes('**Owner Agent:**')) agent = line.split('**Owner Agent:**')[1].trim();
        if (line.includes('**Input Files:**')) inputs = line.split('**Input Files:**')[1].trim();
        if (line.includes('**Output Files:**')) outputs = line.split('**Output Files:**')[1].trim();
        if (line.includes('**Implementation Difficulty:**')) difficulty = line.split('**Implementation Difficulty:**')[1].trim();
        if (line.includes('**Benefit Score:**')) score = line.split('**Benefit Score:**')[1].trim();
        if (line.includes('**Next Action:**')) action = line.split('**Next Action:**')[1].trim();
      }

      const n = createNode('os_module_suggestion', title, latestOSSuggestionsFile, `OS Module suggestion. Input: ${inputs}, Output: ${outputs}. Score: ${score}`, "High", [difficulty]);
      const insightId = findInsightIdByText(insightText);
      createEdge('suggests_module', insightId, n.id, `Insight suggests the creation or expansion of an OS module.`);

      // Agent Node
      let agentNode = nodes.find(x => x.type === 'agent' && x.title === agent);
      if (!agentNode) {
        agentNode = createNode('agent', agent, latestOSSuggestionsFile, `Productivity Agent council member overseeing operations.`);
      }
      createEdge('owned_by_agent', n.id, agentNode.id, "Module operations and maintenance are owned by the productivity agent.");

      // Next Action Node
      if (action) {
        const naNode = createNode('next_action', action, latestOSSuggestionsFile, `Next action for OS suggestion: ${action}`, "High");
        createEdge('becomes_next_action', n.id, naNode.id, "Prescribed next steps to build or integrate the OS module.");
      }
    }
  }

  // 7. Parse Obsidian Staged Note
  const latestStagedNoteFile = getLatestFile(inputFolders.obsidianStagedNotes);
  if (latestStagedNoteFile) {
    sourceFiles.push(latestStagedNoteFile);
    const content = fs.readFileSync(latestStagedNoteFile, 'utf-8');
    const titleMatch = content.match(/^title:\s*"(.+)"/m);
    const title = titleMatch ? titleMatch[1] : "Staged Obsidian Brief";

    const n = createNode('obsidian_staged_note', title, latestStagedNoteFile, "Unified staged markdown note compiled and formatted for manual review.");
    createEdge('stages_to_obsidian', n.id, sourceNode.id, "Obsidian staged note aggregates all intelligence sections for the source response.");
  }

  const graphId = `graph_${getFormattedDate()}`;
  return {
    graphId,
    createdAt: new Date().toISOString(),
    sourceFiles,
    nodes,
    edges,
    safetyFlags: {
      localOnly: LOCAL_GRAPH_ONLY,
      noExternalCalls: !ALLOW_EXTERNAL_API_CALLS,
      noVectorDbWrite: !ALLOW_VECTOR_DB_WRITE,
      noObsidianWrite: !ALLOW_OBSIDIAN_WRITE
    }
  };
}

// 1. Build
async function handleBuild(): Promise<{ jsonPath: string; mdPath: string }> {
  console.log("🕸️ Building Grounded Intelligence Index Graph...");
  await announceIntent("Compiling response intelligence files into a grounded index graph.");

  const graph = await buildGraph();

  if (graph.nodes.length === 0) {
    throw new Error("No intelligence index nodes could be parsed. Build aborted.");
  }

  // Write JSON graph
  const jsonPath = getSafeWritePath(outputFolders.json, `grounded_intelligence_graph_${getFormattedDate()}`, '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(graph, null, 2) + '\n');

  // Load templates
  const nodeTemplatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'grounded_index', 'graph-node-template.md');
  const edgeTemplatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'grounded_index', 'graph-edge-template.md');

  if (!fs.existsSync(nodeTemplatePath) || !fs.existsSync(edgeTemplatePath)) {
    throw new Error("Graph Node/Edge templates missing from templates directory.");
  }

  const nodeTemplate = fs.readFileSync(nodeTemplatePath, 'utf-8');
  const edgeTemplate = fs.readFileSync(edgeTemplatePath, 'utf-8');

  // Write MD graph
  let mdContent = `# 🕸️ Grounded Intelligence Graph: ${graph.graphId}\n\n`;
  mdContent += `* **Created At:** ${graph.createdAt}\n`;
  mdContent += `* **Local Only:** ${graph.safetyFlags.localOnly ? 'Yes' : 'No'}\n\n`;

  mdContent += `## 📁 Source Files\n`;
  for (const src of graph.sourceFiles) {
    mdContent += `- ${path.basename(src)}\n`;
  }
  mdContent += `\n---\n\n## 🟢 Nodes (${graph.nodes.length})\n\n`;

  for (const n of graph.nodes) {
    mdContent += nodeTemplate
      .replace(/\{\{NODE_ID\}\}/g, n.id)
      .replace(/\{\{TYPE\}\}/g, n.type)
      .replace(/\{\{TITLE\}\}/g, n.title)
      .replace(/\{\{SOURCE_FILE\}\}/g, n.sourceFile)
      .replace(/\{\{SUMMARY\}\}/g, n.summary)
      .replace(/\{\{CONFIDENCE\}\}/g, n.confidence)
      .replace(/\{\{TAGS\}\}/g, n.tags.length > 0 ? n.tags.join(', ') : 'None')
      .replace(/\{\{REVIEW_STATUS\}\}/g, n.reviewStatus) + '\n';
  }

  mdContent += `\n---\n\n## 🔵 Edges (${graph.edges.length})\n\n`;

  for (const e of graph.edges) {
    mdContent += edgeTemplate
      .replace(/\{\{EDGE_ID\}\}/g, e.id)
      .replace(/\{\{TYPE\}\}/g, e.type)
      .replace(/\{\{FROM\}\}/g, e.from)
      .replace(/\{\{TO\}\}/g, e.to)
      .replace(/\{\{RATIONALE\}\}/g, e.rationale)
      .replace(/\{\{CONFIDENCE\}\}/g, e.confidence) + '\n';
  }

  const mdPath = getSafeWritePath(outputFolders.markdown, `grounded_intelligence_graph_${getFormattedDate()}`, '.md');
  fs.writeFileSync(mdPath, mdContent);

  const detailMsg = `Grounded graph build complete. JSON: ${path.basename(jsonPath)}. Markdown: ${path.basename(mdPath)}. Nodes: ${graph.nodes.length}. Edges: ${graph.edges.length}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('BUILD_GRAPH', detailMsg);

  await announceCompletion("Grounded Intelligence Graph build complete.");
  return { jsonPath, mdPath };
}

// 2. Report
async function handleReport(): Promise<string> {
  console.log("📊 Generating Graph Statistics and Queue Report...");
  await announceIntent("Aggregating node counts, weak claims, and os module suggestions into a Markdown report.");

  const graph = await buildGraph();

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'grounded_index', 'graph-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Report template not found: ${templatePath}`);
  }

  // Count nodes by type
  const nodeCountsMap = nodeTypes.reduce((acc, t) => {
    acc[t] = graph.nodes.filter(n => n.type === t).length;
    return acc;
  }, {} as { [key: string]: number });

  // Count edges by type
  const edgeCountsMap = edgeTypes.reduce((acc, t) => {
    acc[t] = graph.edges.filter(e => e.type === t).length;
    return acc;
  }, {} as { [key: string]: number });

  // Find orphans (nodes with no edges going to or from)
  const connectedNodeIds = new Set<string>();
  for (const e of graph.edges) {
    connectedNodeIds.add(e.from);
    connectedNodeIds.add(e.to);
  }
  const orphans = graph.nodes.filter(n => !connectedNodeIds.has(n.id));

  const nodeCountsRows = Object.entries(nodeCountsMap).map(([t, count]) => `  - **${t}:** ${count}`).join('\n');
  const edgeCountsRows = Object.entries(edgeCountsMap).map(([t, count]) => `  - **${t}:** ${count}`).join('\n');
  const orphanRows = orphans.length > 0
    ? orphans.map(n => `  - **${n.id}** (${n.type}): ${n.title}`).join('\n')
    : "  - None detected";

  // Filter specific nodes for lists
  const weakClaimsNodes = graph.nodes.filter(n => n.type === 'weak_claim');
  const weakClaimsRows = weakClaimsNodes.length > 0
    ? weakClaimsNodes.map(n => `- **Claim:** ${n.title}\n  - **Details:** ${n.summary}\n  - **Review Status:** staged_for_manual_review`).join('\n')
    : "- No weak claims detected";

  const workflowNodes = graph.nodes.filter(n => n.type === 'workflow_card');
  const workflowRows = workflowNodes.length > 0
    ? workflowNodes.map(n => `- **Workflow:** ${n.title}\n  - **Details:** ${n.summary}`).join('\n')
    : "- No workflow cards detected";

  const osSuggestionsNodes = graph.nodes.filter(n => n.type === 'os_module_suggestion');
  const osSuggestionsRows = osSuggestionsNodes.length > 0
    ? osSuggestionsNodes.map(n => `- **OS Module Suggestion:** ${n.title}\n  - **Details:** ${n.summary}`).join('\n')
    : "- No OS module suggestions detected";

  // Compile manual review queue
  const reviewQueueNodes = graph.nodes.filter(n => ['weak_claim', 'os_module_suggestion', 'workflow_card'].includes(n.type));
  const reviewQueueRows = reviewQueueNodes.length > 0
    ? reviewQueueNodes.map(n => `  - [ ] **${n.id}** [${n.type.toUpperCase()}]: ${n.title}`).join('\n')
    : "  - [ ] Review entire staged graph index file";

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{FILES_INDEXED\}\}/g, graph.sourceFiles.map(src => `- ${path.basename(src)}`).join('\n'))
    .replace(/\{\{NODE_COUNTS\}\}/g, nodeCountsRows)
    .replace(/\{\{EDGE_COUNTS\}\}/g, edgeCountsRows)
    .replace(/\{\{ORPHAN_NODES\}\}/g, orphanRows)
    .replace(/\{\{HIGH_RISK_WEAK_CLAIMS\}\}/g, weakClaimsRows)
    .replace(/\{\{TOP_WORKFLOW_CARDS\}\}/g, workflowRows)
    .replace(/\{\{TOP_OS_MODULE_SUGGESTIONS\}\}/g, osSuggestionsRows)
    .replace(/\{\{REVIEW_QUEUE\}\}/g, reviewQueueRows)
    .replace(/\{\{NEXT_ACTION\}\}/g, "Verify weak claims and OS module suggestions manually before promoting next actions.");

  const reportPath = getSafeWritePath(outputFolders.reports, `grounded_intelligence_report_${getFormattedDate()}`, '.md');
  fs.writeFileSync(reportPath, template);

  const detailMsg = `Grounded graph report compiled: ${path.basename(reportPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('GENERATE_REPORT', detailMsg);

  await announceCompletion("Grounded Intelligence Graph Report compiled successfully.");
  return reportPath;
}

// 3. Status
function handleStatus() {
  console.log("=========================================");
  console.log("🕸️ GROUNDED INTELLIGENCE GRAPH INDEX STATUS");
  console.log("=========================================");

  const getLatestFileInDir = (dir: string, ext = '.md'): string => {
    if (!fs.existsSync(dir)) return "Folder missing";
    const files = fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort();
    return files.length > 0 ? files[files.length - 1] : "None generated";
  };

  const latestJson = getLatestFileInDir(outputFolders.json, '.json');
  const latestMd = getLatestFileInDir(outputFolders.markdown, '.md');
  const latestReport = getLatestFileInDir(outputFolders.reports, '.md');

  console.log(`Latest JSON Graph:     ${latestJson}`);
  console.log(`Latest Markdown Graph: ${latestMd}`);
  console.log(`Latest Graph Report:   ${latestReport}`);

  // Fetch node / edge counts from latest JSON if possible
  let nodeCount = 0;
  let edgeCount = 0;
  if (latestJson !== "None generated" && latestJson !== "Folder missing") {
    try {
      const graphData: Graph = JSON.parse(fs.readFileSync(path.join(outputFolders.json, latestJson), 'utf-8'));
      nodeCount = graphData.nodes.length;
      edgeCount = graphData.edges.length;
    } catch (_) {}
  }

  console.log(`Node Count:            ${nodeCount}`);
  console.log(`Edge Count:            ${edgeCount}`);

  // Check missing inputs
  const missingInputs: string[] = [];
  for (const [name, dir] of Object.entries(inputFolders)) {
    if (!fs.existsSync(dir) || fs.readdirSync(dir).filter(f => f.endsWith('.md')).length === 0) {
      missingInputs.push(name);
    }
  }

  if (missingInputs.length > 0) {
    console.log(`Missing Inputs:        ${missingInputs.join(', ')}`);
    console.log("Recommended Action:     Run 'npm run notebooklm-response-intelligence -- \"full\"' to generate inputs.");
  } else {
    console.log("Input Status:          All folders populated.");
    console.log("Recommended Action:     Inspect graph structure or promote next actions.");
  }
  console.log("=========================================");
}

// 4. Inspect Latest
function handleInspectLatest() {
  console.log("=========================================");
  console.log("🛰️ INSPECTING LATEST GROUNDED GRAPH INDEX");
  console.log("=========================================");

  const jsonDir = outputFolders.json;
  if (!fs.existsSync(jsonDir)) {
    console.error("❌ JSON graph directory is missing.");
    process.exit(1);
  }

  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.error("❌ No compiled JSON graph files found. Run build command first.");
    process.exit(1);
  }

  const latestFile = files[files.length - 1];
  try {
    const graph: Graph = JSON.parse(fs.readFileSync(path.join(jsonDir, latestFile), 'utf-8'));

    console.log(`Graph ID:       ${graph.graphId}`);
    console.log(`Created Date:   ${graph.createdAt}`);
    console.log(`Source Files:   ${graph.sourceFiles.map(f => path.basename(f)).join(', ')}`);
    console.log(`Total Nodes:    ${graph.nodes.length}`);
    console.log(`Total Edges:    ${graph.edges.length}`);

    console.log("\nTop 5 Nodes:");
    graph.nodes.slice(0, 5).forEach(n => {
      console.log(`  - [${n.type.toUpperCase()}] **${n.id}**: ${n.title} (Confidence: ${n.confidence})`);
    });

    console.log("\nTop 5 Edges:");
    graph.edges.slice(0, 5).forEach(e => {
      console.log(`  - **${e.from}** --(${e.type})--> **${e.to}** [Rationale: ${e.rationale}]`);
    });

    console.log("\nManual Review Queue:");
    const queue = graph.nodes.filter(n => ['weak_claim', 'os_module_suggestion'].includes(n.type));
    if (queue.length > 0) {
      queue.slice(0, 5).forEach(n => {
        console.log(`  - [ ] [Review] **${n.id}**: ${n.title}`);
      });
    } else {
      console.log("  - No items in manual review queue.");
    }
  } catch (err) {
    console.error(`❌ Error parsing graph JSON: ${(err as Error).message}`);
    process.exit(1);
  }
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

  // Constraints enforcement
  if (ALLOW_EXTERNAL_API_CALLS || ALLOW_VECTOR_DB_WRITE || ALLOW_OBSIDIAN_WRITE) {
    console.error("❌ Safety Gate Triggered: External API calls, Vector DB writes, or direct Obsidian writes are incorrectly enabled.");
    process.exit(1);
  }

  if (!LOCAL_GRAPH_ONLY) {
    console.error("❌ Safety Gate Triggered: Graph compiler is not in local-only mode.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run grounded-index-help' for detailed instructions.");
    } else if (command === 'build') {
      await handleBuild();
    } else if (command === 'report') {
      await handleReport();
    } else if (command === 'status') {
      handleStatus();
    } else if (command === 'inspect' && subCommand === 'latest') {
      handleInspectLatest();
    } else {
      console.error(`❌ Unknown command: "${command} ${subCommand}". Safe fallback triggered. command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Graph execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
