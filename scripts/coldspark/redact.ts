/**
 * Coldspark ingest redaction.
 *
 * The observer reads raw shell history. Shell history contains secrets. Without
 * a scrub at the door, the mirror becomes an exfiltration path: it copies
 * credentials out of a single plaintext file and into a database, a digest, and
 * any note those feed. This module is that door.
 *
 * Design rules:
 *  - Redact on ingest, never on display. Nothing sensitive should ever be
 *    written to run_command_ranks, run_sequences, or an exported report.
 *  - Report shapes, never values. Callers get pattern names and counts so a
 *    scrub can be verified without printing what was scrubbed.
 *  - Fail closed on ambiguity: an over-redacted command degrades one telemetry
 *    row; an under-redacted one leaks a credential.
 */

export const REDACTED = '<REDACTED>';

interface SecretPattern {
  readonly name: string;
  readonly pattern: RegExp;
}

/**
 * Known credential shapes. `AIzaSy…` mirrors the detector already used in
 * scripts/notebooklm-mcp-harden.ts and the IcyOS safety sanitizer, so the three
 * agree on what a Google key looks like.
 */
const SECRET_PATTERNS: readonly SecretPattern[] = [
  { name: 'gcp-api-key', pattern: /AIzaSy[A-Za-z0-9_-]{33}/g },
  { name: 'aws-access-key-id', pattern: /\b(?:AKIA|ASIA|AGPA|AIDA|AROA|ANPA|ANVA)[A-Z0-9]{16}\b/g },
  { name: 'anthropic-key', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/g },
  { name: 'openai-key', pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/g },
  { name: 'stripe-key', pattern: /\b[rs]k_(?:live|test)_[A-Za-z0-9]{20,}/g },
  { name: 'github-token', pattern: /\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{36,}/g },
  { name: 'github-pat', pattern: /\bgithub_pat_[A-Za-z0-9_]{22,}/g },
  { name: 'gitlab-pat', pattern: /\bglpat-[A-Za-z0-9_-]{20,}/g },
  { name: 'slack-token', pattern: /\bxox[abeoprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'huggingface-token', pattern: /\bhf_[A-Za-z0-9]{30,}/g },
  { name: 'perplexity-key', pattern: /\bpplx-[A-Za-z0-9]{30,}/g },
  { name: 'digitalocean-token', pattern: /\bdop_v1_[a-f0-9]{64}/g },
  { name: 'shopify-token', pattern: /\bshpat_[a-fA-F0-9]{32}/g },
  // Bounds kept low deliberately: under-redaction leaks a token, over-redaction
  // costs one telemetry row.
  { name: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g },
  { name: 'bearer-header', pattern: /\bBearer\s+[A-Za-z0-9._-]{20,}/gi },
  {
    name: 'private-key-block',
    pattern: /-----BEGIN[A-Z ]*PRIVATE KEY-----[\s\S]*?-----END[A-Z ]*PRIVATE KEY-----/g
  }
];

/**
 * Secret-bearing argument shapes. These keep the variable or flag name (useful
 * telemetry) and destroy only the value. A value may be quoted or bare.
 */
const NAMED_VALUE_PATTERNS: readonly SecretPattern[] = [
  {
    name: 'env-assignment',
    pattern:
      /\b([A-Za-z_][A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIALS?|AUTH))(\s*=\s*)("[^"]*"|'[^']*'|[^\s;|&]+)/gi
  },
  {
    name: 'cli-flag',
    pattern:
      /(--?(?:api[-_]?key|access[-_]?token|auth[-_]?token|token|secret|password|passwd|bearer))([=\s]+)("[^"]*"|'[^']*'|[^\s;|&-][^\s;|&]*)/gi
  }
];

export interface RedactionResult {
  /** The command with every recognised secret replaced by REDACTED. */
  readonly text: string;
  /** Names of patterns that fired, deduped. Never contains secret values. */
  readonly hits: readonly string[];
}

/**
 * Replace every recognised credential in a command string.
 *
 * Runs value-shape patterns first so a bare `AIzaSy…` is caught even outside an
 * assignment, then name=value patterns to catch opaque values whose shape we
 * don't recognise but whose variable name announces them.
 */
export function redactSecrets(input: string): RedactionResult {
  const hits = new Set<string>();
  let text = input;

  for (const { name, pattern } of SECRET_PATTERNS) {
    // Fresh lastIndex each call: these are module-level /g regexes.
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      hits.add(name);
      pattern.lastIndex = 0;
      text = text.replace(pattern, REDACTED);
    }
  }

  for (const { name, pattern } of NAMED_VALUE_PATTERNS) {
    pattern.lastIndex = 0;
    let fired = false;
    text = text.replace(pattern, (_match, lead: string, sep: string, value: string) => {
      // Already scrubbed by a shape pattern above — don't count it twice.
      if (value === REDACTED) return `${lead}${sep}${REDACTED}`;
      fired = true;
      return `${lead}${sep}${REDACTED}`;
    });
    if (fired) hits.add(name);
  }

  return { text, hits: [...hits] };
}

/** True if the string still contains anything matching a known secret shape. */
export function containsSecret(input: string): boolean {
  return SECRET_PATTERNS.some(({ pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(input);
  });
}
