import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { globalEventBus } from '../events/EventBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VNP_BRIDGE_PATH = '/Users/alexanderanthony/.agents/voice_narrative.sh';

export interface RecoveryLog {
  id: string;
  timestamp: string;
  incidentType: string;
  source: string;
  resolution: string;
  severity: 'fixable' | 'escalate';
  status: 'resolved' | 'pending' | 'manual_review' | 'failed';
}

export class RecoveryManager {
  private logs: RecoveryLog[] = [];
  private checkpoints: Map<string, { [filePath: string]: string }> = new Map();
  private backupDir = '/Users/alexanderanthony/.antigravity/checkpoints';

  constructor() {
    // Bootstrap initial logs
    this.logs.push({
      id: 'rec-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      incidentType: 'Workflow Timeout',
      source: 'wf-market-scan',
      resolution: 'Isolated pipeline thread, restarted sandbox container context.',
      severity: 'fixable',
      status: 'resolved'
    });
  }

  private announcePhrase(phrase: string): Promise<void> {
    return new Promise((resolve) => {
      if (!fs.existsSync(VNP_BRIDGE_PATH)) {
        console.warn(`[VNP Warning] ${VNP_BRIDGE_PATH} not found. Skipping phrase announcement.`);
        return resolve();
      }

      // Write to buffer for audit trail and speak on macOS
      const VOICE_BUFFER = "/Users/alexanderanthony/.agents/voice_buffer.txt";
      const cleanPhrase = phrase.replace(/"/g, '\\"');
      
      const dateStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
      try {
        fs.appendFileSync(VOICE_BUFFER, `${dateStr} - ${phrase}\n`);
      } catch (e) {
        console.warn(`[VNP Warning] Failed to write to voice buffer: ${(e as Error).message}`);
      }
      
      const cmd = `/Users/alexanderanthony/.agents/speak_serialized.sh "${cleanPhrase}" "P3"`;
      exec(cmd, { timeout: 8000 }, (err) => {
        if (err) {
          console.warn(`[VNP Error] Failed to speak phrase: ${err.message}`);
        }
        resolve();
      });
    });
  }

  public getRecoveryLogs(): RecoveryLog[] {
    return [...this.logs];
  }

  /**
   * Classifies an incoming error message to decide if it is fixable or needs escalation.
   */
  public classifyError(errorMsg: string): 'fixable' | 'escalate' {
    const fixableKeywords = [
      'rate limit',
      'network',
      'timeout',
      'conflict',
      'busy',
      'locked',
      'connection reset',
      'socket hang up',
      'econnrefused'
    ];
    
    const lower = errorMsg.toLowerCase();
    const isFixable = fixableKeywords.some(kw => lower.includes(kw));
    return isFixable ? 'fixable' : 'escalate';
  }

  /**
   * Triggers recovery sequence based on error classification
   */
  public async triggerRecovery(incidentType: string, source: string, errorMsg: string): Promise<boolean> {
    const severity = this.classifyError(errorMsg);
    const id = `rec-${Date.now()}`;
    
    const log: RecoveryLog = {
      id,
      timestamp: new Date().toISOString(),
      incidentType,
      source,
      resolution: severity === 'fixable' ? 'Triggering automatic retry sequence.' : 'Escalating to manual operator review.',
      severity,
      status: 'pending'
    };

    this.logs.unshift(log);
    
    // Voice Announcement
    await this.announcePhrase(`Recovery Sentinel alert: detected ${severity} error in ${source}.`);

    if (severity === 'fixable') {
      globalEventBus.publish('RecoveryTriggered', { id, incidentType, source, severity });
      return true; // proceed with auto-retry
    } else {
      log.status = 'manual_review';
      globalEventBus.publish('RecoveryEscalated', { id, incidentType, source, severity });
      await this.announcePhrase(`Operator intervention required for incident ${id}.`);
      return false; // wait for escalation/manual approval
    }
  }

  /**
   * Utility to execute an async operation with retry logic for fixable errors
   */
  public async runWithRetry<T>(
    taskName: string,
    operation: () => Promise<T>,
    retries = 3,
    delayMs = 1500
  ): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await operation();
      } catch (err) {
        attempt++;
        const errMsg = (err as Error).message;
        const isFixable = this.classifyError(errMsg);
        
        await this.announcePhrase(`Retry attempt ${attempt} of ${retries} for task ${taskName}.`);

        if (attempt >= retries || isFixable === 'escalate') {
          await this.triggerRecovery(`Task Failure: ${taskName}`, taskName, errMsg);
          throw err;
        }

        // Delay before retry
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error(`Task ${taskName} failed after ${retries} retries.`);
  }

  /**
   * Creates a checkpoint rollback folder for critical files before modifying them.
   */
  public createRollbackCheckpoint(checkpointName: string, filePaths: string[]): void {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      const backupMap: { [path: string]: string } = {};

      for (const file of filePaths) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf-8');
          const hash = Math.random().toString(36).substring(7);
          const backupPath = path.join(this.backupDir, `${checkpointName}_${path.basename(file)}_${hash}.bak`);
          fs.writeFileSync(backupPath, content, 'utf-8');
          backupMap[file] = backupPath;
        }
      }

      this.checkpoints.set(checkpointName, backupMap);
      globalEventBus.publish('CheckpointCreated', { checkpointName, fileCount: filePaths.length });
    } catch (err) {
      console.error(`[RecoveryManager] Checkpoint creation failed: ${(err as Error).message}`);
    }
  }

  /**
   * Restores files to the state they were in when checkpoint was created
   */
  public async rollback(checkpointName: string): Promise<boolean> {
    const backupMap = this.checkpoints.get(checkpointName);
    if (!backupMap) {
      await this.announcePhrase(`Rollback failed. Checkpoint ${checkpointName} not found.`);
      return false;
    }

    await this.announcePhrase(`Initiating rollback for checkpoint ${checkpointName}. Please verify states.`);

    try {
      for (const [originalPath, backupPath] of Object.entries(backupMap)) {
        if (fs.existsSync(backupPath)) {
          const content = fs.readFileSync(backupPath, 'utf-8');
          fs.writeFileSync(originalPath, content, 'utf-8');
        }
      }

      await this.announcePhrase(`Rollback for ${checkpointName} completed successfully.`);
      globalEventBus.publish('RollbackExecuted', { checkpointName });
      return true;
    } catch (err) {
      await this.announcePhrase(`Critical: Rollback for ${checkpointName} failed.`);
      console.error(`[RecoveryManager] Rollback failed: ${(err as Error).message}`);
      return false;
    }
  }
}

export const globalRecoveryManager = new RecoveryManager();
