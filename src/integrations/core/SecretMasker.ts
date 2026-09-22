/**
 * Centralized API key and token masking utility.
 * Enforces Phase 6 rules: Masked prefix must show first 3 characters only, no suffix.
 */
export function maskAPIKey(keyName: string, keyValue: string | null): string {
  if (!keyValue || keyValue === 'unconfigured' || keyValue === '') {
    return 'unconfigured';
  }
  const clean = keyValue.trim();
  if (clean.length > 3) {
    return `${clean.substring(0, 3)}••••••••`;
  }
  return '••••••••';
}

/**
 * Sanitizes arbitrary strings to redact keys, tokens, or authorization headers.
 */
export function maskSensitiveText(text: string): string {
  if (!text) return text;
  return text
    .replace(/AIzaSy[a-zA-Z0-9_-]{10,}/g, 'AIz••••••••')
    .replace(/sk-[a-zA-Z0-9_-]{10,}/g, 'sk-••••••••')
    .replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, 'Bearer ••••••••');
}

