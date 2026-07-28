import path from 'node:path';
import { ClaimsFile, type Claim } from './schema.js';

export const AUDITOR_DIAGNOSTIC_ALLOWLIST = [
  'ls', 'cat', 'wc', 'comm', 'diff', 'grep', 'shasum', 'sha256sum',
] as const;

// The executable allowlist limits WHICH binary runs, but not what path it reads.
// An allowlisted reader such as `cat` pointed at an absolute path ("/etc/passwd")
// or a parent-traversal path ("../../etc/passwd") escapes the repository boundary
// entirely, because an absolute arg ignores the process cwd and `..` climbs out.
// This is a purely lexical check (validation has no repoRoot); non-flag args must be
// repo-relative with no `..` segment. Pattern args that genuinely need those forms
// (e.g. a grep regex) should use the typed `file_contains` instruction, which routes
// through the reconciliation engine's realpath-aware containment instead.
function isSafeProcessArg(arg: string): boolean {
  if (arg.startsWith('-')) return true; // a flag for a read-only diagnostic binary
  if (path.isAbsolute(arg)) return false;
  return !arg.split(/[/\\]/).includes('..');
}

// git_diff is typed (not a raw `process` executable) specifically so its args can be
// scoped independently of the general executable allowlist. Without this, an agent-
// supplied arg like "--output=<path>" or "-O<path>" turns a "read-only diagnostic"
// instruction into an arbitrary-file-write primitive, since git resolves --output
// itself rather than going through resolveWithinRepo() in the reconciliation engine.
export const GIT_DIFF_SAFE_FLAGS = [
  '--stat', '--numstat', '--shortstat', '--name-only', '--name-status',
  '--no-color', '--color=never', '--cached', '--staged', '--minimal',
  '--patch', '--no-patch',
] as const;

function isSafeGitDiffArg(arg: string): boolean {
  if (!arg.startsWith('-')) return true; // a ref or pathspec — filters the diff, never writes
  if ((GIT_DIFF_SAFE_FLAGS as readonly string[]).includes(arg)) return true;
  return /^--unified=\d+$/.test(arg);
}

function checkExecutableAllowlist(claim: Claim): string[] {
  const errors: string[] = [];
  for (const instruction of claim.verification) {
    if (instruction.type === 'process' && !(AUDITOR_DIAGNOSTIC_ALLOWLIST as readonly string[]).includes(instruction.executable)) {
      errors.push(
        `claim ${claim.claim_id}: executable "${instruction.executable}" is not on the diagnostic allowlist`
      );
    }
    if (instruction.type === 'process') {
      for (const arg of instruction.args) {
        if (!isSafeProcessArg(arg)) {
          errors.push(
            `claim ${claim.claim_id}: process arg "${arg}" is an absolute or parent-traversal path that escapes the repository root`
          );
        }
      }
    }
    if (instruction.type === 'git_diff') {
      for (const arg of instruction.args) {
        if (!isSafeGitDiffArg(arg)) {
          errors.push(
            `claim ${claim.claim_id}: git_diff arg "${arg}" is not on the safe-flag allowlist`
          );
        }
      }
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
