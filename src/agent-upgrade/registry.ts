import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SkillMetadata,
  SkillDetail,
  SkillStatus,
  SkillCategory,
  SkillBundle
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
export const REGISTRY_JSON = path.join(SKILLS_DIR, 'registry.json');
export const BUNDLES_JSON = path.join(SKILLS_DIR, 'bundles.json');

// Ensure base directories exist
export function initDirectories() {
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }
}

// Default Seed Skills Metadata
const DEFAULT_SKILLS: Record<string, SkillMetadata> = {
  'market-explorer': {
    name: 'market-explorer',
    owner: 'Planner Agent',
    version: '1.0.0',
    status: 'active',
    category: 'research',
    dependencies: [],
    lastUsed: null,
    usageCount: 0,
    successRate: 1.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Verified via basic mock web-scraping tests.'
  },
  'copy-writer': {
    name: 'copy-writer',
    owner: 'Content Agent',
    version: '1.0.0',
    status: 'active',
    category: 'content',
    dependencies: [],
    lastUsed: null,
    usageCount: 0,
    successRate: 1.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Verified via copywriting styling templates.'
  },
  'email-sequencer': {
    name: 'email-sequencer',
    owner: 'Operations Agent',
    version: '1.0.0',
    status: 'experimental',
    category: 'outreach',
    dependencies: [],
    lastUsed: null,
    usageCount: 0,
    successRate: 0.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Staged for mock sandbox email verification.'
  },
  'completion-verifier': {
    name: 'completion-verifier',
    owner: 'Verifier Agent',
    version: '1.0.0',
    status: 'active',
    category: 'verification',
    dependencies: [],
    lastUsed: null,
    usageCount: 0,
    successRate: 1.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Core validation engine skill.'
  },
  'metric-tracker': {
    name: 'metric-tracker',
    owner: 'Revenue Agent',
    version: '1.0.0',
    status: 'active',
    category: 'analytics',
    dependencies: [],
    lastUsed: null,
    usageCount: 0,
    successRate: 1.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Tracks intelligence telemetry.'
  },
  'task-runner': {
    name: 'task-runner',
    owner: 'Automation Agent',
    version: '1.0.0',
    status: 'active',
    category: 'automation',
    dependencies: [],
    lastUsed: null,
    usageCount: 0,
    successRate: 1.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Local CLI task driver.'
  },
  'conversion-optimizer': {
    name: 'conversion-optimizer',
    owner: 'Revenue Agent',
    version: '1.0.0',
    status: 'experimental',
    category: 'revenue',
    dependencies: ['metric-tracker'],
    lastUsed: null,
    usageCount: 0,
    successRate: 0.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Tied to active campaign funnels.'
  },
  'system-scheduler': {
    name: 'system-scheduler',
    owner: 'Operations Agent',
    version: '1.0.0',
    status: 'active',
    category: 'operations',
    dependencies: ['task-runner'],
    lastUsed: null,
    usageCount: 0,
    successRate: 1.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Daemon interface scheduler.'
  },
  'context-weaver': {
    name: 'context-weaver',
    owner: 'Memory Agent',
    version: '1.0.0',
    status: 'active',
    category: 'memory',
    dependencies: [],
    lastUsed: null,
    usageCount: 0,
    successRate: 1.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Weaves local Obsidian notes into context.'
  },
  'video-generator': {
    name: 'video-generator',
    owner: 'Media Workflow Agent',
    version: '1.0.0',
    status: 'experimental',
    category: 'media',
    dependencies: [],
    lastUsed: null,
    usageCount: 0,
    successRate: 0.0,
    failureNotes: [],
    retirementCandidate: false,
    verificationNotes: 'Interface logic to fal.ai MCP and media generation.'
  }
};

