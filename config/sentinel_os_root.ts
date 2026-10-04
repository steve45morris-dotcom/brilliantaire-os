// config/sentinel_os_root.ts
// Where the real sentinel-os checkout lives.
//
// The sentinel-os/ folder in this repo is a stale snapshot, so the safety tools
// read the standalone checkout instead: SENTINEL_OS_ROOT when set, otherwise
// ~/sentinel-os (where it lives on the Mac).

import os from "node:os";
import path from "node:path";

export function sentinelOsRoot(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.SENTINEL_OS_ROOT?.trim();
  if (raw) return path.resolve(raw.replace(/^~(?=$|\/)/, os.homedir()));
  return path.join(os.homedir(), "sentinel-os");
}
