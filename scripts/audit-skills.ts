import { SkillRegistryManager } from '../src/agent-upgrade/registry.js';

async function main() {
  console.log('Auditing skills registry...');
  const manager = new SkillRegistryManager();
  const report = manager.auditSkills();

  console.log('\n======================================');
  console.log('      SKILL REGISTRY HEALTH AUDIT     ');
  console.log('======================================');
  console.log(`Total Registered Skills:   ${report.totalSkills}`);
  console.log(`Active Skills:              ${report.activeCount}`);
  console.log(`Experimental Skills:        ${report.experimentalCount}`);
  console.log(`Deprecated Skills:          ${report.deprecatedCount}`);
  console.log(`Archived Skills:            ${report.archivedCount}`);
  console.log(`Average Success Rate:       ${(report.averageSuccessRate * 100).toFixed(0)}%`);
  console.log('--------------------------------------');

  if (report.retirementCandidates.length > 0) {
    console.warn('⚠️  RETIREMENT CANDIDATES (Success Rate < 50%):');
    report.retirementCandidates.forEach((s) => console.log(`   - ${s}`));
  } else {
    console.log('✓ No retirement candidates identified.');
  }

  if (report.unusedSkills.length > 0) {
    console.log('\nℹ️  UNUSED SKILLS (Usage count = 0):');
    report.unusedSkills.forEach((s) => console.log(`   - ${s}`));
  } else {
    console.log('✓ All skills have been executed in runs.');
  }

  if (report.staleSkills.length > 0) {
    console.log('\nℹ️  STALE SKILLS (Unused in last 30 days):');
    report.staleSkills.forEach((s) => console.log(`   - ${s}`));
  }

  if (report.overlappingSkills.length > 0) {
    console.warn('\n⚠️  POTENTIAL OVERLAPPING SKILLS:');
    report.overlappingSkills.forEach((s) => console.log(`   - ${s}`));
  } else {
    console.log('✓ No overlapping keywords detected across categories.');
  }
  console.log('======================================\n');
}

main();
