// ICYFLAMZE CORE: Episode 1 Blocker Resolution Configuration

// Safety guardrails
export const BLOCKER_RESOLUTION_ONLY = true;
export const ALLOW_IMAGE_GENERATION = false;
export const ALLOW_AUDIO_GENERATION = false;
export const ALLOW_VIDEO_GENERATION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_OBSIDIAN_DIRECT_WRITE = false;
export const ALLOW_OBSIDIAN_STAGING = true;
export const ALLOW_FILE_DELETE = false;
export const REQUIRE_MANUAL_GENERATION = true;
export const REQUIRE_MANUAL_REVIEW = true;

// Project constants
export const PROJECT_NAME = "ICYFLAMZE CORE";
export const SEASON_TITLE = "ICYFLAMZE CORE: Rise of the Street Scholar";
export const EPISODE_TITLE = "The Core Wakes";
export const UNIVERSE_DIRECTION = "Street Scholar Futurism";
export const MASTER_TAGLINE = "Street wisdom. Scientific mind. Futuristic soul.";
export const PRIMARY_STILL_IMAGE_TOOL = "ChatGPT Image";
export const PRIMARY_IMAGE_STYLE = "3D cartoon / animated";
export const CURRENT_READINESS_STATUS = "not_ready";
export const CURRENT_READINESS_PERCENTAGE = 0;

// Input references
export const INPUT_REFERENCES = {
  IMAGE_PROMPTS: "outputs/icyflamze_core/episode_1/image_prompts/episode_1_image_prompt_pack_2026-07-02.md",
  MASTER_ASSET_QUEUE: "outputs/icyflamze_core/episode_1/asset_queue/episode_1_master_asset_queue_2026-07-02.md",
  IMAGE_ASSET_QUEUE: "outputs/icyflamze_core/episode_1/asset_queue/image_assets/episode_1_image_asset_queue_2026-07-02.md",
  ASSEMBLY_READINESS: "outputs/icyflamze_core/episode_1/render_intake/reports/episode_1_assembly_readiness_2026-07-02.md",
  RENDER_INTAKE_SCAN: "outputs/icyflamze_core/episode_1/render_intake/reports/episode_1_render_intake_scan_2026-07-02.md"
};

// Batch 1 priority assets
export const BATCH_1_ASSETS = [
  { name: "Hero Poster Image", category: "image", tool: "ChatGPT Image", folder: "incoming/images", naming: "icyflamze_core_ep01_hero_poster_v01.png" },
  { name: "Eyes Close-Up Image", category: "image", tool: "ChatGPT Image", folder: "incoming/images", naming: "icyflamze_core_ep01_eyes_closeup_v01.png" },
  { name: "Lighter Spark Image", category: "image", tool: "ChatGPT Image", folder: "incoming/images", naming: "icyflamze_core_ep01_lighter_spark_v01.png" },
  { name: "Chessboard City Image", category: "image", tool: "ChatGPT Image", folder: "incoming/images", naming: "icyflamze_core_ep01_chessboard_city_v01.png" },
  { name: "Title Card Image", category: "image", tool: "ChatGPT Image", folder: "incoming/images", naming: "icyflamze_core_ep01_title_card_v01.png" },
  { name: "30-Second Voiceover Audio", category: "audio", tool: "ElevenLabs / Piper", folder: "incoming/audio", naming: "icyflamze_core_ep01_voiceover_30s_v01.wav" },
  { name: "15-Second Teaser Voiceover Audio", category: "audio", tool: "ElevenLabs / Piper", folder: "incoming/audio", naming: "icyflamze_core_ep01_teaser_15s_v01.wav" },
  { name: "Trailer Music Bed", category: "audio", tool: "Manual Composition", folder: "incoming/audio", naming: "icyflamze_core_ep01_music_bed_v01.wav" }
];

// Intake folder paths
export const INTAKE_FOLDERS = {
  IMAGES: "outputs/icyflamze_core/episode_1/render_intake/incoming/images",
  AUDIO: "outputs/icyflamze_core/episode_1/render_intake/incoming/audio",
  COVER_ART: "outputs/icyflamze_core/episode_1/render_intake/incoming/cover_art",
  VIDEOS: "outputs/icyflamze_core/episode_1/render_intake/incoming/videos",
  CAPTIONS: "outputs/icyflamze_core/episode_1/render_intake/incoming/captions",
  EDIT_PROJECTS: "outputs/icyflamze_core/episode_1/render_intake/incoming/edit_projects"
};

// Non-image production tools (reserved for video/audio/editing)
export const RESERVED_TOOLS = {
  VIDEO: ["Sora", "Veo", "Runway", "Pika", "Kling"],
  AUDIO: ["Piper", "ElevenLabs"],
  EDITING: ["CapCut", "Premiere Pro", "DaVinci Resolve"]
};
