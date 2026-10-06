import { BootManager } from '../src/kernel/boot/BootManager.js';
import { globalIntegrationRegistry } from '../src/integrations/core/IntegrationRegistry.js';
import { getGeminiConfig, validateGeminiKey, redactGeminiToken } from '../src/integrations/gemini/GeminiConfig.js';
import { withLiveSession } from './lib/withLiveSession.js';

const cmd = process.argv[2] || 'status';

async function main() {
  const bootManager = new BootManager();
  await bootManager.boot();

  const config = getGeminiConfig();
  console.log(`[Gemini CLI] Command: ${cmd}`);
  const maskedToken = redactGeminiToken(config.apiKey);
  console.log(`[Gemini CLI] Token: ${maskedToken}`);
  console.log(`[Gemini CLI] Default Model: ${config.defaultModel}`);

  const geminiIntegration = globalIntegrationRegistry.get('gemini') as any;
  if (!geminiIntegration) {
    throw new Error('Gemini integration is not registered.');
  }

  await withLiveSession(`gemini:${cmd}`, async () => {
    switch (cmd) {
      case 'status': {
        const health = await geminiIntegration.healthCheck();
        console.log('Status payload:');
        console.log(JSON.stringify({ health, config: { defaultModel: config.defaultModel, fastModel: config.fastModel } }, null, 2));
        break;
      }
      case 'health': {
        const health = await geminiIntegration.healthCheck();
        console.log('Health payload:');
        console.log(JSON.stringify(health, null, 2));
        break;
      }
      default:
        console.log(`Unknown command: ${cmd}`);
    }
  });
}

main().catch(console.error);
