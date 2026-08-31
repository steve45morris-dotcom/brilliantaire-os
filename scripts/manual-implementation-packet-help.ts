export function printHelp() {
  console.log(`
Manual Implementation Packet Compiler CLI - Help Menu
${'='.repeat(55)}

  Tool:    Manual Implementation Packet Compiler
  Type:    Pipeline Implementation Compiler
  Mode:    manual-first (no automated builds)
  Target:  BRILLIANTAIRE OS Pipeline

${'='.repeat(55)}

  COMMANDS:

  status
    Print compiler configuration, safety flags,
    input/output state, and current pipeline status.

  compile-prompt
    Read approved packet and compile final manual
    build prompt from template. The prompt is for
    HUMAN manual execution only.

  checklist
    Generate implementation checklist from approved
    packet. Validates all prerequisite artifacts and
    flags compliance status.

  safety-review
    Generate safety review of proposed implementation.
    Audits all safety flags, blocked actions, and
    boundary constraints. Must pass before handoff.

  handoff
    Generate final handoff document for manual
    implementation. Bundles prompt, checklist, and
    safety review references. Blocked if safety
    review was rejected.

  obsidian-export
    Stage implementation packet summary for Obsidian
    export via the Approved Write Gateway.

${'='.repeat(55)}

  EXAMPLES:

  npm run manual-implementation-packet -- "status"
  npm run manual-implementation-packet -- "compile-prompt"
  npm run manual-implementation-packet -- "checklist"
  npm run manual-implementation-packet -- "safety-review"
  npm run manual-implementation-packet -- "handoff"
  npm run manual-implementation-packet -- "obsidian-export"

${'='.repeat(55)}

  RECOMMENDED WORKFLOW:

  1. compile-prompt   (generate the build prompt)
  2. checklist        (verify all prerequisites)
  3. safety-review    (audit safety constraints)
  4. handoff          (bundle for human execution)
  5. obsidian-export  (stage summary for vault)

${'='.repeat(55)}

  SAFETY RULES:

  - NO automated code generation or build execution
  - NO external API calls
  - NO autonomous script execution
  - NO direct Obsidian vault writes
  - All output is read-only staging
  - Build prompts are for HUMAN manual execution only
  - Safety review must pass before handoff is allowed
  - Human review required at every stage

${'='.repeat(55)}

  INPUT SOURCES:

  - outputs/pipeline_approval_router/
  - outputs/pipeline_stage_gate/
  - outputs/knowledge_harvest/pipeline_approval_router/
  - outputs/knowledge_harvest/pipeline_stage_gate/

  OUTPUT DIRECTORIES:

  - outputs/manual_implementation_packet/build_prompts/
  - outputs/manual_implementation_packet/checklists/
  - outputs/manual_implementation_packet/safety_reviews/
  - outputs/manual_implementation_packet/handoffs/
  - outputs/manual_implementation_packet/obsidian_exports/
  - outputs/manual_implementation_packet/logs/

${'='.repeat(55)}
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('manual-implementation-packet-help.ts') || process.argv[1]?.endsWith('manual-implementation-packet-help.js')) {
  printHelp();
}
