import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import type { VerificationInstruction } from '../claims/schema.js';

const execFileAsync = promisify(execFile);

interface InstructionResult {
  actual_result: string;
  exit_code: number;
  status_hint: 'pass' | 'fail' | 'not_testable';
}

// An unspecified expected exit code defaults to 0 ("the command ran successfully"),
// not "any exit code passes" — a claim must not be able to mark a crashing or
// erroring command as verified just by omitting `expected`.
function classifyExitCode(exitCode: number, expectedExitCode?: number): 'pass' | 'fail' {
  return exitCode === (expectedExitCode ?? 0) ? 'pass' : 'fail';
}

async function runProcess(executable: string, args: string[], cwd: string, timeoutMs: number, expectedExitCode?: number): Promise<InstructionResult> {
  try {
    const { stdout } = await execFileAsync(executable, args, { cwd, timeout: timeoutMs });
    const exitCode = 0;
    return { actual_result: stdout, exit_code: exitCode, status_hint: classifyExitCode(exitCode, expectedExitCode) };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
    const exitCode = typeof err.code === 'number' ? err.code : 1;
    const output = (err.stdout ?? '') + (err.stderr ?? '');
    return { actual_result: output, exit_code: exitCode, status_hint: classifyExitCode(exitCode, expectedExitCode) };
  }
}

// Claim verification paths come from the untrusted Auditor. Reject anything that
// resolves outside repoRoot and outside the current run's own directory (e.g.
// "../../../../etc/passwd") instead of reading it. The run directory is a second
// legitimate root — not a bypass — so that reconcile.ts's self-specified-evidence
// detection can still execute (and then cap, rather than hard-reject) a claim that
// points at the Auditor's own output; the containment check's job is only to stop
// escapes to arbitrary filesystem locations outside both known roots.
function isWithinRoot(target: string, root: string): boolean {
  const resolvedRoot = path.resolve(root);
  return target === resolvedRoot || target.startsWith(`${resolvedRoot}${path.sep}`);
}

function resolveWithinRepo(repoRoot: string, relativePath: string, additionalAllowedRoot?: string): string | null {
  const resolvedTarget = path.resolve(path.resolve(repoRoot), relativePath);
  const allowed = isWithinRoot(resolvedTarget, repoRoot) || (additionalAllowedRoot !== undefined && isWithinRoot(resolvedTarget, additionalAllowedRoot));
  return allowed ? resolvedTarget : null;
}

export async function executeInstruction(instruction: VerificationInstruction, repoRoot: string, additionalAllowedRoot?: string): Promise<InstructionResult> {
  switch (instruction.type) {
    case 'process':
      return runProcess(instruction.executable, instruction.args, repoRoot, instruction.timeout_ms, instruction.expected?.exit_code);

    case 'file_exists': {
      const filePath = resolveWithinRepo(repoRoot, instruction.path, additionalAllowedRoot);
      if (filePath === null) {
        return { actual_result: 'path escapes repository root', exit_code: 1, status_hint: 'fail' };
      }
      const exists = fs.existsSync(filePath);
      return { actual_result: exists ? 'exists' : 'missing', exit_code: exists ? 0 : 1, status_hint: exists ? 'pass' : 'fail' };
    }

    case 'file_absent': {
      const filePath = resolveWithinRepo(repoRoot, instruction.path, additionalAllowedRoot);
      if (filePath === null) {
        return { actual_result: 'path escapes repository root', exit_code: 1, status_hint: 'fail' };
      }
      const exists = fs.existsSync(filePath);
      return { actual_result: exists ? 'exists' : 'absent', exit_code: exists ? 1 : 0, status_hint: exists ? 'fail' : 'pass' };
    }

    case 'file_hash': {
      const filePath = resolveWithinRepo(repoRoot, instruction.path, additionalAllowedRoot);
      if (filePath === null) {
        return { actual_result: 'path escapes repository root', exit_code: 1, status_hint: 'fail' };
      }
      if (!fs.existsSync(filePath)) {
        return { actual_result: 'file missing', exit_code: 1, status_hint: 'fail' };
      }
      const crypto = await import('node:crypto');
      const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
      if (instruction.expected_hash === undefined) {
        return { actual_result: hash, exit_code: 0, status_hint: 'not_testable' };
      }
      const matches = hash === instruction.expected_hash;
      return { actual_result: hash, exit_code: matches ? 0 : 1, status_hint: matches ? 'pass' : 'fail' };
    }

    case 'file_contains': {
      const filePath = resolveWithinRepo(repoRoot, instruction.path, additionalAllowedRoot);
      if (filePath === null) {
        return { actual_result: 'path escapes repository root', exit_code: 1, status_hint: 'fail' };
      }
      if (!fs.existsSync(filePath)) {
        return { actual_result: 'file missing', exit_code: 1, status_hint: 'fail' };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const found = instruction.is_regex ? new RegExp(instruction.pattern).test(content) : content.includes(instruction.pattern);
      return { actual_result: found ? 'pattern found' : 'pattern not found', exit_code: found ? 0 : 1, status_hint: found ? 'pass' : 'fail' };
    }

    case 'git_diff':
      return runProcess('git', ['diff', ...instruction.args], repoRoot, 30000);

    case 'git_status':
      return runProcess('git', ['status', '--porcelain=v1'], repoRoot, 30000, 0);

    case 'test':
    case 'typecheck':
    case 'build': {
      const pkgPath = path.join(repoRoot, 'package.json');
      if (!fs.existsSync(pkgPath)) {
        return { actual_result: 'no package.json in target repo', exit_code: 0, status_hint: 'not_testable' };
      }
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { scripts?: Record<string, string> };
      const scriptName = instruction.type;
      if (!pkg.scripts?.[scriptName]) {
        return { actual_result: `no "${scriptName}" script defined`, exit_code: 0, status_hint: 'not_testable' };
      }
      return runProcess('npm', ['run', scriptName], repoRoot, 120000, 0);
    }
  }
}
