import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');

export function runPrepushCheck(): { success: boolean; reportPath: string } {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  const reportsDir = path.join(REPO_ROOT, 'outputs', 'git_audits', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  
  const reportPath = path.join(reportsDir, `git_prepush_check_${dateStr}.md`);

  console.log('🚀 Initiating Pre-Push Safety Check Sequence...');

  let buildResult = 'passing';
  let buildSummary = 'TypeScript compilation completed successfully.';
  let auditResult = 'passing';
  let auditSummary = 'Static folder and capability audit checks passed.';
  let assetAuditResult = 'passing';
  
  // 1. Run TypeScript build compiler
  console.log('1️⃣ Running TypeScript compiler (npm run build)...');
  try {
    execSync('npm run build', { cwd: REPO_ROOT, stdio: 'pipe' });
    console.log('✅ Build passed.');
  } catch (err: any) {
    buildResult = 'failing';
    buildSummary = `TypeScript build compilation failed: ${err.message}`;
    console.error('❌ Build failed.');
  }

  // 2. Run system audit check
  console.log('2️⃣ Running static systems audit (npm run audit)...');
  try {
    execSync('npm run audit', { cwd: REPO_ROOT, stdio: 'pipe' });
    console.log('✅ System audit passed.');
  } catch (err: any) {
    auditResult = 'failing';
    auditSummary = `Static OS integrity audit failed: ${err.message}`;
    console.error('❌ System audit failed.');
  }

  // 3. Run git-asset-audit
  console.log('3️⃣ Running Git Asset safety audit...');
  try {
    // Run the compiled JS or compile script on the fly with tsx
    execSync('npx tsx scripts/git-asset-audit.ts', { cwd: REPO_ROOT, stdio: 'pipe' });
    console.log('✅ Git asset audit passed.');
  } catch (err: any) {
    assetAuditResult = 'failing';
    console.error('❌ Git asset audit failed.');
  }

  const isReady = buildResult === 'passing' && auditResult === 'passing' && assetAuditResult === 'passing';
  const pushReadiness = isReady ? 'READY' : 'BLOCKED';
  
  let nextAction = '';
  if (isReady) {
    nextAction = 'Repository is completely safe and ready for deployment. You may safely run "git push" to update remote origin.';
  } else {
    nextAction = 'Push blocked due to policy/safety failures. Review findings in the specific report logs above and resolve all flagged conflicts, size violations, or compiling issues before re-running verification check.';
  }

  // Load template prepush-check-template.md
  const templatePath = path.join(REPO_ROOT, 'templates', 'git_audits', 'prepush-check-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template file not found: ${templatePath}`);
    process.exit(1);
  }

  let templateContent = fs.readFileSync(templatePath, 'utf-8');
  templateContent = templateContent
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{TIMESTAMP}}/g, timestamp)
    .replace(/{{PUSH_READINESS}}/g, pushReadiness)
    .replace(/{{BUILD_RESULT}}/g, buildResult.toUpperCase())
    .replace(/{{AUDIT_RESULT}}/g, auditResult.toUpperCase())
    .replace(/{{ASSET_AUDIT_RESULT}}/g, assetAuditResult.toUpperCase())
    .replace(/{{BUILD_SUMMARY}}/g, buildSummary)
    .replace(/{{AUDIT_SUMMARY}}/g, auditSummary)
    .replace(/{{NEXT_ACTION}}/g, nextAction);

  fs.writeFileSync(reportPath, templateContent);
  console.log(`📝 Pre-Push Safety Check completed. Saved report: ${reportPath}`);

  return {
    success: isReady,
    reportPath
  };
}

if (require.main === module) {
  const result = runPrepushCheck();
  if (!result.success) {
    console.error('❌ Pre-Push Safety check blocked. Address the issues before pushing.');
    process.exit(1);
  } else {
    console.log('✅ Pre-Push safety check passed. Safe to push!');
    process.exit(0);
  }
}
