export const CLEANUP_STAGING_ONLY = true;
export const ALLOW_DIRECT_DELETE = false;
export const ALLOW_RM_COMMANDS = false;
export const REQUIRE_QUARANTINE_FIRST = true;
export const REQUIRE_MANUAL_APPROVAL = true;
export const ALLOW_PROJECT_AUTO_REGISTER = false;

export const TARGET_DUPLICATE_FOLDERS = [
  '/Users/alexanderanthony/AlexanderOSVault/brilliantaire-briefs/daily/',
  '/Users/alexanderanthony/AlexanderOSVault/brilliantaire-briefs/next-actions/',
  '/Users/alexanderanthony/AlexanderOSVault/brilliantaire-briefs/projects/',
  '/Users/alexanderanthony/AlexanderOSVault/brilliantaire-briefs/decisions/'
];

// Regex matching files ending with unix timestamp suffix, e.g., brief_file_1780073595.md
export const DUPLICATE_PATTERN = /_(\d{10})\.md$/;

export const PROJECT_DRIFT_SCAN_ROOTS = [
  '/Users/alexanderanthony/Projects/',
  '/Users/alexanderanthony/TreeGrooveProjects/'
];
