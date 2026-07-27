console.log(`
🎬 Higgsfield AI Bridge - CLI Help
${'═'.repeat(50)}

  Tool:    Open Higgsfield AI
  Type:    AI Video Generation Adapter
  Mode:    manual-first (no API calls)
  Target:  ICYFLAMZE CORE Creative Pipeline

${'─'.repeat(50)}

  COMMANDS:

  create-render <TYPE> <DESCRIPTION>
    Stage a new render request with scene description.
    Types: character-animation, scene-transition,
           music-video-sequence, trailer-clip,
           lyric-visual, cover-art-motion,
           storyboard-preview

  create-scene <TITLE> <COMPOSITION>
    Create a scene description document for
    storyboard assembly.

  create-storyboard <TITLE>
    Compile existing scene descriptions into a
    sequenced storyboard with narrator sync map.

  narrator-sync <STORYBOARD_FILE>
    Generate a narrator sync package linking
    storyboard timing to TTS queue entries.

  obsidian-export
    Stage an asset inventory summary for Obsidian
    export via the Approved Write Gateway.

  status
    Print bridge configuration, safety flags,
    output directory inventory, and integration
    status.

${'─'.repeat(50)}

  EXAMPLES:

  npm run higgsfield-ai -- "create-render trailer-clip Street scholar emerges from city alley"
  npm run higgsfield-ai -- "create-scene opening-shot Neon-lit city skyline with chess pieces"
  npm run higgsfield-ai -- "create-storyboard Episode-1-Trailer"
  npm run higgsfield-ai -- "narrator-sync storyboard_episode_1_trailer.md"
  npm run higgsfield-ai -- "obsidian-export"
  npm run higgsfield-ai -- "status"

${'─'.repeat(50)}

  SAFETY:
  - No external API calls are made
  - No autonomous renders are executed
  - All outputs are local markdown files
  - Manual approval required before render submission
  - Obsidian writes go through staging gateway only

${'─'.repeat(50)}

  INTEGRATION POINTS:
  - ICYFLAMZE CORE Episode Trailer Render Pipeline
  - IP Bible Visual Reference System
  - Asset Queue Submission Interface
  - Render Intake Handoff System
  - Narrator TTS Queue
  - Voice Narrative Protocol (VNP)

${'═'.repeat(50)}
`);
