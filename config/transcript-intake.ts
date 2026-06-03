import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Strict Security Guardrails
export const TRANSCRIPT_INTAKE_ONLY = true;
export const MANUAL_TRANSCRIPT_ONLY = true;
export const ALLOW_TRANSCRIPT_FETCH = false;
export const ALLOW_YOUTUBE_API_CALLS = false;
export const ALLOW_VIDEO_DOWNLOAD = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const REQUIRE_STAGED_URL_MATCH = true;
export const REQUIRE_GROUNDING_RECORD = true;
export const MAX_TRANSCRIPT_CHARS = 60000;

// Metadata Labels
export const TRANSCRIPT_STATUS_LABELS = [
  'raw',
  'validated',
  'rejected',
  'processed',
  'needs_review'
];

export const GROUNDING_STATUS_LABELS = [
  'matched_to_url',
  'unmatched',
  'needs_review',
  'ready_for_notebooklm',
  'ready_for_workflow_extraction'
];

// Paths
export const TRANSCRIPT_DIR = 'outputs/knowledge_harvest/transcripts/';
export const TRANSCRIPT_RAW_DIR = 'outputs/knowledge_harvest/transcripts/raw/';
export const TRANSCRIPT_PROCESSED_DIR = 'outputs/knowledge_harvest/transcripts/processed/';
export const TRANSCRIPT_REJECTED_DIR = 'outputs/knowledge_harvest/transcripts/rejected/';
export const TRANSCRIPT_REPORTS_DIR = 'outputs/knowledge_harvest/transcripts/reports/';
export const GROUNDED_NOTES_DIR = 'outputs/knowledge_harvest/grounded_notes/';
export const GROUNDED_SOURCE_PACKS_DIR = 'outputs/knowledge_harvest/grounded_source_packs/';
export const TRANSCRIPT_TEMPLATES_DIR = 'templates/knowledge_harvest/transcripts/';
export const URL_STAGING_STAGED_DIR = 'outputs/knowledge_harvest/url_staging/staged_urls/';
