import * as fs from 'fs';
import * as path from 'path';

function run() {
  const rootDir = process.cwd();
  const cardPath = path.join(rootDir, 'outputs/narrator_card.json');

  if (!fs.existsSync(cardPath)) {
    console.error(`[ERR] Validation failed: File does not exist at ${cardPath}`);
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(cardPath, 'utf-8');
    const data = jsonParse(raw);
    if (!data) {
      console.error('[ERR] Validation failed: File is not valid JSON.');
      process.exit(1);
    }

    const requiredKeys = [
      'headline',
      'what_we_did',
      'what_it_is',
      'whats_left',
      'status_color',
      'mood',
      'key_metrics',
      'sources_used',
      'generated_at',
      'safety_mode'
    ];

    const missingKeys: string[] = [];
    for (const key of requiredKeys) {
      if (!(key in data)) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      console.error(`[ERR] Validation failed: Missing required keys: ${missingKeys.join(', ')}`);
      process.exit(1);
    }

    // Rule: sources_used must be an array
    if (!Array.isArray(data.sources_used)) {
      console.error(`[ERR] Validation failed: 'sources_used' must be an array (got ${typeof data.sources_used}).`);
      process.exit(1);
    }

    // Rule: generated_at must exist
    if (!data.generated_at || typeof data.generated_at !== 'string') {
      console.error('[ERR] Validation failed: \'generated_at\' must be a non-empty string.');
      process.exit(1);
    }

    // Rule: safety_mode must equal output_only
    if (data.safety_mode !== 'output_only') {
      console.error(`[ERR] Validation failed: 'safety_mode' must be 'output_only' (got '${data.safety_mode}').`);
      process.exit(1);
    }

    // Rule: status_color must be one of: green, amber, red, blue, purple
    const validColors = ['green', 'amber', 'red', 'blue', 'purple'];
    if (!validColors.includes(data.status_color)) {
      console.error(`[ERR] Validation failed: 'status_color' must be one of: ${validColors.join(', ')} (got '${data.status_color}').`);
      process.exit(1);
    }

    // Rule: key_metrics must be an object
    if (typeof data.key_metrics !== 'object' || data.key_metrics === null || Array.isArray(data.key_metrics)) {
      console.error('[ERR] Validation failed: \'key_metrics\' must be an object.');
      process.exit(1);
    }

    console.log('[OK] outputs/narrator_card.json passed all safety and structure validation rules.');
  } catch (e) {
    console.error(`[ERR] Validation failed with error: ${e}`);
    process.exit(1);
  }
}

function jsonParse(str: string): any {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

run();
