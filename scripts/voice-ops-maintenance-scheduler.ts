import { executeRoutineCommand } from '../src/scheduler_layer.js';

async function main() {
  console.log("🛠️ Starting Voice Ops Maintenance Scheduler...");
  try {
    const code = await executeRoutineCommand('voice-check');
    if (code === 0) {
      console.log("✅ Voice Ops Maintenance check completed successfully.");
      process.exit(0);
    } else {
      console.error("❌ Voice Ops Maintenance check execution failed.");
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Error in Voice Ops Maintenance Scheduler:", err);
    process.exit(1);
  }
}

main();
