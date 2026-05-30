import { PLATFORM_CONFIGS } from '../config/platform-adapters.js';

function printHelp() {
  console.log("=================================================================================");
  console.log("🛰️ PLATFORM OUTPUT ADAPTERS: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("Purpose:");
  console.log("  Prepares manual copy-paste posting packages for social channels & local Obsidian notes.");
  console.log("  Strictly local - no internet connections, platform API uploads, or automatic posting.");
  console.log("");
  console.log("Available Configurations:");
  Object.keys(PLATFORM_CONFIGS).forEach(key => {
    const config = PLATFORM_CONFIGS[key];
    console.log(`  🔹 ${config.name}`);
    console.log(`     Output Folder: ${config.outputFolder}`);
    console.log(`     Config Fields: ${config.fields.join(', ')}`);
  });
  console.log("");
  console.log("Available Commands:");
  console.log("  npm run platform-adapter-help                 Print this help manual.");
  console.log("  npm run platform-adapter -- \"sporty youtube\"   Generate YouTube posting package.");
  console.log("  npm run platform-adapter -- \"sporty tiktok\"    Generate TikTok posting package.");
  console.log("  npm run platform-adapter -- \"sporty instagram\" Generate Instagram posting package.");
  console.log("  npm run platform-adapter -- \"sporty facebook\"  Generate Facebook posting package.");
  console.log("  npm run platform-adapter -- \"sporty whatsapp\"  Generate WhatsApp posting package.");
  console.log("  npm run platform-adapter -- \"sporty obsidian\"  Generate Obsidian note package.");
  console.log("  npm run platform-adapter -- \"sporty all\"        Generate packages for all platforms.");
  console.log("  npm run platform-adapter -- \"status sporty\"     Check generated package statuses.");
  console.log("=================================================================================");
}

printHelp();
