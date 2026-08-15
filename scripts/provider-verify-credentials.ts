import { ModelRouter } from '../src/ai/model_router.js';

function main() {
  console.log("=========================================");
  console.log("🔒 AI PROVIDER CREDENTIAL VERIFICATION");
  console.log("=========================================");
  
  const router = ModelRouter.getInstance();
  const credentials = router.verifyCredentials();
  
  let allConfigured = true;
  for (const [provider, status] of Object.entries(credentials)) {
    console.log(`- **${provider.toUpperCase()}** key status: ${status ? 'ACTIVE (Environment configured)' : 'INACTIVE'}`);
    if (!status) {
      allConfigured = false;
    }
  }
  
  console.log("-----------------------------------------");
  if (allConfigured) {
    console.log("✅ Credentials verification: SUCCESS (All keys present)");
  } else {
    console.log("ℹ️ Verification Notice: Running in Sandboxed Mock mode for missing keys. No actions required.");
  }
  console.log("=========================================");
  process.exit(0);
}

main();