const DEFAULT_BUNDLES: SkillBundle[] = [
  {
    name: 'Research Bundle',
    description: 'Routes intelligence gathering, market scanning, and verification together.',
    skills: ['market-explorer', 'completion-verifier']
  },
  {
    name: 'Content Bundle',
    description: 'Bridges creative writing, copywriting, and media production.',
    skills: ['copy-writer', 'video-generator']
  },
  {
    name: 'Revenue Bundle',
    description: 'Combines metrics, conversions, and campaign analysis.',
    skills: ['metric-tracker', 'conversion-optimizer']
  },
  {
    name: 'Operations Bundle',
    description: 'Manages systems scheduler, outreach sequences, and automations.',
    skills: ['system-scheduler', 'email-sequencer', 'task-runner']
  },
  {
    name: 'Media Bundle',
    description: 'Encompasses video, audio, and content drafting integrations.',
    skills: ['video-generator', 'copy-writer']
  },
  {
    name: 'Automation Bundle',
    description: 'Focuses on running tasks and processing background items.',
    skills: ['task-runner', 'system-scheduler']
  },
  {
    name: 'Verification Bundle',
    description: 'Core validation loops for completion and output accuracy.',
    skills: ['completion-verifier', 'metric-tracker']
  }
];

export class SkillRegistryManager {
  constructor() {
    initDirectories();
    this.ensureRegistry();
    this.ensureBundles();
  }

  private ensureRegistry() {
    if (!fs.existsSync(REGISTRY_JSON)) {
      fs.writeFileSync(REGISTRY_JSON, JSON.stringify(DEFAULT_SKILLS, null, 2), 'utf-8');
      // Create initial folders for the default skills
      Object.keys(DEFAULT_SKILLS).forEach((key) => {
        const skill = DEFAULT_SKILLS[key];
        const skillFolder = path.join(SKILLS_DIR, skill.category, skill.name);
        fs.mkdirSync(skillFolder, { recursive: true });
        
        // Write empty SKILL.md
        fs.writeFileSync(
          path.join(skillFolder, 'SKILL.md'),
          `# Skill: ${skill.name}\n\nCategory: ${skill.category}\nOwner: ${skill.owner}\n\n## Description\nCore starter skill for ${skill.name}.`,
          'utf-8'
        );
        fs.writeFileSync(
          path.join(skillFolder, 'metadata.json'),
          JSON.stringify(skill, null, 2),
          'utf-8'
        );
        fs.mkdirSync(path.join(skillFolder, 'references'), { recursive: true });
        fs.mkdirSync(path.join(skillFolder, 'scripts'), { recursive: true });
      });
    }
  }

  private ensureBundles() {
    if (!fs.existsSync(BUNDLES_JSON)) {
      fs.writeFileSync(BUNDLES_JSON, JSON.stringify(DEFAULT_BUNDLES, null, 2), 'utf-8');
    }
  }

