// ICYFLAMZE CORE: Episode 1 Asset Generation Queue Configuration

// Safety guardrails
export const ASSET_QUEUE_ONLY = true;
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
export const EPISODE_NUMBER = 1;
export const EPISODE_TITLE = "The Core Wakes";
export const UNIVERSE_DIRECTION = "Street Scholar Futurism";
export const MASTER_TAGLINE = "Street wisdom. Scientific mind. Futuristic soul.";

// Input files
export const INPUT_FILES = {
  TRAILER_SCRIPT: "outputs/icyflamze_core/episode_1/scripts/episode_1_trailer_script_2026-07-02.md",
  VOICEOVER_30S: "outputs/icyflamze_core/episode_1/scripts/episode_1_30_second_voiceover_2026-07-02.md",
  TEASER_15S: "outputs/icyflamze_core/episode_1/scripts/episode_1_15_second_teaser_2026-07-02.md",
  SHOT_LIST: "outputs/icyflamze_core/episode_1/shot_lists/episode_1_trailer_shot_list_2026-07-02.md",
  IMAGE_PROMPTS: "outputs/icyflamze_core/episode_1/image_prompts/episode_1_image_prompt_pack_2026-07-02.md",
  ANIMATION_PROMPTS: "outputs/icyflamze_core/episode_1/animation_prompts/episode_1_animation_prompt_pack_2026-07-02.md",
  AUDIO_DIRECTION: "outputs/icyflamze_core/episode_1/audio/episode_1_audio_direction_2026-07-02.md",
  COVER_ART: "outputs/icyflamze_core/episode_1/cover_art/episode_1_cover_art_direction_2026-07-02.md",
  CAPTIONS: "outputs/icyflamze_core/episode_1/captions/episode_1_caption_pack_2026-07-02.md",
  ROLLOUT_CHECKLIST: "outputs/icyflamze_core/episode_1/rollout/episode_1_rollout_checklist_2026-07-02.md"
};

// Asset categories
export const ASSET_CATEGORIES = [
  "image",
  "video",
  "audio",
  "cover_art",
  "caption",
  "assembly",
  "review"
];

// Asset status labels
export const ASSET_STATUS_LABELS = [
  "queued",
  "ready_for_manual_generation",
  "generated_pending_review",
  "approved",
  "rejected",
  "needs_revision",
  "assembled"
];

// Manual generation tools
export const MANUAL_GENERATION_TOOLS = [
  "ChatGPT Image",
  "Midjourney",
  "Sora",
  "Veo",
  "Runway",
  "Pika",
  "Kling",
  "Piper",
  "ElevenLabs",
  "CapCut",
  "DaVinci Resolve",
  "Premiere Pro",
  "Canva"
];
