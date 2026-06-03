import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

export const URL_STAGING_ONLY = true;
export const MANUAL_URL_INTAKE_ONLY = true;
export const ALLOW_CHANNEL_CRAWLING = false;
export const ALLOW_PLAYLIST_CRAWLING = false;
export const ALLOW_VIDEO_DOWNLOAD = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_TRANSCRIPT_FETCH = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const REQUIRE_APPROVED_CREATOR = true;
export const REQUIRE_MANUAL_REVIEW = true;

export const APPROVED_CREATORS = [
  'julian',
  'Julian Goldie'
];

export const ALLOWED_URL_TYPES = [
  'video',
  'playlist',
  'channel',
  'unknown'
];

export const URL_STATUS_LABELS = [
  'staged',
  'needs_review',
  'approved_for_transcript',
  'rejected',
  'processed'
];

export const PRIORITY_LABELS = [
  'high',
  'medium',
  'low',
  'watchlist'
];

// Paths
export const URL_STAGING_DIR = 'outputs/knowledge_harvest/url_staging/';
export const URL_STAGING_STAGED_DIR = 'outputs/knowledge_harvest/url_staging/staged_urls/';
export const URL_STAGING_REPORTS_DIR = 'outputs/knowledge_harvest/url_staging/reports/';
export const URL_STAGING_LOG_DIR = 'outputs/knowledge_harvest/url_staging/logs/';
export const URL_STAGING_TEMPLATES_DIR = 'templates/knowledge_harvest/url_staging/';
