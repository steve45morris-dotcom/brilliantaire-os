import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export function checkHookStatus(): { success: boolean; reportPath: string; statusSummary: any } {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  const gitHooksDir = path.join(REPO_ROOT, '.git', 'hooks');
  const targetHookPath = path.join(gitHooksDir, 'pre-push');
  const reportsDir = path.join(REPO_ROOT, 'outputs', 'git_hooks', 'reports');

  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `git_hook_status_${dateStr}.md`);

  console.log('🔍 Auditing Git Pre-Push Hook Status...');

  const exists = fs.existsSync(targetHookPath);
  let isExecutable = false;
  let containsScriptCheck = false;

  if (exists) {
    // Check executable
    try {
      fs.accessSync(targetHookPath, fs.constants.X_OK);
      isExecutable = true;
    } catch (_) {
      isExecutable = false;
    }
    
    // Check content
    try {
      const content = fs.readFileSync(targetHookPath, 'utf-8');
      containsScriptCheck = content.includes('npm run git-prepush-check');
    } catch (_) {}
  }

  const isAligned = exists && isExecutable && containsScriptCheck;
  const overallStatus = isAligned ? 'ACTIVE & ALIGNED' : 'INACTIVE / MISALIGNED';

  let actionPlan = '';
  if (isAligned) {
    actionPlan = 'Pre-push safety hook is completely active and enforcing repository hygiene. No action required.';
  } else {
    actionPlan = 'Pre-push safety hook is not fully configured. Execute "npm run git-hook-install" to install or align the safety hook.';
  }

  console.log('=========================================');
  console.log(`- Hook Exists:          ${exists ? "Yes" : "No"}`);
  console.log(`- Executable:           ${isExecutable ? "Yes" : "No"}`);
  console.log(`- Contains Hook Script: ${containsScriptCheck ? "Yes" : "No"}`);
  console.log(`- Overall Status:       ${overallStatus}`);
  console.log('=========================================');

  // Load status-template.md
  const statusTemplatePath = path.join(REPO_ROOT, 'templates', 'git_hooks', 'hook-status-template.md');
  if (!fs.existsSync(statusTemplatePath)) {
    console.error(`❌ Status report template not found: ${statusTemplatePath}`);
    process.exit(1);
  }

  let reportContent = fs.readFileSync(statusTemplatePath, 'utf-8');
  reportContent = reportContent
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{TIMESTAMP}}/g, timestamp)
    .replace(/{{OVERALL_STATUS}}/g, overallStatus)
    .replace(/{{HOOK_EXISTS}}/g, exists ? 'YES' : 'NO')
    .replace(/{{HOOK_EXECUTABLE}}/g, isExecutable ? 'YES' : 'NO')
    .replace(/{{CONTAINS_SCRIPT_CHECK}}/g, containsScriptCheck ? 'YES' : 'NO')
    .replace(/{{STATUS_ACTION}}/g, actionPlan);

  fs.writeFileSync(reportPath, reportContent);
  console.log(`📝 Status report generated: ${reportPath}`);

  return {
    success: isAligned,
    reportPath,
    statusSummary: {
      exists,
      isExecutable,
      containsScriptCheck,
      overallStatus
    }
  };
}

if (process.argv[1] && (process.argv[1].endsWith('git-hook-status.ts') || process.argv[1].endsWith('git-hook-status.js') || process.argv[1].includes('git-hook-status'))) {
  checkHookStatus();
}
