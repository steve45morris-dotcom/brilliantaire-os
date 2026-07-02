// ICYFLAMZE CORE: Episode 1 Render Intake Configuration

// Safety guardrails
export const RENDER_INTAKE_ONLY = true;
export const ALLOW_IMAGE_GENERATION = false;
export const ALLOW_AUDIO_GENERATION = false;
export const ALLOW_VIDEO_GENERATION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_OBSIDIAN_DIRECT_WRITE = false;
export const ALLOW_OBSIDIAN_STAGING = true;
export const ALLOW_FILE_DELETE = false;
export const ALLOW_ASSET_OVERWRITE = false;
export const REQUIRE_MANUAL_REVIEW = true;
export const REQUIRE_ASSEMBLY_APPROVAL = true;

// Project constants
export const PROJECT_NAME = "ICYFLAMZE CORE";
export const SEASON_TITLE = "ICYFLAMZE CORE: Rise of the Street Scholar";
export const EPISODE_NUMBER = 1;
export const EPISODE_TITLE = "The Core Wakes";
export const UNIVERSE_DIRECTION = "Street Scholar Futurism";
export const MASTER_TAGLINE = "Street wisdom. Scientific mind. Futuristic soul.";

// Staging directory paths
export const INCOMING_FOLDERS = {
  IMAGES: "outputs/icyflamze_core/episode_1/render_intake/incoming/images",
  VIDEOS: "outputs/icyflamze_core/episode_1/render_intake/incoming/videos",
  AUDIO: "outputs/icyflamze_core/episode_1/render_intake/incoming/audio",
  COVER_ART: "outputs/icyflamze_core/episode_1/render_intake/incoming/cover_art",
  CAPTIONS: "outputs/icyflamze_core/episode_1/render_intake/incoming/captions",
  EDIT_PROJECTS: "outputs/icyflamze_core/episode_1/render_intake/incoming/edit_projects"
};

// Staged Queue References
export const REFERENCE_FILES = {
  MASTER_QUEUE: "outputs/icyflamze_core/episode_1/asset_queue/episode_1_master_asset_queue_2026-07-02.md",
  IMAGE_QUEUE: "outputs/icyflamze_core/episode_1/asset_queue/image_assets/episode_1_image_asset_queue_2026-07-02.md",
  VIDEO_QUEUE: "outputs/icyflamze_core/episode_1/asset_queue/video_assets/episode_1_video_asset_queue_2026-07-02.md",
  AUDIO_QUEUE: "outputs/icyflamze_core/episode_1/asset_queue/audio_assets/episode_1_audio_asset_queue_2026-07-02.md",
  COVER_QUEUE: "outputs/icyflamze_core/episode_1/asset_queue/cover_art_assets/episode_1_cover_art_asset_queue_2026-07-02.md",
  CHECKLIST: "outputs/icyflamze_core/episode_1/asset_queue/checklists/episode_1_assembly_checklist_2026-07-02.md"
};

// Allowed Extensions
export const ALLOWED_EXTENSIONS = {
  IMAGES: [".png", ".jpg", ".jpeg", ".webp"],
  VIDEOS: [".mp4", ".mov", ".webm"],
  AUDIO: [".wav", ".mp3", ".m4a"],
  CAPTIONS: [".srt", ".vtt", ".txt", ".md"],
  EDIT_PROJECTS: [".capcut", ".drp", ".prproj", ".fcpxml", ".xml"]
};

// Status definitions
export const ASSET_STATUSES = [
  "incoming",
  "pending_review",
  "approved",
  "rejected",
  "needs_revision",
  "ready_for_assembly",
  "assembled"
];
