function printMeshTelemetryHelp() {
  console.log("=================================================================================");
  console.log("📊 SAFE MESH TELEMETRY LOGGER: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("");
  console.log("Purpose:");
  console.log("  Audits local system status, commands run, voice logs, and validation scores,");
  console.log("  compiling unified telemetry snapshots. Strictly local/offline.");
  console.log("");
  console.log("Safety Rules:");
  console.log("  1. No External APIs: Performs read-only files scans inside repo.");
  console.log("  2. No Deletions or Edits: Runs fully non-destructively.");
  console.log("  3. No Shell Execution: Abstractions are purely file-based.");
  console.log("");
  console.log("Available Commands:");
  console.log("  npm run mesh-telemetry -- \"help\"              Display this help menu.");
  console.log("  npm run mesh-telemetry -- \"snapshot\"          Compile a markdown system snapshot.");
  console.log("  npm run mesh-telemetry -- \"report\"            Compile a unified telemetry report.");
  console.log("  npm run mesh-telemetry -- \"campaign sporty\"   Compile campaign metrics for Sporty rollout.");
  console.log("  npm run mesh-telemetry -- \"status\"            Print summary dashboard log statuses.");
  console.log("=================================================================================");
}

printMeshTelemetryHelp();
