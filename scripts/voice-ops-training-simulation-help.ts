console.log(`
🎓 Sentinel OS: Operator Training Simulation Pack (Phase N5V)
=====================================================================
Offline training drills and scenario simulations to educate human
operators on safely managing the Voice Ops pipeline. Runs local,
read-only validation exercises without mutating production systems.

Usage:
  npm run voice-ops-training-simulation -- "<command> [arguments]"

Command Menu:
  status                        Show paths, safety flags, and training progress metrics.
  generate-scenarios            Generate the 10 local mock scenario definitions.
  list-scenarios                List all configured simulation scenarios.
  inspect-scenario <ID>         Show training objective, starting state, and actions rules.
  start-simulation <ID>         Start a training session and generate a SIMULATION_ID.
  answer-step <SIM_ID> <STEP> --response "<TEXT>"
                                Record response for a specific scenario step.
  score-simulation <SIM_ID>     Grade responses against safe and forbidden rules.
  simulation-status <SIM_ID>    View simulation progress, inputs, and score verdict.
  latest                        Print details of the latest simulation attempt.
  list-attempts                 List all historical simulation attempts.
  training-summary              Generate a markdown training summary report.
  training-log                  Print recent training log events.

Safety Rule Matrix:
  - NO live recorders, ASR commands, or Piper TTS render execution.
  - NO production queue packet mutation or artifact deletions.
  - NO auto-repairs, auto-restores, or auto-rollbacks.
=====================================================================
`);
