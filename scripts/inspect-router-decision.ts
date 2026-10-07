import { AgentRouter } from '../src/agent-upgrade/router.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1];
      if (val && !val.startsWith('--')) {
        params[key] = val;
        i++;
      } else {
        params[key] = 'true';
      }
    }
  }
  return params;
}

async function main() {
  const params = parseArgs();
  const request = params.request;

  if (!request) {
    console.error('Usage: npm run inspect-router-decision -- --request "[prompt-request-string]"');
    process.exit(1);
  }

  const router = new AgentRouter();
  const decision = router.inspectAndRoute(`inspect-${Date.now()}`, request);

  console.log('\n======================================');
  console.log('       ROUTER DECISION INSPECTION     ');
  console.log('======================================');
  console.log(`Original Request:      "${decision.requestText}"`);
  console.log(`Detected Intent:       ${decision.detectedIntent}`);
  console.log(`Agent Assignment:      ${decision.agentAssignment}`);
  if (decision.workflowSelection) {
    console.log(`Workflow Selection:    ${decision.workflowSelection}`);
  } else {
    console.log(`Workflow Selection:    None (One-shot task)`);
  }
  console.log(`Required Skills:       ${decision.requiredSkills.join(', ') || 'None'}`);
  console.log(`Human Approval Gate:   ${decision.humanApprovalRequired ? 'REQUIRED ⚠️' : 'None'}`);
  console.log(`Background Queue:      ${decision.backgroundQueueRequired ? 'REQUIRED ➔' : 'None'}`);
  console.log('--------------------------------------');
  console.log('Routing Logic Reasoning:');
  console.log(`  ${decision.reasoning}`);
  console.log('======================================\n');
}

main();
