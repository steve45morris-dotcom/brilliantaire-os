import * as path from 'path';

const rootDir = process.cwd();

// Directories for Voice Command Bridge staging queues
export const BRIDGE_APPROVED_ASR_DIR = path.join(rootDir, 'outputs/narrator/asr/approved');
export const BRIDGE_READY_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/ready');
export const BRIDGE_EXECUTED_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/executed');
export const BRIDGE_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/rejected');
export const BRIDGE_LOG_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/logs');

// Template directory
export const BRIDGE_TEMPLATE_DIR = path.join(rootDir, 'templates/narrator_voice_bridge');

// Security & Execution Whitelist (Must match exact mapped command routes exactly)
export const ALLOWED_COMMAND_ROUTER_ENTRIES = [
  'npm run command -- "narrator-live-feed generate"',
  'npm run command -- "narrator-tts-queue status"',
  'npm run command -- "narrator-tts-renderer status"',
  'npm run command -- "narrator-tts-models status"',
  'npm run command -- "narrator-asr-listener status"',
  'npm run command -- "narrator-asr-backend status"'
];

// Safety Boundaries & Enforcement Configuration
export const EXACT_NAME_REQUIRED = true;
export const AUTO_EXECUTE_APPROVED_PACKETS = false;
export const MANUAL_EXECUTION_REQUIRED = true;
export const RAW_SHELL_EXECUTION_ALLOWED = false;
export const TRANSCRIPT_TEXT_EXECUTION_ALLOWED = false;

// Validation Criteria
export const MAX_PACKET_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours max packet age
export const MAX_COMMAND_LENGTH = 200;               // Maximum allowed command length
export const MIN_COMMAND_CONFIDENCE = 0.7;           // Minimum required confidence score
export const DEFAULT_EXECUTION_MODE = 'preview-only'; // Default safety fallback mode

// Injection prevention forbidden characters/patterns
export const FORBIDDEN_EXECUTION_PATTERNS = [
  ';',
  '&&',
  '||',
  '|',
  '>',
  '<',
  '`',
  '$(',
  '\n',
  'sudo ',
  'rm ',
  'chmod ',
  'eval ',
  'curl ',
  'wget '
];
