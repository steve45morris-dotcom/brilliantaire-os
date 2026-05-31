import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export function uninstallHook(): { success: boolean; reportPath: string } {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const disabledSuffix = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  
  const gitHooksDir = path.join(REPO_ROOT, '.git', 'hooks');
  const targetHookPath = path.join(gitHooksDir, 'pre-push');
  const disabledHookPath = path.join(gitHooksDir, `pre-push.disabled-${disabledSuffix}`);
  const reportsDir = path.join(REPO_ROOT, 'outputs', 'git_hooks', 'reports');

  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `git_hook_uninstall_${dateStr}.md`);

  console.log('🗑️  Uninstalling / Disabling Git Pre-Push Hook...');

  let exists = fs.existsSync(targetHookPath);
  let statusText = 'NO_HOOK_FOUND';

  if (exists) {
    fs.renameSync(targetHookPath, disabledHookPath);
    statusText = 'SUCCESS';
    console.log(`✅ Hook disabled. Moved to: ${disabledHookPath}`);
  } else {
    console.log('⚠️  No active hook was found to disable.');
  }

  // Load hook-uninstall-report-template.md
  const uninstallTemplatePath = path.join(REPO_ROOT, 'templates', 'git_hooks', 'hook-uninstall-report-template.md');
  if (!fs.existsSync(uninstallTemplatePath)) {
    console.error(`❌ Uninstall report template not found: ${uninstallTemplatePath}`);
    process.exit(1);
  }

  let reportContent = fs.readFileSync(uninstallTemplatePath, 'utf-8');
  reportContent = reportContent
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{TIMESTAMP}}/g, timestamp)
    .replace(/{{UNINSTALL_STATUS}}/g, statusText)
    .replace(/{{HOOK_PATH}}/g, targetHookPath)
    .replace(/{{DISABLED_PATH}}/g, exists ? disabledHookPath : 'None');

  fs.writeFileSync(reportPath, reportContent);
  console.log(`📝 Uninstall report generated: ${reportPath}`);

  return {
    success: true,
    reportPath
  };
}

if (process.argv[1] && (process.argv[1].endsWith('git-hook-uninstall.ts') || process.argv[1].endsWith('git-hook-uninstall.js') || process.argv[1].includes('git-hook-uninstall'))) {
  uninstallHook();
}
