import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Database = require(path.resolve(process.cwd(), 'sentinel-os/node_modules/better-sqlite3'));

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

let dbInstance: any = null;

export function getDB(): any {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
  }
  return dbInstance;
}
