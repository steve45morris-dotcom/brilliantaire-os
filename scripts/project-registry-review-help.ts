import { CLASSIFICATION_LABELS, SCAN_ROOTS } from '../config/project-registry-review.js';

export function printHelp() {
  console.log(`
🧭 Project Registry Drift Review CLI - Help Menu

Available Commands:
  help            Print this help menu and exit
  classify        Scan roots, classify unregistered projects, and write classification report
  staged-entries  Read latest classification report and generate PROJECTS.md matrix candidates
  summary         Summarize registry drift metrics and list top candidates
  action-plan     Generate actionable review plan with prioritization categories and manual checklist
  status          Print overview status of all generated outputs and candidate metrics

Scan Roots:
${SCAN_ROOTS.map(root => `  - ${root}`).join('\n')}

Classification Labels:
${CLASSIFICATION_LABELS.map(label => `  - ${label}`).join('\n')}

Safety Mode:
  - REVIEW_ONLY = true
  - PROJECTS.md write = BLOCKED
  - Folder moves/deletions = BLOCKED
  - Process/script executions in targets = BLOCKED
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('project-registry-review-help.ts')) {
  printHelp();
}
