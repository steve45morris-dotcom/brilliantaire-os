import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function checkFileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function runAudit() {
  console.log("=========================================");
  console.log("🔍 RUNNING SYSTEM AUDIT: Brilliantaire OS");
  console.log("=========================================");

  let healthy = true;
  const criticalFiles = [
    'BLUEPRINT.md',
    'package.json',
    'tsconfig.json',
    'Taskfile.yml',
    'src/index.ts',
    'SYSTEM_STATUS.md',
    'PROJECTS.md',
    'DECISIONS.md',
    'NEXT_ACTIONS.md'
  ];

  console.log("\n[1] Checking Core Files:");
  for (const file of criticalFiles) {
    const filePath = path.join(rootDir, file);
    if (checkFileExists(filePath)) {
      console.log(`  ✅ ${file} exists.`);
    } else {
      console.error(`  ❌ ${file} is MISSING!`);
      healthy = false;
    }
  }

  console.log("\n[2] Checking Skills Sandbox:");
  const skillsDir = path.join(rootDir, '.agents', 'skills');
  if (checkFileExists(skillsDir)) {
    const stats = fs.statSync(skillsDir);
    if (stats.isDirectory()) {
      const folders = fs.readdirSync(skillsDir).filter(item => {
        const itemPath = path.join(skillsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
      console.log(`  ✅ Skills folder exists.`);
      console.log(`  ✅ Detected ${folders.length} sandboxed skills.`);
      if (folders.length === 0) {
        console.error("  ❌ Skills folder is empty!");
        healthy = false;
      }
    } else {
      console.error("  ❌ Skills path is not a directory!");
      healthy = false;
    }
  } else {
    console.error("  ❌ Skills folder (.agents/skills) is MISSING!");
    healthy = false;
  }

  console.log("\n=========================================");
  if (healthy) {
    console.log("🎉 AUDIT PASSED: System is stable.");
    console.log("=========================================");
    process.exit(0);
  } else {
    console.error("🚨 AUDIT FAILED: Critical components missing.");
    console.log("=========================================");
    process.exit(1);
  }
}

runAudit();
