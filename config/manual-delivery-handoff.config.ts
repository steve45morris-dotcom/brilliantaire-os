import * as path from 'path';

const rootDir = process.cwd();

// Source Delivery Package Directories (from Phase N5N)
export const DELIVERY_PACKAGE_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/packages');
export const DELIVERY_MANIFEST_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/manifests');

// Manual Handoff Target Directories (Phase N5O)
export const HANDOFF_ROOT = path.join(rootDir, 'outputs/narrator/manual_delivery_handoff');
export const HANDOFF_CHECKLIST_DIR = path.join(rootDir, 'outputs/narrator/manual_delivery_handoff/checklists');
export const HANDOFF_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/manual_delivery_handoff/approved');
export const HANDOFF_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/manual_delivery_handoff/rejected');
export const HANDOFF_LOGS_DIR = path.join(rootDir, 'outputs/narrator/manual_delivery_handoff/logs');
export const HANDOFF_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/manual_delivery_handoff/reports');

// Handoff Policy Configurations
export const ALLOWED_PACKAGE_STATUS = 'verified';
export const REQUIRED_MANIFEST_FILES = ['package_manifest.json', 'package_manifest.md'];
export const REQUIRED_REVIEW_STATUS = 'approved';
export const REQUIRE_CHECKSUM_VERIFICATION = true;
export const REQUIRE_MANUAL_SIGNER = true;
export const REQUIRE_HANDOFF_NOTE = true;

// Strict Safety Gates
export const AUTO_SEND = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const AUTO_EMAIL = false;
export const AUTO_PLAYBACK = false;
export const MANUAL_DELIVERY_REQUIRED = true;
export const DUPLICATE_HANDOFF_PROTECTION = true;
