import { OutcomeIntelligenceEngine } from '../src/agent-upgrade/intelligence.js';

async function main() {
  console.log('Generating Outcome Intelligence Reports...');
  const engine = new OutcomeIntelligenceEngine();

  const daily = engine.generateDailyOutcomeSummary();
  console.log('✓ Daily Outcome Summary report written.');

  const weekly = engine.generateWeeklyImprovementReport();
  console.log('✓ Weekly Improvement Report written.');

  const bottlenecks = engine.generateBottleneckReport();
  console.log('✓ Operational Bottleneck Report written.');

  const performant = engine.generateHighPerformingWorkflowReport();
  console.log('✓ High-Performing Workflows report written.');

  console.log('\nAll reports written to folder: /Users/alexanderanthony/reports/');
}

main();
