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
