import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export function installHook(): { success: boolean; reportPath: string } {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const backupSuffix = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  
  const gitHooksDir = path.join(REPO_ROOT, '.git', 'hooks');
  const targetHookPath = path.join(gitHooksDir, 'pre-push');
  const templatePath = path.join(REPO_ROOT, 'hooks', 'pre-push.brilliantaire-template');
  const reportsDir = path.join(REPO_ROOT, 'outputs', 'git_hooks', 'reports');

  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `git_hook_install_${dateStr}.md`);

  console.log('📦 Installing Brilliantaire OS Pre-Push Git Hook...');

  // 1. Confirm .git/hooks exists
  if (!fs.existsSync(gitHooksDir)) {
    console.log(`📁 Git hooks folder not found. Creating: ${gitHooksDir}`);
    fs.mkdirSync(gitHooksDir, { recursive: true });
  }

  // 2. Read hooks/pre-push.brilliantaire-template
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template file not found: ${templatePath}`);
    process.exit(1);
  }
  const templateContent = fs.readFileSync(templatePath, 'utf-8');

  // 3. Backup existing pre-push hook if it exists
  let backupPath = 'None';
  let backupCreated = 'No';
  if (fs.existsSync(targetHookPath)) {
    backupPath = path.join(gitHooksDir, `pre-push.brilliantaire-backup-${backupSuffix}`);
    fs.renameSync(targetHookPath, backupPath);
    backupCreated = 'Yes';
    console.log(`⚠️  Pre-existing pre-push hook detected. Backed up to: ${backupPath}`);
  }

  // 4. Write template to .git/hooks/pre-push
  fs.writeFileSync(targetHookPath, templateContent);
  console.log(`✅ Hook written to: ${targetHookPath}`);

  // 5. chmod +x .git/hooks/pre-push
  try {
    fs.chmodSync(targetHookPath, '755');
    console.log('✅ Permissions updated. Pre-push hook is now executable.');
  } catch (err: any) {
    console.error(`❌ Failed to update permissions (chmod +x): ${err.message}`);
  }

  // 6. Generate report
  const installReportTemplatePath = path.join(REPO_ROOT, 'templates', 'git_hooks', 'hook-install-report-template.md');
  if (!fs.existsSync(installReportTemplatePath)) {
    console.error(`❌ Install report template not found: ${installReportTemplatePath}`);
    process.exit(1);
  }

  let reportContent = fs.readFileSync(installReportTemplatePath, 'utf-8');
  reportContent = reportContent
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{TIMESTAMP}}/g, timestamp)
    .replace(/{{INSTALL_STATUS}}/g, 'SUCCESS')
    .replace(/{{HOOK_PATH}}/g, targetHookPath)
    .replace(/{{TEMPLATE_PATH}}/g, templatePath)
    .replace(/{{BACKUP_CREATED}}/g, backupCreated)
    .replace(/{{BACKUP_PATH}}/g, backupPath);

  fs.writeFileSync(reportPath, reportContent);
  console.log(`📝 Install report generated: ${reportPath}`);

  return {
    success: true,
    reportPath
  };
}

if (process.argv[1] && (process.argv[1].endsWith('git-hook-install.ts') || process.argv[1].endsWith('git-hook-install.js') || process.argv[1].includes('git-hook-install'))) {
  const result = installHook();
  if (!result.success) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}
