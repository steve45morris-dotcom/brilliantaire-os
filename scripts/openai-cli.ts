import { BootManager } from '../src/kernel/boot/BootManager.js';
import { globalServiceRegistry } from '../src/kernel/registry/ServiceRegistry.js';
import { getOpenAIConfig, redactOpenAIToken, validateOpenAIKey } from '../src/integrations/openai/OpenAIConfig.js';
import { globalOpenAIIntegrationContract } from '../src/integrations/openai/OpenAIIntegrationContract.js';
import { OpenAIToolRegistry } from '../src/integrations/openai/OpenAIToolRegistry.js';
import { withLiveSession } from './lib/withLiveSession.js';

const cmd = process.argv[2] || 'status';

const promptIndex = process.argv.indexOf('--prompt');
const promptVal = promptIndex !== -1 && process.argv[promptIndex + 1] 
  ? process.argv[promptIndex + 1] 
  : 'Return a short health confirmation for The One System.';

async function main() {
  const bootManager = new BootManager();
  await bootManager.boot();

  const config = getOpenAIConfig();
  console.log(`[OpenAI CLI] Command: ${cmd}`);
  
  const maskedToken = redactOpenAIToken(config.apiKey);
  console.log(`[OpenAI CLI] Token: ${maskedToken}`);
  console.log(`[OpenAI CLI] Default Model: ${config.defaultModel}`);

  const openAIService = globalServiceRegistry.getService('OpenAIIntegration');
  if (!openAIService) {
    throw new Error('OpenAIIntegration service is not registered in the Kernel ServiceRegistry');
  }

  await withLiveSession(`openai:${cmd}`, async () => {
    switch (cmd) {
      case 'status': {
        const stats = openAIService.getStats();
        const health = await globalOpenAIIntegrationContract.healthCheck();
        console.log('Status payload:');
        console.log(JSON.stringify({ health, stats }, null, 2));
        break;
      }
      case 'health': {
        const health = await globalOpenAIIntegrationContract.healthCheck();
        console.log('Health payload:');
        console.log(JSON.stringify(health, null, 2));
        break;
      }
      case 'test': {
        console.log(`Running text test prompt: "${promptVal}"`);
        const res = await openAIService.executeRequest({
          requestId: `cli-test-${Date.now()}`,
          sessionId: 'cli-test-session',
          workspaceId: 'default-workspace',
          userIntent: promptVal,
          selectedModel: config.defaultModel,
          approvalStatus: 'none',
          allowedTools: []
        });
        console.log('Test execution response:');
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case 'models': {
        console.log('Configured Models Registry roles mapping:');
        console.log(JSON.stringify({
          default: config.defaultModel,
          reasoning: config.reasoningModel,
          fast: config.fastModel,
          realtime: config.realtimeModel,
          embedding: config.embeddingModel
        }, null, 2));
        break;
      }
      case 'usage':
      case 'cost': {
        const stats = openAIService.getStats();
        console.log('Usage & Cost Metrics:');
        console.log(JSON.stringify({
          dailySpend: `$${stats.dailySpend.toFixed(4)} / $${config.dailyBudgetLimit}`,
          monthlySpend: `$${stats.monthlySpend.toFixed(4)} / $${config.monthlyBudgetLimit}`,
          totalRequests: stats.totalRequests,
          totalSuccess: stats.totalSuccess,
          totalFailure: stats.totalFailure
        }, null, 2));
        break;
      }
      case 'tools': {
        const tools = OpenAIToolRegistry.getToolsSchema();
        console.log('Registered OpenAI Action Tools Schema:');
        console.log(JSON.stringify(tools, null, 2));
        break;
      }
      case 'realtime-status': {
        console.log('Realtime Service Configurations:');
        console.log(JSON.stringify({
          enabled: config.enableRealtime,
          realtimeModel: config.realtimeModel,
          browserFallback: true
        }, null, 2));
        break;
      }
      case 'verify-config': {
        const auth = globalOpenAIIntegrationContract.authentication;
        const health = await globalOpenAIIntegrationContract.healthCheck();
        console.log('OpenAI Credentials Verification:');
        console.log(JSON.stringify({
          configured: auth.authenticated ? 'yes' : 'no',
          maskedKey: auth.maskedToken,
          authenticationResult: auth.authenticated ? 'success' : 'failure',
          providerIdentity: 'openai',
          healthState: health.status
        }, null, 2));
        break;
      }
      default:
        console.log(`Unknown command: ${cmd}`);
    }
  });
}

main().catch(console.error);
