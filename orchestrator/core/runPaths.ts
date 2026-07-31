import fs from 'node:fs';
import path from 'node:path';

export class RunDirectoryCollisionError extends Error {
  constructor(runDir: string) {
    super(`run directory already exists: ${runDir}`);
    this.name = 'RunDirectoryCollisionError';
  }
}

function formatTimestamp(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
  ].join('') + `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

export function createRunDir(kind: string, now: Date = new Date(), repoRoot: string = process.cwd()): string {
  const runsRoot = path.join(repoRoot, 'runs');
  const runDir = path.join(runsRoot, `${kind}-${formatTimestamp(now)}`);
  fs.mkdirSync(runsRoot, { recursive: true });

  try {
    fs.mkdirSync(runDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new RunDirectoryCollisionError(runDir);
    }
    throw error;
  }

  fs.mkdirSync(path.join(runDir, 'state'));
  fs.mkdirSync(path.join(runDir, 'raw'));
  return runDir;
}
