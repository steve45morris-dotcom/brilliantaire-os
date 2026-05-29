import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, '..');
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs');

const homedir = os.homedir();

export const OBSIDIAN_CANDIDATE_PATHS = [
  path.join(homedir, 'AlexanderOSVault'),
  path.join(homedir, 'Obsidian'),
  path.join(homedir, 'ObsidianVault'),
  path.join(homedir, 'Documents', 'Obsidian'),
  path.join(homedir, 'Documents', 'IcyflamzeVault'),
  path.join(homedir, 'Projects', 'obsidian'),
  path.join(homedir, 'Projects', 'Obsidian')
];

export const OBSIDIAN_INGEST_OUTPUT = path.join(OUTPUT_ROOT, 'obsidian_ingest');
export const DAILY_BRIEF_OUTPUT = path.join(OUTPUT_ROOT, 'daily_briefs');
export const BACKUPS_ROOT = path.join(OUTPUT_ROOT, 'backups');
export const OBSIDIAN_SAFE_WRITE_FOLDER_NAME = 'brilliantaire-briefs';
export const WRITE_STAGING_OUTPUT = path.join(OUTPUT_ROOT, 'write_staging');
export const WRITE_LOG_OUTPUT = path.join(OUTPUT_ROOT, 'write_logs');
