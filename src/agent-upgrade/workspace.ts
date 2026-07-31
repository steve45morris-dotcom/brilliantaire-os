import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WorkspaceSnapshot, VerificationResult } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const WORKSPACES_ROOT = path.join(REPO_ROOT, 'workspaces');

export function initWorkspacesDirectory() {
  if (!fs.existsSync(WORKSPACES_ROOT)) {
    fs.mkdirSync(WORKSPACES_ROOT, { recursive: true });
  }
}

export class ParallelWorkspaceManager {
  constructor() {
    initWorkspacesDirectory();
  }

  // Create isolated workspace
  createWorkspace(jobId: string): WorkspaceSnapshot {
    const rootPath = path.join(WORKSPACES_ROOT, jobId);
    const snapshotsPath = path.join(rootPath, 'snapshots');
    const logsPath = path.join(rootPath, 'logs');
    const outputsPath = path.join(rootPath, 'outputs');
    const reportsPath = path.join(rootPath, 'reports');

    fs.mkdirSync(rootPath, { recursive: true });
    fs.mkdirSync(snapshotsPath, { recursive: true });
    fs.mkdirSync(logsPath, { recursive: true });
    fs.mkdirSync(outputsPath, { recursive: true });
    fs.mkdirSync(reportsPath, { recursive: true });

    // Snapshots of core system configuration rules (boundaries check sandbox)
    const boundaryPath = path.join(REPO_ROOT, 'BOUNDARY_RULES.md');
    if (fs.existsSync(boundaryPath)) {
      fs.copyFileSync(boundaryPath, path.join(snapshotsPath, 'BOUNDARY_RULES.md'));
    }

    const metadata: WorkspaceSnapshot = {
      jobId,
      createdAt: new Date().toISOString(),
      status: 'active',
      paths: {
        root: rootPath,
        snapshots: snapshotsPath,
        logs: logsPath,
        outputs: outputsPath
      }
    };

    fs.writeFileSync(
      path.join(rootPath, 'workspace_meta.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    this.logExecution(jobId, `Workspace initialized for job ${jobId}.`);
    return metadata;
  }

  // Log execution traces
  logExecution(jobId: string, logLine: string) {
    const logFile = path.join(WORKSPACES_ROOT, jobId, 'logs', 'execution.log');
    const timeStr = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timeStr}] ${logLine}\n`, 'utf-8');
  }

  // Save workspace output files
  saveOutput(jobId: string, filename: string, content: string) {
    const outFile = path.join(WORKSPACES_ROOT, jobId, 'outputs', filename);
    fs.writeFileSync(outFile, content, 'utf-8');
    this.logExecution(jobId, `Saved output file: ${filename}`);
  }

  // Save verification check result
  saveVerificationReport(jobId: string, report: VerificationResult) {
    const repFile = path.join(WORKSPACES_ROOT, jobId, 'reports', 'verification_report.json');
    fs.writeFileSync(repFile, JSON.stringify(report, null, 2), 'utf-8');
    this.logExecution(
      jobId,
      `Saved verification report. Status: ${report.passed ? 'PASSED' : 'FAILED'}, Quality Score: ${report.factualAccuracyScore}`
    );
  }

  // Propose memory updates
  proposeMemoryUpdate(jobId: string, key: string, payload: any) {
    const propFile = path.join(WORKSPACES_ROOT, jobId, 'reports', 'memory_update_proposal.json');
    const proposal = {
      jobId,
      timestamp: new Date().toISOString(),
      key,
      payload,
      applied: false
    };
    fs.writeFileSync(propFile, JSON.stringify(proposal, null, 2), 'utf-8');
    this.logExecution(jobId, `Staged memory update proposal for key: ${key}`);
  }

  // Archive workspace when complete
  archiveWorkspace(jobId: string): boolean {
    const metaFile = path.join(WORKSPACES_ROOT, jobId, 'workspace_meta.json');
    if (!fs.existsSync(metaFile)) return false;

    try {
      const meta: WorkspaceSnapshot = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
      meta.status = 'archived';
      fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf-8');
      this.logExecution(jobId, `Workspace archived.`);
      return true;
    } catch (e) {
      console.error(`[Workspace] Failed to archive workspace ${jobId}: ${(e as Error).message}`);
      return false;
    }
  }

  // Get workspace layout metadata
  getWorkspace(jobId: string): WorkspaceSnapshot | null {
    const metaFile = path.join(WORKSPACES_ROOT, jobId, 'workspace_meta.json');
    if (!fs.existsSync(metaFile)) return null;
    try {
      return JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
}
