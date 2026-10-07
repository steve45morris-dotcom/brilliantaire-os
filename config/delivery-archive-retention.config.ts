import * as path from 'path';

const rootDir = process.cwd();

// Input Source Directories (Phase N5N & N5O)
export const HANDOFF_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/manual_delivery_handoff/approved');
export const DELIVERY_PACKAGE_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/packages');
export const DELIVERY_MANIFEST_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/manifests');

// Archive Target Directories (Phase N5P)
export const ARCHIVE_ROOT = path.join(rootDir, 'outputs/narrator/delivery_archive_retention');
export const ARCHIVE_LEDGER_DIR = path.join(rootDir, 'outputs/narrator/delivery_archive_retention/ledger');
export const ARCHIVE_INDEX_DIR = path.join(rootDir, 'outputs/narrator/delivery_archive_retention/index');
export const RETENTION_REVIEW_DIR = path.join(rootDir, 'outputs/narrator/delivery_archive_retention/retention_reviews');
export const ARCHIVE_LOGS_DIR = path.join(rootDir, 'outputs/narrator/delivery_archive_retention/logs');
export const ARCHIVE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/delivery_archive_retention/reports');
export const ARCHIVE_EXPORTS_DIR = path.join(rootDir, 'outputs/narrator/delivery_archive_retention/exports');

// Archive Policy Configurations
export const REQUIRED_HANDOFF_STATUS = 'approved';
export const REQUIRE_CHECKSUM_VERIFICATION = true;
export const REQUIRE_PACKAGE_MANIFEST = true;
export const ARCHIVE_MODE = 'metadata-first';
export const COPY_PACKAGE_INTO_ARCHIVE = false; // default: metadata-first representation
export const DUPLICATE_ARCHIVE_PROTECTION = true;
export const DEFAULT_RETENTION_DAYS = 90;
export const WARNING_RETENTION_DAYS = 75;
export const LEDGER_FORMAT = 'json and markdown';

// Strict Safety Gates
export const AUTO_DELETE_EXPIRED_PACKAGES = false; // Safety: must remain false
export const AUTO_UPLOAD_ARCHIVE = false;
export const AUTO_SEND_ARCHIVE = false;
export const MANUAL_RETENTION_REVIEW_REQUIRED = true;
export const AUTO_PLAYBACK = false;
