import { AUTOMATION_ROUTINES } from "../config/automation";

console.log("=========================================");
console.log("🌌 BRILLIANTAIRE OS - AUTOMATION REGISTRY");
console.log("=========================================");

Object.values(AUTOMATION_ROUTINES).forEach((routine) => {
  console.log(`\nRoutine: \x1b[36m${routine.name}\x1b[0m`);
  console.log(`  Description:   ${routine.description}`);
  console.log(`  Owning Agent:  ${routine.owningAgent}`);
  console.log(`  Risk Level:    \x1b[33m${routine.riskLevel.toUpperCase()}\x1b[0m`);
  console.log(`  Status:        ${routine.enabled ? "\x1b[32mENABLED\x1b[0m" : "\x1b[31mDISABLED\x1b[0m"}`);
  console.log(`  Command Count: ${routine.commands.length}`);
  console.log("  Commands:");
  routine.commands.forEach((cmd) => {
    console.log(`    - ${cmd}`);
  });
});
console.log("\n=========================================");
