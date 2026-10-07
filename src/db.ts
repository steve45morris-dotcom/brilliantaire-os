import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function resolveBetterSqlite3(): any {
  const root = process.env.SENTINEL_OS_ROOT?.trim()
    ? path.resolve(process.env.SENTINEL_OS_ROOT.trim().replace(/^~(?=$|\/)/, os.homedir()))
    : path.join(os.homedir(), 'sentinel-os');
  const modPath = path.resolve(root, 'node_modules/better-sqlite3');
  try {
    return require(modPath);
  } catch {
    return null;
  }
}

const Database = resolveBetterSqlite3();

export const hasRealDB = Database !== null;

const resolveDbPath = (): string => {
  if (process.env.SUPERNOVA_DB_PATH) {
    return path.resolve(process.env.SUPERNOVA_DB_PATH);
  }
  const cwd = process.cwd();
  if (cwd.endsWith('sentinel-os')) {
    return path.resolve(cwd, '..', 'supernova.db');
  }
  return path.resolve(cwd, 'supernova.db');
};

export const DB_PATH = resolveDbPath();

const noopStatement = { run: () => ({}), get: () => undefined, all: () => [], iterate: function* () {} };
const stubDb = {
  exec: () => {},
  pragma: () => {},
  prepare: () => noopStatement,
  close: () => {},
};

let dbInstance: any = null;

export function getDB(): any {
  if (!dbInstance) {
    if (!Database) {
      dbInstance = stubDb;
    } else {
      dbInstance = new Database(DB_PATH);
      dbInstance.pragma('journal_mode = WAL');
    }
  }
  return dbInstance;
}
