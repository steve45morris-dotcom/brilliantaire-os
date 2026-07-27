import { ClaimsFile, type Claim } from './schema.js';

export const AUDITOR_DIAGNOSTIC_ALLOWLIST = [
  'ls', 'cat', 'wc', 'comm', 'diff', 'grep', 'shasum', 'sha256sum',
] as const;

function checkExecutableAllowlist(claim: Claim): string[] {
  const errors: string[] = [];
  for (const instruction of claim.verification) {
    if (instruction.type === 'process' && !(AUDITOR_DIAGNOSTIC_ALLOWLIST as readonly string[]).includes(instruction.executable)) {
      errors.push(
        `claim ${claim.claim_id}: executable "${instruction.executable}" is not on the diagnostic allowlist`
      );
    }
  }
  return errors;
}

export function validateClaimsFile(
  raw: unknown
): { valid: true; claims: ClaimsFile } | { valid: false; errors: string[] } {
  const parsed = ClaimsFile.safeParse(raw);
  if (!parsed.success) {
    return { valid: false, errors: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`) };
  }

  const allowlistErrors = parsed.data.claims.flatMap(checkExecutableAllowlist);
  if (allowlistErrors.length > 0) {
    return { valid: false, errors: allowlistErrors };
  }

  const claimIds = new Set(parsed.data.claims.map(claim => claim.claim_id));
  const dependencyErrors = parsed.data.claims.flatMap(claim =>
    claim.depends_on
      .filter(dependencyId => !claimIds.has(dependencyId))
      .map(dependencyId => `claim ${claim.claim_id}: unknown dependency "${dependencyId}"`)
  );
  if (dependencyErrors.length > 0) {
    return { valid: false, errors: dependencyErrors };
  }

  return { valid: true, claims: parsed.data };
}
