import fs from 'fs';
import { GoalVerificationEngine } from '../src/agent-upgrade/verifier.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1];
      if (val && !val.startsWith('--')) {
        params[key] = val;
        i++;
      } else {
        params[key] = 'true';
      }
    }
  }
  return params;
}

async function main() {
  const params = parseArgs();
  const goal = params.goal;
  const criteriaRaw = params.criteria || '';
  const contentRaw = params.content || '';
  const format = params.format;

  if (!goal || !contentRaw) {
    console.error('Usage: npm run verify-output -- --goal [goal] --criteria "crit1,crit2" --content [text-or-filepath] --format [json/markdown]');
    process.exit(1);
  }

  // Load content from file if it points to a path
  let content = contentRaw;
  if (fs.existsSync(contentRaw)) {
    content = fs.readFileSync(contentRaw, 'utf-8');
  }

  const criteria = criteriaRaw.split(',').map((c) => c.trim()).filter((c) => c.length > 0);

  const verifier = new GoalVerificationEngine();
  const report = verifier.verify(goal, criteria, content, { expectedFormat: format });

  console.log('\n======================================');
  console.log('      VERIFICATION ENGINE REPORT      ');
  console.log('======================================');
  console.log(`Final Status:            ${report.passed ? 'PASSED ✅' : 'FAILED ✗'}`);
  console.log(`Factual Accuracy:        ${report.factualAccuracyScore}/100`);
  console.log(`Business Impact Score:   ${report.businessImpactScore}/100`);
  console.log(`Formatting Valid:        ${report.formattingValid ? 'Yes' : 'No'}`);
  console.log(`Compliance Valid:        ${report.instructionComplianceValid ? 'Yes' : 'No'}`);
  console.log(`Hallucinations Found:    ${report.hallucinationDetected ? 'YES ⚠️' : 'No'}`);
  console.log('--------------------------------------');
  console.log('CHECKLIST RESULTS:');
  report.checklist.forEach((item, idx) => {
    console.log(`  ${idx + 1}. [${item.passed ? '✓' : '✗'}] ${item.criterion}`);
    console.log(`      Reason: ${item.reason}`);
  });

  if (report.errors.length > 0) {
    console.log('\nERRORS & WARNINGS LOGGED:');
    report.errors.forEach((err) => console.warn(`  - ${err}`));
  }
  console.log('======================================\n');
}

main();
