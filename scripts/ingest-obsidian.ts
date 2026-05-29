import fs from 'fs';
import path from 'path';
import { OBSIDIAN_CANDIDATE_PATHS, OBSIDIAN_INGEST_OUTPUT } from '../config/paths.js';

interface IngestedFile {
  filePath: string;
  title: string;
  lastModified: string;
  tags: string[];
  headings: string[];
  matchedLines: {
    todo: string[];
    next: string[];
    decision: string[];
    blocked: string[];
    icyflamze: string[];
    treeGroove: string[];
    brilliantier: string[];
    profBetGeng: string[];
    antigravity: string[];
  };
  relevanceScore: number;
}

const IGNORED_FOLDERS = [
  '.git',
  'node_modules',
  '.trash',
  '.obsidian', // matches plugin paths etc
  '.venv',
  'dist',
  'build'
];

const MAX_DEPTH = 8;

function findMarkdownFiles(dir: string, depth = 0): string[] {
  if (depth > MAX_DEPTH) return [];
  const results: string[] = [];

  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const basename = path.basename(file);
        if (IGNORED_FOLDERS.includes(basename)) {
          continue;
        }
        results.push(...findMarkdownFiles(fullPath, depth + 1));
      } else if (file.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Ignore permissions issues / unreadable folders silently
  }

  return results;
}

