import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_REGISTRY, APPROVED_DIRECTORIES, DEPRECATED_COMPONENTS } from './GovernanceRegistry.js';
import { DependencyParser } from './DependencyParser.js';
import { GovernanceDriftPayload, GovernanceAuditCompletedPayload } from './GovernanceEvents.js';

export class GovernanceEngine {
  private baseDir: string;
  private issues: GovernanceDriftPayload[] = [];

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  public runAudit(): GovernanceAuditCompletedPayload {
    this.issues = [];

    // 1. Validate Canonical Naming & Struct Integrity
    this.validateNamingAndStructure();

    // 2. Scan for Deprecated Components
    this.scanDeprecated();

    // 3. Scan for Duplicates & Redundancies
    this.scanDuplicates();

    // 4. Circular Dependencies & Orphans
    this.scanCircularAndOrphans();

    // 5. Documentation Coverage Check
    this.checkDocumentationCoverage();

    // 6. Calculate Architecture Health Score
    const score = this.calculateScore();

    return {
      score,
      health_score: score, // Added for compatibility
      issuesCount: this.issues.length,
      timestamp: new Date().toISOString(),
      issues: this.issues
    };
  }

  private validateNamingAndStructure(): void {
    // Check directory layout complies with APPROVED_DIRECTORIES
    if (fs.existsSync(this.baseDir)) {
      const items = fs.readdirSync(this.baseDir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'dist' && item.name !== 'Library' && item.name !== 'Applications' && item.name !== 'Desktop' && item.name !== 'Downloads' && item.name !== 'Documents' && item.name !== 'Pictures' && item.name !== 'Movies' && item.name !== 'Music') {
          // Check if it's approved
          const match = APPROVED_DIRECTORIES.find(appDir => appDir === item.name || appDir.startsWith(item.name + '/'));
          const isNumeric = /^\d+/.test(item.name); // e.g. 00 Executive Office
          
          if (!match && !isNumeric) {
            this.issues.push({
              type: 'naming',
              componentId: item.name,
              details: `Directory "${item.name}" is not listed in the Approved Directories list. Potential naming drift.`,
              severity: 'medium'
            });
          }
        }
      }
    }
  }

  private scanDeprecated(): void {
    for (const dep of DEPRECATED_COMPONENTS) {
      const targetPath = path.join(this.baseDir, dep);
      if (fs.existsSync(targetPath)) {
        // If it's sentinel-os, check if it's running Next.js or independent scripts
        const isSentinel = dep === 'sentinel-os';
        this.issues.push({
          type: 'deprecated',
          componentId: dep,
          details: `Deprecated component "${dep}" is active at path. ${isSentinel ? 'Bypasses standard Supernova/Kernel boundaries with independent Next.js scheduler.' : ''}`,
          severity: isSentinel ? 'high' : 'medium'
        });
      }
    }
  }

  private scanDuplicates(): void {
    // Check for duplicate registries or overlapping classes
    // Scan if there are duplicate model configs or multiple config.json files
    const configPath = path.join(this.baseDir, 'config');
    if (fs.existsSync(configPath)) {
      const configFiles = fs.readdirSync(configPath);
      const duplicateCandidates = configFiles.filter(f => f.includes('copy') || f.includes('backup') || f.includes('tmp'));
      for (const cand of duplicateCandidates) {
        this.issues.push({
          type: 'duplicate',
          componentId: cand,
          details: `Duplicate configuration candidate "${cand}" found under config/ folder.`,
          severity: 'low'
        });
      }
    }
  }

  private scanCircularAndOrphans(): void {
    const parser = new DependencyParser(path.join(this.baseDir, 'src'));
    const depNodes = parser.analyzeDependencies();

    for (const [relPath, node] of Object.entries(depNodes)) {
      if (node.isCircular) {
        this.issues.push({
          type: 'dependency',
          componentId: relPath,
          details: `Circular import dependency chain detected involving module "${relPath}".`,
          severity: 'high'
        });
      }
      if (node.isOrphaned) {
        this.issues.push({
          type: 'dependency',
          componentId: relPath,
          details: `Orphaned source file "${relPath}" is not imported by any core kernel module or entry point.`,
          severity: 'low'
        });
      }
    }
  }

  private checkDocumentationCoverage(): void {
    // Ensure vital src directories contain index.ts or README.md
    const coreSubfolders = ['src/kernel', 'src/runtime', 'src/executive', 'src/intelligence', 'src/knowledge'];
    for (const folder of coreSubfolders) {
      const fullPath = path.join(this.baseDir, folder);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        const hasReadme = files.some(f => f.toLowerCase() === 'readme.md' || f.toLowerCase() === 'index.ts');
        if (!hasReadme) {
          this.issues.push({
            type: 'registry',
            componentId: folder,
            details: `Module folder "${folder}" lacks index.ts or README.md entry point.`,
            severity: 'medium'
          });
        }
      }
    }
  }

  private calculateScore(): number {
    let score = 100;

    for (const issue of this.issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }

    return Math.max(0, score);
  }
}
export const globalGovernanceEngine = new GovernanceEngine('/Users/alexanderanthony');
