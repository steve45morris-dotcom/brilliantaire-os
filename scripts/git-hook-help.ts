export function printHelp(): void {
  console.log('========================================================================');
  console.log('⚓ GIT PRE-PUSH HOOK INSTALLER & SAFETY CONTROLLER');
  console.log('========================================================================');
  console.log('Purpose:');
  console.log('  Automates local push protection by running build, system static audit,');
  console.log('  and repository asset policy compliance audits on every "git push"');
  console.log('  operation. If any script fails, push is blocked automatically.');
  console.log('');
  
  console.log('⚠️  IMPORTANT SECURITY NOTE:');
  console.log('  The live hook file ".git/hooks/pre-push" is local-only and will NEVER');
  console.log('  be tracked or committed to the remote git repository. Only the');
  console.log('  reusable templates under "hooks/" and "templates/git_hooks/" are tracked.');
  console.log('');

  console.log('💻 Available Script Commands:');
  console.log('  - npm run git-hook-help');
  console.log('    Print this policy and execution help menu.');
  console.log('  - npm run git-hook-install');
  console.log('    Installs/registers hook by writing ".git/hooks/pre-push".');
  console.log('    Backs up any pre-existing hook to pre-push.brilliantaire-backup-YYYYMMDD-HHMMSS.');
  console.log('  - npm run git-hook-status');
  console.log('    Inspects if hook exists, is executable, and contains prepush check.');
  console.log('  - npm run git-hook-uninstall');
  console.log('    Disables active hook by moving it to pre-push.disabled-YYYYMMDD-HHMMSS.');
  console.log('');

  console.log('🚀 Recommended Local Workflow:');
  console.log('  Always keep the hook active in your local workspace. This ensures');
  console.log('  automatic policy audits run locally before code leaves your system.');
  console.log('========================================================================');
}

if (process.argv[1] && (process.argv[1].endsWith('git-hook-help.ts') || process.argv[1].endsWith('git-hook-help.js') || process.argv[1].includes('git-hook-help'))) {
  printHelp();
}
