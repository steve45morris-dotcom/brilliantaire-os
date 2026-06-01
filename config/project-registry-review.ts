export const REVIEW_ONLY = true;
export const ALLOW_PROJECTS_MD_WRITE = false;
export const ALLOW_FOLDER_MOVE = false;
export const ALLOW_FOLDER_DELETE = false;
export const REQUIRE_MANUAL_APPROVAL = true;

export const SCAN_ROOTS = [
  '/Users/alexanderanthony/Projects/',
  '/Users/alexanderanthony/TreeGrooveProjects/'
];

export const REGISTRY_SOURCE = 'PROJECTS.md';

export const PROJECT_SIGNATURE_FILES = [
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'pubspec.yaml',
  'Taskfile.yml',
  'README.md',
  '.git',
  'docker-compose.yml'
];

export const CLASSIFICATION_LABELS = [
  'register',
  'archive_candidate',
  'ignore',
  'inspect_manually',
  'dependency_or_template',
  'active_experiment'
] as const;

export type ClassificationLabel = typeof CLASSIFICATION_LABELS[number];

export const ACTIVITY_LABELS = [
  'recent',
  'active',
  'stale',
  'unknown'
] as const;

export type ActivityLabel = typeof ACTIVITY_LABELS[number];
