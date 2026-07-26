import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import type { RepoIdentity } from './types.js';

const execFileAsync = promisify(execFile);

export type GitRunner = (args: string[], cwd: string) => Promise<string>;

const runGit: GitRunner = async (args, cwd) => {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
};

export async function captureRepoIdentity(repoRoot: string, git: GitRunner = runGit): Promise<RepoIdentity> {
  const resolvedRoot = await git(['rev-parse', '--show-toplevel'], repoRoot);
  const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot);
  const commit = await git(['rev-parse', 'HEAD'], repoRoot);
  const remotes = await git(['remote'], repoRoot);
  const remote = remotes.split('\n').filter(Boolean).includes('origin')
    ? await git(['remote', 'get-url', 'origin'], repoRoot)
    : null;
  const workingTreeStatus = await git(['status', '--porcelain=v1'], repoRoot);

  return {
    repoRoot: resolvedRoot,
    branch,
    commit,
    remote,
    workingTreeStatusHash: crypto.createHash('sha256').update(workingTreeStatus).digest('hex'),
    capturedAt: new Date().toISOString(),
  };
}
