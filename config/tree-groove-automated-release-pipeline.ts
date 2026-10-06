import path from 'path';
import { REPO_ROOT } from './paths.js';

export const MODULE_NAME = 'Tree Groove Records Automated Release Pipeline';

export const safetyConfigs = {
  ALLOW_AUTOMATED_PUBLISHING: false,
  ALLOW_EXTERNAL_API_CALLS: false,
  ALLOW_AUTO_POST: false
};

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'manual_release', 'pipeline'),
  logs: path.join(REPO_ROOT, 'outputs', 'manual_release', 'pipeline', 'logs'),
  checklists: path.join(REPO_ROOT, 'outputs', 'manual_release', 'pipeline', 'checklists'),
  runbooks: path.join(REPO_ROOT, 'outputs', 'manual_release', 'pipeline', 'runbooks'),
  proposals: path.join(REPO_ROOT, 'outputs', 'manual_release', 'pipeline', 'proposals')
};
