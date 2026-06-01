import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const QUARANTINE_ONLY = true;
export const ALLOW_PERMANENT_DELETE = false;
export const ALLOW_RM_COMMANDS = false;
export const REQUIRE_CONFIRM_FLAG = true;
export const REQUIRE_STAGED_PLAN = true;
export const REQUIRE_CHECKSUM_VALIDATION = true;
export const REQUIRE_RESTORE_MAP = true;

export const CLEANUP_STAGING_DIR = path.join(REPO_ROOT, 'outputs', 'cleanup', 'staging');
export const CLEANUP_QUARANTINE_DIR = path.join(REPO_ROOT, 'outputs', 'cleanup', 'quarantine');
export const QUARANTINE_LOG_DIR = path.join(REPO_ROOT, 'outputs', 'cleanup', 'quarantine_logs');
export const QUARANTINE_MANIFEST_DIR = path.join(REPO_ROOT, 'outputs', 'cleanup', 'quarantine_manifests');
export const CHECKSUM_OUTPUT_DIR = path.join(REPO_ROOT, 'outputs', 'cleanup', 'checksums');
export const RESTORE_SCRIPT_DIR = path.join(REPO_ROOT, 'outputs', 'cleanup', 'restore_scripts');