function processFile(filePath: string): IngestedFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const stat = fs.statSync(filePath);

  let title = path.basename(filePath, '.md');
  const headings: string[] = [];
  const tagsSet = new Set<string>();

  const todoLines: string[] = [];
  const nextLines: string[] = [];
  const decisionLines: string[] = [];
  const blockedLines: string[] = [];
  const icyLines: string[] = [];
  const tgLines: string[] = [];
  const brillLines: string[] = [];
  const pbgLines: string[] = [];
  const agLines: string[] = [];

  const lines = content.split('\n');

  // Simple frontmatter detection
  let inFrontmatter = false;
  
  for (const line of lines) {
    const trimmed = line.trim();

    // Frontmatter toggle
    if (trimmed === '---') {
      inFrontmatter = !inFrontmatter;
      continue;
    }

    if (inFrontmatter) {
      if (trimmed.startsWith('tags:')) {
        const tagValue = trimmed.replace('tags:', '').trim();
        // Parse array [tag1, tag2] or comma-separated list
        const cleanTags = tagValue.replace(/[\[\]]/g, '').split(',').map(t => t.trim()).filter(Boolean);
        cleanTags.forEach(t => tagsSet.add(t));
      } else if (trimmed.startsWith('title:')) {
        title = trimmed.replace('title:', '').replace(/['"]/g, '').trim();
      }
      continue;
    }

    // Heading parsing
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        headings.push(trimmed);
        if (match[1].length === 1 && title === path.basename(filePath, '.md')) {
          title = match[2]; // Use first Level 1 Heading as title
        }
      }
    }

    // Inline tags: e.g. #tag-name
    const inlineTagMatches = trimmed.match(/\B#([a-zA-Z0-9_\-/]+)/g);
    if (inlineTagMatches) {
      inlineTagMatches.forEach(tag => {
        // filter out headers that regex might have captured
        if (!trimmed.startsWith('#') || trimmed.match(/^#+[a-zA-Z0-9_\-/]+$/)) {
          tagsSet.add(tag.substring(1));
        }
      });
    }

    // Line matching
    const upperLine = trimmed.toUpperCase();
    if (upperLine.includes('TODO')) todoLines.push(trimmed);
    if (upperLine.includes('NEXT')) nextLines.push(trimmed);
    if (upperLine.includes('DECISION')) decisionLines.push(trimmed);
    if (upperLine.includes('BLOCKED')) blockedLines.push(trimmed);
    if (trimmed.includes('Icyflamze')) icyLines.push(trimmed);
    if (trimmed.includes('Tree Groove')) tgLines.push(trimmed);
    if (trimmed.includes('Brilliantier')) brillLines.push(trimmed);
    if (trimmed.includes('ProfBetGeng')) pbgLines.push(trimmed);
    if (trimmed.includes('Antigravity')) agLines.push(trimmed);
  }

  const relevanceScore = 
    todoLines.length * 1.5 +
    nextLines.length * 1.5 +
    decisionLines.length * 2.0 +
    blockedLines.length * 2.0 +
    icyLines.length * 1.0 +
    tgLines.length * 1.0 +
    brillLines.length * 1.0 +
    pbgLines.length * 1.0 +
    agLines.length * 1.0;

  return {
    filePath,
    title,
    lastModified: stat.mtime.toISOString(),
    tags: Array.from(tagsSet),
    headings,
    matchedLines: {
      todo: todoLines,
      next: nextLines,
      decision: decisionLines,
      blocked: blockedLines,
      icyflamze: icyLines,
      treeGroove: tgLines,
      brilliantier: brillLines,
      profBetGeng: pbgLines,
      antigravity: agLines
    },
    relevanceScore
  };
}

function ingest() {
  console.log("=========================================");
  console.log("📥 KNOWLEDGE INGESTION: Obsidian Scan");
  console.log("=========================================");

  const activeVaults: string[] = [];
  const allMarkdownFiles: string[] = [];

  for (const candidate of OBSIDIAN_CANDIDATE_PATHS) {
    if (fs.existsSync(candidate)) {
      console.log(`📡 Found active Vault: ${candidate}`);
      activeVaults.push(candidate);
      const files = findMarkdownFiles(candidate);
      allMarkdownFiles.push(...files);
    }
  }

  if (activeVaults.length === 0) {
    console.log("⚠️ No active Obsidian vaults found in candidate paths.");
  }

  console.log(`🔍 Scanning ${allMarkdownFiles.length} markdown notes recursively...`);

  const ingestedFiles: IngestedFile[] = [];
  let totalTodos = 0;
  let totalNexts = 0;
  let totalDecisions = 0;
  let totalBlockeds = 0;

  for (const file of allMarkdownFiles) {
    const data = processFile(file);
    ingestedFiles.push(data);

    totalTodos += data.matchedLines.todo.length;
    totalNexts += data.matchedLines.next.length;
    totalDecisions += data.matchedLines.decision.length;
    totalBlockeds += data.matchedLines.blocked.length;
  }

  // Sort by relevance score
  const sortedFiles = ingestedFiles.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const relevantFiles = sortedFiles.filter(f => f.relevanceScore > 0);

  // Write reports
  if (!fs.existsSync(OBSIDIAN_INGEST_OUTPUT)) {
    fs.mkdirSync(OBSIDIAN_INGEST_OUTPUT, { recursive: true });
  }

  const jsonReportPath = path.join(OBSIDIAN_INGEST_OUTPUT, 'ingest_report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    vaultsScanned: activeVaults,
    filesScannedCount: allMarkdownFiles.length,
    statistics: {
      todos: totalTodos,
      nexts: totalNexts,
      decisions: totalDecisions,
      blockeds: totalBlockeds
    },
    files: sortedFiles
  }, null, 2));

  // Generate markdown report
  const mdReportPath = path.join(OBSIDIAN_INGEST_OUTPUT, 'ingest_report.md');
  let mdContent = `# 📂 Obsidian Ingestion Report\n\n`;
  mdContent += `- **Date of Ingest:** ${new Date().toLocaleString()}\n`;
  mdContent += `- **Vaults Scanned:**\n`;
  activeVaults.forEach(v => mdContent += `  - \`${v}\`\n`);
  mdContent += `- **Total Files Scanned:** ${allMarkdownFiles.length}\n`;
  mdContent += `- **Total Signals Detected:**\n`;
  mdContent += `  - Actions (TODO/NEXT): ${totalTodos + totalNexts}\n`;
  mdContent += `  - Decisions: ${totalDecisions}\n`;
  mdContent += `  - Blockers: ${totalBlockeds}\n\n`;

  mdContent += `## 🚀 Top 10 Relevant Files\n\n`;
  const top10 = sortedFiles.slice(0, 10);
  top10.forEach((f, idx) => {
    mdContent += `### ${idx + 1}. [${f.title}](file://${f.filePath})\n`;
    mdContent += `- **Path:** \`${f.filePath}\`\n`;
    mdContent += `- **Relevance Score:** ${f.relevanceScore}\n`;
    if (f.tags.length > 0) {
      mdContent += `- **Tags:** ${f.tags.map(t => `\`#${t}\``).join(' ')}\n`;
    }
    
    // Matched Lines Summaries
    const lines: string[] = [];
    if (f.matchedLines.todo.length > 0) lines.push(`- **TODOs:** ${f.matchedLines.todo.length}`);
    if (f.matchedLines.next.length > 0) lines.push(`- **NEXTs:** ${f.matchedLines.next.length}`);
    if (f.matchedLines.decision.length > 0) lines.push(`- **Decisions:** ${f.matchedLines.decision.length}`);
    if (f.matchedLines.blocked.length > 0) lines.push(`- **Blockers:** ${f.matchedLines.blocked.length}`);
    if (lines.length > 0) {
      mdContent += lines.join('\n') + '\n';
    }
    mdContent += '\n';
  });

  fs.writeFileSync(mdReportPath, mdContent);

  // Terminal Output
  console.log("\n=========================================");
  console.log("📊 INGESTION SUMMARY");
  console.log("=========================================");
  console.log(`• Vaults Found:          ${activeVaults.length}`);
  console.log(`• Markdown Notes Scanned: ${allMarkdownFiles.length}`);
  console.log(`• Action Lines Found:     ${totalTodos + totalNexts}`);
  console.log(`• Decision Lines Found:   ${totalDecisions}`);
  console.log(`• Blocked Lines Found:    ${totalBlockeds}`);
  console.log(`• Saved JSON Report to:   outputs/obsidian_ingest/ingest_report.json`);
  console.log(`• Saved Markdown Report to: outputs/obsidian_ingest/ingest_report.md`);

  console.log("\n🔥 TOP 10 RELEVANT FILES:");
  if (top10.length > 0) {
    top10.forEach((f, idx) => {
      console.log(`  [${idx + 1}] ${f.title} (Score: ${f.relevanceScore})`);
      console.log(`      Path: ${f.filePath}`);
    });
  } else {
    console.log("  (None)");
  }
  console.log("\n=========================================");
}

ingest();
