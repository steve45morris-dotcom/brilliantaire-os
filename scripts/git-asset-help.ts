import { FORBIDDEN_FOLDERS, FORBIDDEN_EXTENSIONS, SENSITIVE_FILES, MAX_TRACKED_FILE_SIZE_MB } from '../config/git-asset-policy';

export function printHelp(): void {
  console.log('========================================================================');
  console.log('🛡️  GIT ASSET GUARD & PRE-PUSH SAFETY AUDIT POLICY');
  console.log('========================================================================');
  console.log('Purpose:');
  console.log('  Prevents repository instability by blocking large binary files,');
  console.log('  unwanted generated assets, secrets, and git merge conflict markers');
  console.log('  from being committed or pushed to the remote repository.');
  console.log('');
  
  console.log('🚫 Forbidden Folders:');
  FORBIDDEN_FOLDERS.forEach(folder => console.log(`  - ${folder}`));
  console.log('');

  console.log('🚫 Forbidden Extensions:');
  console.log(`  ${FORBIDDEN_EXTENSIONS.join(', ')}`);
  console.log('');

  console.log('🔐 Sensitive Files (Secrets):');
  console.log(`  ${SENSITIVE_FILES.join(', ')}`);
  console.log('');

  console.log(`⚖️  Max File Size Limit:`);
  console.log(`  ${MAX_TRACKED_FILE_SIZE_MB} MB`);
  console.log('');

  console.log('💻 Available Safe Commands:');
  console.log('  - npm run git-asset-help');
  console.log('    Print this policy and execution help menu.');
  console.log('  - npm run git-asset-audit');
  console.log('    Audit the working tree and tracked files for policy violations.');
  console.log('  - npm run git-prepush-check');
  console.log('    Sequentially run compiler build, audit checks, and asset audit.');
  console.log('');

  console.log('🚀 Recommended Pre-Push Routine:');
  console.log('  Always execute "npm run git-prepush-check" prior to performing a push.');
  console.log('  If any violations are flagged, resolve them locally using command guidelines:');
  console.log('    To untrack a file without deleting it: git rm --cached <filepath>');
  console.log('    To check staged state: git status');
  console.log('    Do not force push to origin under any circumstances.');
  console.log('========================================================================');
}

if (require.main === module) {
  printHelp();
}
