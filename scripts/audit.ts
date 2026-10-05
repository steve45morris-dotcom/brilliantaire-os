import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface AuditResult {
  section: string;
  name: string;
  passed: boolean;
  message: string;
}

const auditLog: AuditResult[] = [];

function addLog(section: string, name: string, passed: boolean, message: string) {
  auditLog.push({ section, name, passed, message });
  const icon = passed ? '🟩' : '🟥';
  console.log(`[${section}] ${icon} ${name}: ${message}`);
}

function runAudit() {
  console.log("=========================================");
  console.log("🔍 RUNNING SYSTEM INTEGRITY AUDIT: IcyOS");
  console.log("=========================================");

  let healthy = true;

  // 1. Files existence check
  const criticalFiles = [
    'BLUEPRINT.md',
    'package.json',
    'tsconfig.json',
    'tsconfig.scripts.json',
    'eslint.config.js',
    'Taskfile.yml',
    'src/index.ts',
    'SYSTEM_STATUS.md',
    'PROJECTS.md',
    'DECISIONS.md',
    'NEXT_ACTIONS.md'
  ];

  for (const file of criticalFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      addLog("Files", file, true, "File exists");
    } else {
      addLog("Files", file, false, "File is MISSING");
      healthy = false;
    }
  }

  // 2. Scripts validation in package.json
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const requiredScripts = ['typecheck', 'lint', 'test', 'build', 'audit', 'verify'];
      const scripts = packageJson.scripts || {};

      for (const reqScript of requiredScripts) {
        if (reqScript in scripts) {
          addLog("PackageScripts", reqScript, true, `Script exists: "${scripts[reqScript]}"`);
        } else {
          addLog("PackageScripts", reqScript, false, "Script is MISSING");
          healthy = false;
        }
      }
    } catch (e) {
      addLog("PackageScripts", "Parsing", false, `Failed to parse package.json: ${(e as Error).message}`);
      healthy = false;
    }
  }

  // 3. Compiler Coverage Scope
  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      const includes = tsconfig.include || [];
      if (includes.includes("src/**/*")) {
        addLog("Compiler", "src-coverage", true, "src/ folder is included in primary compilation");
      } else {
        addLog("Compiler", "src-coverage", false, "src/ folder is missing from tsconfig include scope");
        healthy = false;
      }
    } catch (e) {
      addLog("Compiler", "Parsing", false, `Failed to parse tsconfig.json: ${(e as Error).message}`);
      healthy = false;
    }
  }

  const tsconfigScriptsPath = path.join(rootDir, 'tsconfig.scripts.json');
  if (fs.existsSync(tsconfigScriptsPath)) {
    addLog("Compiler", "scripts-coverage", true, "tsconfig.scripts.json exists for scripts/ verification");
  } else {
    addLog("Compiler", "scripts-coverage", false, "tsconfig.scripts.json is MISSING");
    healthy = false;
  }

  // 4. Verification of Phantom Claims
  const codeFilesSearch = [
    { term: 'controlPlaneOnly', status: 'DOCUMENTATION ONLY' },
    { term: 'freezeStatus', status: 'DOCUMENTATION ONLY' },
    { term: 'healthIntegration', status: 'DOCUMENTATION ONLY' }
  ];

  // We scan the src/ directory for these terms to ensure they are not claimed as active if missing.
  for (const item of codeFilesSearch) {
    let foundInSrc = false;
    try {
      const grepResult = execSync(`grep -rn "${item.term}" "${path.join(rootDir, 'src')}" 2>/dev/null || true`).toString();
      if (grepResult.trim().length > 0) {
        foundInSrc = true;
      }
    } catch (e) {}

    if (foundInSrc) {
      addLog("PhantomClaims", item.term, false, `Claimed term found inside src/ code but has no verified implementation`);
      healthy = false;
    } else {
      addLog("PhantomClaims", item.term, true, `Term is documented but correctly absent from core src/ code execution paths`);
    }
  }

  // 5. Shell Scripts Syntax validation
  const shellScripts = [
    '.agents/speak_serialized.sh',
    '.agents/voice_narrative.sh'
  ];

  for (const shScript of shellScripts) {
    const shPath = path.join(rootDir, shScript);
    if (fs.existsSync(shPath)) {
      try {
        // Run bash -n syntax check
        execSync(`bash -n "${shPath}"`);
        addLog("ShellSyntax", shScript, true, "Syntax passes check (bash -n)");
      } catch (e) {
        addLog("ShellSyntax", shScript, false, `Syntax check failed: ${(e as Error).message}`);
        healthy = false;
      }
    } else {
      addLog("ShellSyntax", shScript, false, "File is MISSING");
      healthy = false;
    }
  }

  console.log("\n=========================================");
  if (healthy) {
    console.log("🎉 AUDIT PASSED: System execution foundation is stable.");
    console.log("=========================================");
    process.exit(0);
  } else {
    console.error("🚨 AUDIT FAILED: Critical execution integrity issues found.");
    console.log("=========================================");
    process.exit(1);
  }
}

runAudit();
