import { SharedMemoryManager } from '../src/agent-upgrade/memory.js';

async function main() {
  const memory = new SharedMemoryManager();
  const summary = memory.getFullMemory();

  console.log('\n======================================');
  console.log('       SHARED MEMORY LAYER STATUS     ');
  console.log('======================================');

  console.log('PROJECT CONTEXT:');
  console.log(JSON.stringify(summary.projectContext, null, 2));
  console.log('--------------------------------------');

  console.log('ACTIVE GOALS:');
  if (summary.activeGoals.length === 0) {
    console.log('  No active goals.');
  } else {
    summary.activeGoals.forEach((goal, idx) => console.log(`  ${idx + 1}. ${goal}`));
  }
  console.log('--------------------------------------');

  console.log('DECISIONS RECORDED:');
  if (summary.decisions.length === 0) {
    console.log('  No decisions recorded.');
  } else {
    summary.decisions.forEach((dec) => {
      console.log(`  - [${dec.timestamp.split('T')[0]}] ${dec.title}: ${dec.decision}`);
    });
  }
  console.log('--------------------------------------');

  console.log('LESSONS LEARNED:');
  if (summary.lessonsLearned.length === 0) {
    console.log('  No lessons recorded.');
  } else {
    summary.lessonsLearned.forEach((lesson) => console.log(`  - ${lesson}`));
  }

  if (summary.blockedItems.length > 0) {
    console.log('--------------------------------------');
    console.warn('⚠️  BLOCKED ITEMS:');
    summary.blockedItems.forEach((b) => console.warn(`  - ${b}`));
  }
  console.log('======================================\n');
}

main();
