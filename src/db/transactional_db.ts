import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const DB_DIR = path.join(REPO_ROOT, 'outputs', 'db');

export interface TransactionState {
  intents: any[];
  missions: any[];
  timelines: any[];
  learning_logs: any[];
}

export class Transaction {
  public state: TransactionState;
  private isFinalized = false;

  constructor(initialState: TransactionState) {
    // Deep clone the initial state
    this.state = JSON.parse(JSON.stringify(initialState));
  }

  public getIntents() { return this.state.intents; }
  public getMissions() { return this.state.missions; }
  public getTimelines() { return this.state.timelines; }
  public getLearningLogs() { return this.state.learning_logs; }

  public addIntent(intent: any) {
    this.checkFinalized();
    this.state.intents.push(intent);
  }

  public addMission(mission: any) {
    this.checkFinalized();
    this.state.missions.push(mission);
  }

  public addTimeline(timeline: any) {
    this.checkFinalized();
    this.state.timelines.push(timeline);
  }

  public addLearningLog(log: any) {
    this.checkFinalized();
    this.state.learning_logs.push(log);
  }

  public finalize() {
    this.isFinalized = true;
  }

  private checkFinalized() {
    if (this.isFinalized) {
      throw new Error('Transaction has already been finalized (committed or rolled back)');
    }
  }
}

export class TransactionalDB {
  private static instance: TransactionalDB;
  private dbFiles = {
    intents: path.join(DB_DIR, 'intents.json'),
    missions: path.join(DB_DIR, 'missions.json'),
    timelines: path.join(DB_DIR, 'timelines.json'),
    learning_logs: path.join(DB_DIR, 'learning_logs.json'),
  };

  private constructor() {
    this.ensureDbDirectory();
  }

  public static getInstance(): TransactionalDB {
    if (!TransactionalDB.instance) {
      TransactionalDB.instance = new TransactionalDB();
    }
    return TransactionalDB.instance;
  }

  private ensureDbDirectory() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    // Initialize files if they don't exist
    for (const [key, filePath] of Object.entries(this.dbFiles)) {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
      }
    }
  }

  private readAll(): TransactionState {
    this.ensureDbDirectory();
    return {
      intents: JSON.parse(fs.readFileSync(this.dbFiles.intents, 'utf-8')),
      missions: JSON.parse(fs.readFileSync(this.dbFiles.missions, 'utf-8')),
      timelines: JSON.parse(fs.readFileSync(this.dbFiles.timelines, 'utf-8')),
      learning_logs: JSON.parse(fs.readFileSync(this.dbFiles.learning_logs, 'utf-8')),
    };
  }

  private writeAll(state: TransactionState) {
    this.ensureDbDirectory();
    fs.writeFileSync(this.dbFiles.intents, JSON.stringify(state.intents, null, 2), 'utf-8');
    fs.writeFileSync(this.dbFiles.missions, JSON.stringify(state.missions, null, 2), 'utf-8');
    fs.writeFileSync(this.dbFiles.timelines, JSON.stringify(state.timelines, null, 2), 'utf-8');
    fs.writeFileSync(this.dbFiles.learning_logs, JSON.stringify(state.learning_logs, null, 2), 'utf-8');
  }

  /**
   * Executes a callback within a transaction.
   * Staged changes are written on success (COMMIT), and discarded on failure (ROLLBACK).
   */
  public async runInTransaction<T>(
    callback: (tx: Transaction) => Promise<T> | T
  ): Promise<T> {
    const initialState = this.readAll();
    const tx = new Transaction(initialState);

    try {
      console.log('🏁 [DB Transaction] BEGIN');
      const result = await callback(tx);
      
      tx.finalize();
      this.writeAll(tx.state);
      console.log('✅ [DB Transaction] COMMIT - Staged updates successfully written.');
      return result;
    } catch (error) {
      tx.finalize();
      console.error('❌ [DB Transaction] ROLLBACK - Error encountered during transaction:', error);
      throw error;
    }
  }

  /**
   * For testing: reads raw content directly from files.
   */
  public readRawFiles(): TransactionState {
    return this.readAll();
  }
}