  // Load only metadata (Progressive Skill Loader)
  loadMetadataOnly(): Record<string, SkillMetadata> {
    try {
      const data = fs.readFileSync(REGISTRY_JSON, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error(`[Registry Error] Failed to load registry metadata: ${(e as Error).message}`);
      return {};
    }
  }

  // Save metadata
  saveMetadata(metadata: Record<string, SkillMetadata>) {
    fs.writeFileSync(REGISTRY_JSON, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  // Load full skill on-demand
  loadFullSkill(skillName: string): SkillDetail | null {
    const metadata = this.loadMetadataOnly();
    const meta = metadata[skillName];
    if (!meta) return null;

    const categoryFolder = path.join(SKILLS_DIR, meta.category, meta.name);
    const rootFolder = path.join(SKILLS_DIR, meta.name);
    const skillFolder = fs.existsSync(rootFolder) ? rootFolder : categoryFolder;
    const skillMdPath = path.join(skillFolder, 'SKILL.md');
    
    let instructions = '';
    if (fs.existsSync(skillMdPath)) {
      instructions = fs.readFileSync(skillMdPath, 'utf-8');
    }

    const references: Record<string, string> = {};
    const refDir = path.join(skillFolder, 'references');
    if (fs.existsSync(refDir)) {
      fs.readdirSync(refDir).forEach((file) => {
        const fullPath = path.join(refDir, file);
        if (fs.statSync(fullPath).isFile()) {
          references[file] = fs.readFileSync(fullPath, 'utf-8');
        }
      });
    }

    const scripts: Record<string, string> = {};
    const scriptDir = path.join(skillFolder, 'scripts');
    if (fs.existsSync(scriptDir)) {
      fs.readdirSync(scriptDir).forEach((file) => {
        const fullPath = path.join(scriptDir, file);
        if (fs.statSync(fullPath).isFile()) {
          scripts[file] = fs.readFileSync(fullPath, 'utf-8');
        }
      });
    }

    return {
      ...meta,
      instructions,
      references,
      scripts
    };
  }

  // Match user intent to likely skills
  matchIntent(intent: string): { selected: string[]; rejected: string[] } {
    const metadata = this.loadMetadataOnly();
    const cleanIntent = intent.toLowerCase();
    const selected: string[] = [];
    const rejected: string[] = [];

    // Simple keyword mapping
    const keywordMap: Record<string, string[]> = {
      research: ['research', 'market', 'explore', 'trend', 'scan', 'find', 'search'],
      content: ['write', 'copy', 'text', 'post', 'blog', 'draft', 'publish'],
      outreach: ['email', 'send', 'mail', 'sequence', 'campaign', 'message'],
      verification: ['verify', 'check', 'validate', 'audit', 'test', 'confirm'],
      analytics: ['analytics', 'metric', 'track', 'score', 'telemetry', 'performance'],
      automation: ['automate', 'run', 'execute', 'script', 'cron', 'trigger'],
      revenue: ['revenue', 'income', 'conversion', 'ad', 'monetize', 'sales'],
      operations: ['schedule', 'daemon', 'ops', 'brief', 'job', 'queue'],
      memory: ['memory', 'vault', 'obsidian', 'decision', 'lesson', 'context'],
      media: ['media', 'video', 'audio', 'image', 'generator', 'render', 'voice']
    };

    Object.keys(metadata).forEach((skillName) => {
      const meta = metadata[skillName];
      if (meta.status === 'archived' || meta.status === 'deprecated') {
        rejected.push(skillName);
        return;
      }

      // Check if category keywords match
      const keywords = keywordMap[meta.category] || [];
      const matchesCategory = keywords.some((kw) => cleanIntent.includes(kw));
      const matchesName = skillName.toLowerCase().split('-').some((word) => cleanIntent.includes(word));
      const matchesCategoryName = meta.category.includes(cleanIntent) || cleanIntent.includes(meta.category);

      if (matchesCategory || matchesName || matchesCategoryName) {
        selected.push(skillName);
      } else {
        rejected.push(skillName);
      }
    });

    // Log the selected vs rejected selections for auditing
    this.logMatch(intent, selected, rejected);

    return { selected, rejected };
  }

  private logMatch(intent: string, selected: string[], rejected: string[]) {
    const logPath = path.join(SKILLS_DIR, 'loader_audit.log');
    const logEntry = {
      timestamp: new Date().toISOString(),
      intent,
      selected,
      rejected
    };
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
  }

  // Create (register) new skill
  registerSkill(
    category: SkillCategory,
    name: string,
    owner: string,
    version: string,
    instructions: string,
    dependencies: string[] = []
  ): boolean {
    const metadata = this.loadMetadataOnly();
    if (metadata[name]) {
      console.warn(`[Registry] Skill ${name} is already registered.`);
      return false;
    }

    const newMeta: SkillMetadata = {
      name,
      owner,
      version,
      status: 'experimental', // All new skills start as experimental
      category,
      dependencies,
      lastUsed: null,
      usageCount: 0,
      successRate: 0.0,
      failureNotes: [],
      retirementCandidate: false,
      verificationNotes: 'Registered. Staged as experimental pending verification tests.'
    };

    metadata[name] = newMeta;
    this.saveMetadata(metadata);

    const skillFolder = path.join(SKILLS_DIR, category, name);
    fs.mkdirSync(skillFolder, { recursive: true });
    fs.writeFileSync(path.join(skillFolder, 'SKILL.md'), instructions, 'utf-8');
    fs.writeFileSync(path.join(skillFolder, 'metadata.json'), JSON.stringify(newMeta, null, 2), 'utf-8');
    fs.mkdirSync(path.join(skillFolder, 'references'), { recursive: true });
    fs.mkdirSync(path.join(skillFolder, 'scripts'), { recursive: true });

    return true;
  }

  // Update skill state
  updateSkillStatus(name: string, status: SkillStatus, verificationNotes?: string): boolean {
    const metadata = this.loadMetadataOnly();
    if (!metadata[name]) return false;

    metadata[name].status = status;
    if (verificationNotes) {
      metadata[name].verificationNotes = verificationNotes;
    }
    this.saveMetadata(metadata);

    // Also update metadata.json in its directory
    const meta = metadata[name];
    const skillFolder = path.join(SKILLS_DIR, meta.category, meta.name);
    const metaPath = path.join(skillFolder, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
    }
    return true;
  }

  // Increment usage count and update success rate
  recordUsage(name: string, success: boolean, failureNote?: string) {
    const metadata = this.loadMetadataOnly();
    if (!metadata[name]) return;

    const meta = metadata[name];
    meta.lastUsed = new Date().toISOString();
    
    const previousCount = meta.usageCount;
    meta.usageCount += 1;

    const previousSuccessCount = previousCount * meta.successRate;
    const newSuccessCount = previousSuccessCount + (success ? 1 : 0);
    meta.successRate = Number((newSuccessCount / meta.usageCount).toFixed(2));

    if (!success && failureNote) {
      meta.failureNotes.push(`${new Date().toISOString()}: ${failureNote}`);
      if (meta.failureNotes.length > 5) meta.failureNotes.shift(); // keep last 5
    }

    // Flag as retirement candidate if success rate drops below 50% and has been used at least 5 times
    if (meta.usageCount >= 5 && meta.successRate < 0.5) {
      meta.retirementCandidate = true;
    }

    this.saveMetadata(metadata);

    // Save back to directory as well
    const skillFolder = path.join(SKILLS_DIR, meta.category, meta.name);
    const metaPath = path.join(skillFolder, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
    }
  }

  // Lifecycle states: merge and archive/delete
  archiveSkill(name: string): boolean {
    const metadata = this.loadMetadataOnly();
    if (!metadata[name]) return false;

    const meta = metadata[name];
    this.updateSkillStatus(name, 'archived', 'Archived by Skill Lifecycle Manager.');

    // We keep the files but flag as archived. Let's make sure it's reflected in the files.
    return true;
  }

  // Skill audit commands
  auditSkills() {
    const metadata = this.loadMetadataOnly();
    const stale: string[] = [];
    const overlapping: string[] = [];
    const unused: string[] = [];
    const activeSkills = Object.values(metadata).filter((m) => m.status === 'active');
    const experimentalSkills = Object.values(metadata).filter((m) => m.status === 'experimental');

    const now = new Date();
    
    Object.values(metadata).forEach((skill) => {
      // Unused Skill Detector
      if (skill.usageCount === 0) {
        unused.push(skill.name);
      }

      // Stale Skill Detector (Not used in last 30 days)
      if (skill.lastUsed) {
        const lastUsedDate = new Date(skill.lastUsed);
        const diffTime = Math.abs(now.getTime() - lastUsedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          stale.push(skill.name);
        }
      } else if (skill.usageCount > 0) {
        // Safe check
        stale.push(skill.name);
      }
    });

    // Overlapping Skill Detector (Check for skills sharing similar categories and name words)
    const skillList = Object.values(metadata);
    for (let i = 0; i < skillList.length; i++) {
      for (let j = i + 1; j < skillList.length; j++) {
        const s1 = skillList[i];
        const s2 = skillList[j];
        if (s1.category === s2.category) {
          const words1 = s1.name.split('-');
          const words2 = s2.name.split('-');
          const overlappingWords = words1.filter((w) => words2.includes(w));
          if (overlappingWords.length > 0) {
            overlapping.push(`${s1.name} <-> ${s2.name} (Shared category '${s1.category}' and terms: ${overlappingWords.join(', ')})`);
          }
        }
      }
    }

    const healthReport = {
      totalSkills: Object.keys(metadata).length,
      activeCount: activeSkills.length,
      experimentalCount: experimentalSkills.length,
      deprecatedCount: Object.values(metadata).filter((m) => m.status === 'deprecated').length,
      archivedCount: Object.values(metadata).filter((m) => m.status === 'archived').length,
      unusedSkills: unused,
      staleSkills: stale,
      overlappingSkills: overlapping,
      retirementCandidates: Object.values(metadata).filter((m) => m.retirementCandidate).map((m) => m.name),
      averageSuccessRate: Number((Object.values(metadata).reduce((acc, m) => acc + m.successRate, 0) / Object.keys(metadata).length).toFixed(2))
    };

    return healthReport;
  }

  // Load Bundles
  getBundles(): SkillBundle[] {
    try {
      if (fs.existsSync(BUNDLES_JSON)) {
        return JSON.parse(fs.readFileSync(BUNDLES_JSON, 'utf-8'));
      }
    } catch (e) {
      console.error(`[Bundles Error] Failed to read bundles: ${(e as Error).message}`);
    }
    return DEFAULT_BUNDLES;
  }
}
