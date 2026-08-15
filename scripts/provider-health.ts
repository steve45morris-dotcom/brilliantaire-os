import { ModelRouter } from '../src/ai/model_router.js';

async function main() {
  console.log("=========================================");
  console.log("🔍 AI PROVIDER HEALTH CHECK");
  console.log("=========================================");
  
  const router = ModelRouter.getInstance();
  const credentials = router.verifyCredentials();
  
  console.log(`OpenAI Gateway:    ${credentials.openai ? '✅ CONFIGURING (Key set)' : '⚠️ UNCONFIGURED (Running in Sandboxed Mock)'}`);
  console.log(`Gemini Gateway:    ${credentials.gemini ? '✅ CONFIGURING (Key set)' : '⚠️ UNCONFIGURED (Running in Sandboxed Mock)'}`);
  console.log(`Anthropic Gateway: ${credentials.anthropic ? '✅ CONFIGURING (Key set)' : '⚠️ UNCONFIGURED (Running in Sandboxed Mock)'}`);
  
  console.log("\n🧪 Testing routing execution on default provider (Gemini)...");
  try {
    const res = await router.route({
      systemPrompt: "You are a health check system.",
      userPrompt: "Verify connectivity.",
      options: { provider: 'gemini', timeoutMs: 2000, maxRetries: 1 }
    });
    console.log("🚀 Route Test success!");
    console.log(`- **Provider:** ${res.provider}`);
    console.log(`- **Latency:**  ${res.latencyMs}ms`);
    console.log(`- **Tokens:**   ${res.tokensUsed}`);
    console.log("=========================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ Route Test failed:", (err as Error).message);
    console.log("=========================================");
    process.exit(1);
  }
}

main();
