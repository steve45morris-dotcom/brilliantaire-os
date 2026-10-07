import { TestOrchestrator } from '../src/kernel/testing/TestOrchestrator.js';

async function run() {
  console.log('🏁 Starting Antigravity Core-System Test Orchestration...');
  const orchestrator = TestOrchestrator.getInstance();
  
  try {
    const summary = await orchestrator.executeOrchestration();
    console.log('\n📊 Test Orchestration Summary:');
    console.log(`- Timestamp: ${summary.timestamp}`);
    console.log(`- Total Tests: ${summary.totalTests}`);
    console.log(`- Passed Tests: ${summary.passedTests}`);
    console.log(`- Failed Tests: ${summary.failedTests}`);
    console.log(`- Success Rate: ${summary.successRate.toFixed(2)}%`);
    console.log(`- Synthetic Release Simulation: ${summary.syntheticSimulationPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`- Duration: ${summary.durationMs}ms\n`);

    if (summary.failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Test Orchestration failed:', err);
    process.exit(1);
  }
}

run();
