console.log(`
${'='.repeat(50)}
Episode 1 Manual Render Intake - CLI Help
${'='.repeat(50)}

  Tool:    Episode 1 Manual Render Intake
  Type:    Render Asset Intake & Validation
  Mode:    manual-first (no automated moves)
  Target:  ICYFLAMZE CORE Creative Pipeline

${'='.repeat(50)}

  COMMANDS:

  status
    Print bridge configuration, safety flags,
    output directory inventory, and input folder
    status.

  scan
    Scan incoming asset folders and generate an
    inventory report of all rendered assets found
    in the incoming and reviewed directories.

  validate <ASSET_TYPE>
    Validate assets against Phase 14D queue manifest.
    Types: image, video, audio, all

  visual-continuity
    Generate visual continuity checklist from
    scanned image and video assets. Includes
    color consistency, style alignment, resolution,
    and framing checks.

  audio-review
    Generate audio review checklist from scanned
    audio assets. Includes format validation,
    quality checks, sync alignment, and levels.

  readiness
    Generate assembly readiness report checking
    all asset categories, review status, and
    computing an overall readiness score.

  revision-log
    Generate revision log for the current intake
    cycle, summarizing all scan, validation, and
    checklist activity.

  obsidian-export
    Stage render intake summary for Obsidian
    export via the Approved Write Gateway.

${'='.repeat(50)}

  EXAMPLES:

  npm run render-intake -- "status"
  npm run render-intake -- "scan"
  npm run render-intake -- "validate all"
  npm run render-intake -- "validate image"
  npm run render-intake -- "validate video"
  npm run render-intake -- "validate audio"
  npm run render-intake -- "visual-continuity"
  npm run render-intake -- "audio-review"
  npm run render-intake -- "readiness"
  npm run render-intake -- "revision-log"
  npm run render-intake -- "obsidian-export"

${'='.repeat(50)}

  SAFETY RULES:

  - No automated file moves, copies, or deletions
  - No external API calls or asset downloads
  - All output is read-only staging (markdown reports)
  - All validation is reporting-only (does not modify assets)
  - Assembly requires explicit human approval
  - Human review required before any asset progression

${'='.repeat(50)}

  ASSET INTAKE WORKFLOW:

  1. Human places rendered assets in inputs/render_intake/incoming/
  2. Run 'scan' to generate inventory report
  3. Run 'validate all' to check naming and format compliance
  4. Run 'visual-continuity' for image/video consistency checks
  5. Run 'audio-review' for audio quality checks
  6. Human reviews checklists and moves approved assets to reviewed/
  7. Run 'readiness' to assess assembly readiness score
  8. Run 'revision-log' to track the full intake cycle
  9. Run 'obsidian-export' to stage summary for Obsidian
  10. Human grants assembly approval when readiness passes

${'='.repeat(50)}

  SUPPORTED ASSET TYPES:

  Images:  .png, .jpg, .jpeg, .webp
  Video:   .mp4, .webm
  Audio:   .wav, .mp3, .flac

${'='.repeat(50)}

  INTEGRATION POINTS:

  - Phase 14D: Episode 1 Asset Generation Queue
  - ICYFLAMZE CORE Episode 1 Trailer Pipeline
  - Higgsfield AI Render Request System
  - Obsidian Approved Write Gateway
  - Voice Narrative Protocol (VNP)

${'='.repeat(50)}
`);
