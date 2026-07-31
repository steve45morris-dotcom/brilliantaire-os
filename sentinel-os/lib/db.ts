import path from "node:path";
import Database from "better-sqlite3";

// Helper to resolve the database path from env or defaults relative to process cwd
const resolveDbPath = (): string => {
  if (process.env.SUPERNOVA_DB_PATH) {
    return path.resolve(process.env.SUPERNOVA_DB_PATH);
  }
  // Default to a path resolved relative to the repo root
  const cwd = process.cwd();
  if (cwd.endsWith("sentinel-os")) {
    return path.resolve(cwd, "..", "supernova.db");
  }
  return path.resolve(cwd, "supernova.db");
};

export const DB_PATH = resolveDbPath();

let dbInstance: Database.Database | null = null;

export function getDB(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    // Explicitly enable WAL mode
    dbInstance.pragma("journal_mode = WAL");
  }
  return dbInstance;
}

export async function runQuery(sql: string, params: any[] = []): Promise<any[]> {
  const db = getDB();
  try {
    const stmt = db.prepare(sql);
    if (stmt.reader) {
      return stmt.all(...params);
    } else {
      const info = stmt.run(...params);
      return [info];
    }
  } catch (e) {
    if (db.inTransaction) {
      try {
        db.exec("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("Failed to rollback active transaction:", rollbackErr);
      }
    }
    console.error("SQL Query Execution failed:", e);
    throw e;
  }
}

export async function runExecute(sql: string, params: any[] = []): Promise<void> {
  const db = getDB();
  try {
    if (params.length === 0) {
      db.exec(sql);
    } else {
      const stmt = db.prepare(sql);
      stmt.run(...params);
    }
  } catch (e) {
    if (db.inTransaction) {
      try {
        db.exec("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("Failed to rollback active transaction:", rollbackErr);
      }
    }
    console.error("SQL Execute failed:", e);
    throw e;
  }
}

export async function initTables() {
  await runExecute(`
    CREATE TABLE IF NOT EXISTS platform_metrics (
        platform TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metrics TEXT,
        status TEXT
    );
  `);
  await runExecute(`
    CREATE TABLE IF NOT EXISTS phrase_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phrase_number INTEGER,
        phrase_text TEXT,
        trigger_event TEXT,
        fired_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await runExecute(`
    CREATE TABLE IF NOT EXISTS write_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT,
        file_path TEXT,
        bytes_written INTEGER,
        committed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await runExecute(`
    CREATE TABLE IF NOT EXISTS intents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raw_input TEXT,
        task TEXT,
        priority TEXT,
        estimated_duration INTEGER,
        category TEXT,
        deadline TEXT,
        dependencies TEXT,
        confidence_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await runExecute(`
    CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        intent_id INTEGER,
        title TEXT,
        description TEXT,
        duration INTEGER,
        mode TEXT,
        energy_requirement TEXT,
        priority TEXT,
        status TEXT,
        dependencies TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await runExecute(`
    CREATE TABLE IF NOT EXISTS timelines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        schedule_json TEXT,
        execution_score REAL,
        approved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await runExecute(`
    CREATE TABLE IF NOT EXISTS learning_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id TEXT,
        start_time TEXT,
        finish_time TEXT,
        actual_duration INTEGER,
        completion INTEGER, -- 0 | 1
        skip_reason TEXT,
        focus_minutes INTEGER,
        user_adjustments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await runExecute(`
    CREATE TABLE IF NOT EXISTS telemetry_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT,
        timestamp TEXT,
        duration INTEGER DEFAULT 0,
        user_action TEXT,
        mission_id TEXT,
        execution_state TEXT,
        provider TEXT,
        model TEXT,
        performance_metrics TEXT,
        errors TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
