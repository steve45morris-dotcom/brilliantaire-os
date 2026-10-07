import fs from 'node:fs';
import path from 'node:path';
import { globalAgentExecutionTelemetry, type AgentExecutionEventType } from '../kernel/live/AgentExecutionTelemetry.js';
import { globalLiveOperationsStore } from '../kernel/live/LiveOperationsStore.js';

export type SkillLifecycleStatus = 'active' | 'experimental' | 'deprecated' | 'retired';
export type SkillRisk = 'low' | 'medium' | 'high';

export interface SkillDescriptor {
  id: string;
  name: string;
  category: string;
  owner?: string;
  version: string;
  status: SkillLifecycleStatus;
  summary: string;
  capabilities: string[];
  triggerHints?: string[];
  dependencies?: string[];
  risk?: SkillRisk;
  permissions?: string[];
  instructionPath: string;
  resourcePaths?: string[];
}

export interface SkillMatchRequest {
  mission: string;
  intent: string;
  requiredCapabilities: string[];
  permissions: string[];
  maxRisk: SkillRisk;
}

export interface SkillExecutionContext {
  executionId: string;
  agentId: string;
  agentName?: string;
  missionId?: string;
  missionName?: string;
  taskId?: string;
  taskName?: string;
}

export interface SkillLifecycleEvent {
  type: 'skill.discovered' | 'skill.selected' | 'skill.activated' | 'skill.instructions.loaded' | 'skill.resources.loaded' | 'skill.released' | 'skill.failed';
  skillId?: string;
  execution?: SkillExecutionContext;
  resources?: string[];
  bytes?: number;
  count?: number;
  error?: string;
}

export interface LoadedSkillContent {
  skillId: string;
  path: string;
  content: string;
  bytes: number;
}

export interface SkillContextAccounting {
  skillsDiscovered: number;
  skillsMatched: number;
  skillsActivated: number;
  instructionResourcesLoaded: number;
  supportingResourcesLoaded: number;
  metadataBytesInspected: number;
  instructionBytesLoaded: number;
  resourceBytesLoaded: number;
  unrelatedInstructionBytesAvoided: number;
  tokenCount: 'Unavailable';
}

interface ProgressiveSkillLoaderOptions {
  approvedRoots: string[];
  descriptors: SkillDescriptor[];
  emit?: (event: SkillLifecycleEvent) => void;
  maxFileBytes?: number;
  maxDependencyDepth?: number;
}

const ALLOWED_EXTENSIONS = new Set(['.md', '.json', '.yaml', '.yml', '.txt', '.ts', '.js', '.mjs', '.py', '.sh']);
const RISK_RANK: Record<SkillRisk, number> = { low: 0, medium: 1, high: 2 };

export class ProgressiveSkillLoader {
  private readonly roots: string[];
  private readonly descriptors: Map<string, SkillDescriptor>;
  private readonly emitEvent: (event: SkillLifecycleEvent) => void;
  private readonly maxFileBytes: number;
  private readonly maxDependencyDepth: number;
  private readonly active = new Map<string, SkillDescriptor>();
  private readonly loadedInstructions = new Set<string>();
  private accounting: SkillContextAccounting = emptyAccounting();

  constructor(options: ProgressiveSkillLoaderOptions) {
    if (options.approvedRoots.length === 0) throw new Error('At least one approved skill root is required');
    this.roots = options.approvedRoots.map((root) => fs.realpathSync(root));
    this.descriptors = new Map(options.descriptors.map((descriptor) => [descriptor.id, freezeDescriptor(descriptor)]));
    this.emitEvent = options.emit || emitToLiveOperations;
    this.maxFileBytes = options.maxFileBytes ?? 256 * 1024;
    this.maxDependencyDepth = options.maxDependencyDepth ?? 8;
  }

  public discover(execution?: SkillExecutionContext): { skills: SkillDescriptor[]; metadataBytes: number } {
    const skills = [...this.descriptors.values()].map(cloneDescriptor);
    const metadataBytes = Buffer.byteLength(JSON.stringify(skills));
    this.accounting.skillsDiscovered = skills.length;
    this.accounting.metadataBytesInspected = metadataBytes;
    this.emitEvent({ type: 'skill.discovered', execution, count: skills.length, bytes: metadataBytes });
    return { skills, metadataBytes };
  }

  public match(request: SkillMatchRequest, execution?: SkillExecutionContext): { candidates: Array<{ descriptor: SkillDescriptor; score: number; reasons: string[] }> } {
    const text = `${request.mission} ${request.intent}`.toLowerCase();
    const candidates = [...this.descriptors.values()]
      .filter((descriptor) => this.isCompatible(descriptor, request) && this.dependenciesCompatible(descriptor.id, request))
      .map((descriptor) => {
        const explicit = descriptor.capabilities.filter((capability) => request.requiredCapabilities.includes(capability)).length;
        const mission = descriptor.capabilities.filter((capability) => text.includes(capability.toLowerCase())).length;
        const triggers = (descriptor.triggerHints || []).filter((hint) => text.includes(hint.toLowerCase())).length;
        const reasons = [explicit && 'declared capability', mission && 'mission requirement', triggers && 'trigger hint'].filter(Boolean) as string[];
        return { descriptor: cloneDescriptor(descriptor), score: explicit * 100 + mission * 20 + triggers * 5, reasons };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || left.descriptor.id.localeCompare(right.descriptor.id));
    this.accounting.skillsMatched = candidates.length;
    if (candidates[0]) this.emitEvent({ type: 'skill.selected', skillId: candidates[0].descriptor.id, execution, count: candidates.length });
    return { candidates };
  }

  public activate(skillId: string, execution: SkillExecutionContext, request: SkillMatchRequest): SkillDescriptor {
    const key = activeKey(execution.executionId, skillId);
    const existing = this.active.get(key);
    if (existing) return cloneDescriptor(existing);
    const descriptor = this.requireDescriptor(skillId);
    if (descriptor.status === 'retired' || descriptor.status === 'deprecated') throw new Error(`Skill ${skillId} is ${descriptor.status} and cannot be activated`);
    if (!this.isCompatible(descriptor, request)) throw new Error(`Skill ${skillId} is incompatible with the execution risk or permissions`);
    this.validateDependencyGraph(skillId, request);
    this.resolveSecureFile(descriptor.instructionPath);
    for (const resource of descriptor.resourcePaths || []) this.validateRelativePath(resource);
    this.active.set(key, descriptor);
    this.accounting.skillsActivated += 1;
    this.emitEvent({ type: 'skill.activated', skillId, execution });
    return cloneDescriptor(descriptor);
  }

  public loadInstructions(skillId: string, execution: SkillExecutionContext): LoadedSkillContent {
    const descriptor = this.requireActive(skillId, execution.executionId);
    const loaded = this.readDeclaredFile(skillId, descriptor.instructionPath);
    const key = activeKey(execution.executionId, skillId);
    if (!this.loadedInstructions.has(key)) {
      this.loadedInstructions.add(key);
      this.accounting.instructionResourcesLoaded += 1;
      this.accounting.instructionBytesLoaded += loaded.bytes;
    }
    this.emitEvent({ type: 'skill.instructions.loaded', skillId, execution, resources: [descriptor.instructionPath], bytes: loaded.bytes });
    return loaded;
  }

  public loadResources(skillId: string, requestedPaths: string[], execution: SkillExecutionContext): LoadedSkillContent[] {
    const descriptor = this.requireActive(skillId, execution.executionId);
    const declared = new Set(descriptor.resourcePaths || []);
    const unique = [...new Set(requestedPaths)];
    unique.forEach((resourcePath) => {
      if (!declared.has(resourcePath)) throw new Error(`Resource is not declared for skill ${skillId}: ${resourcePath}`);
    });
    const loaded = unique.map((resourcePath) => this.readDeclaredFile(skillId, resourcePath));
    this.accounting.supportingResourcesLoaded += loaded.length;
    this.accounting.resourceBytesLoaded += loaded.reduce((total, item) => total + item.bytes, 0);
    this.emitEvent({ type: 'skill.resources.loaded', skillId, execution, resources: unique, bytes: loaded.reduce((total, item) => total + item.bytes, 0) });
    return loaded;
  }

  public release(skillId: string, execution: SkillExecutionContext): void {
    const key = activeKey(execution.executionId, skillId);
    if (!this.active.delete(key)) return;
    this.loadedInstructions.delete(key);
    this.emitEvent({ type: 'skill.released', skillId, execution });
  }

  public async runActivated<T>(skillId: string, execution: SkillExecutionContext, request: SkillMatchRequest, run: () => Promise<T>): Promise<T> {
    this.activate(skillId, execution, request);
    try {
      const result = await run();
      this.release(skillId, execution);
      return result;
    } catch (error) {
      this.emitEvent({ type: 'skill.failed', skillId, execution, error: error instanceof Error ? error.message : 'Unknown failure' });
      this.release(skillId, execution);
      throw error;
    }
  }

  public isActive(skillId: string, executionId: string): boolean { return this.active.has(activeKey(executionId, skillId)); }

  public getAccounting(): SkillContextAccounting {
    let allInstructionBytes = 0;
    for (const descriptor of this.descriptors.values()) {
      try { allInstructionBytes += fs.statSync(this.resolveSecureFile(descriptor.instructionPath)).size; } catch {}
    }
    return { ...this.accounting, unrelatedInstructionBytesAvoided: Math.max(0, allInstructionBytes - this.accounting.instructionBytesLoaded) };
  }

  private isCompatible(descriptor: SkillDescriptor, request: SkillMatchRequest): boolean {
    if (descriptor.status === 'retired' || descriptor.status === 'deprecated') return false;
    if (RISK_RANK[descriptor.risk || 'low'] > RISK_RANK[request.maxRisk]) return false;
    return (descriptor.permissions || []).every((permission) => request.permissions.includes(permission));
  }

  private dependenciesCompatible(skillId: string, request: SkillMatchRequest): boolean {
    try {
      this.validateDependencyGraph(skillId, request);
      return true;
    } catch {
      return false;
    }
  }

  private validateDependencyGraph(skillId: string, request: SkillMatchRequest, visiting = new Set<string>(), depth = 0): void {
    if (depth > this.maxDependencyDepth) throw new Error(`Dependency depth exceeds limit ${this.maxDependencyDepth}`);
    if (visiting.has(skillId)) throw new Error(`Dependency cycle detected at ${skillId}`);
    const descriptor = this.requireDescriptor(skillId);
    visiting.add(skillId);
    for (const dependencyId of descriptor.dependencies || []) {
      const dependency = this.descriptors.get(dependencyId);
      if (!dependency) throw new Error(`Missing dependency ${dependencyId} required by ${skillId}`);
      if (!this.isCompatible(dependency, request)) throw new Error(`Dependency ${dependencyId} is not active/compatible`);
      this.resolveSecureFile(dependency.instructionPath);
      for (const resource of dependency.resourcePaths || []) this.validateRelativePath(resource);
      this.validateDependencyGraph(dependencyId, request, visiting, depth + 1);
    }
    visiting.delete(skillId);
  }

  private readDeclaredFile(skillId: string, relativePath: string): LoadedSkillContent {
    const filePath = this.resolveSecureFile(relativePath);
    const extension = path.extname(filePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) throw new Error(`Unsupported skill file type: ${extension || 'none'}`);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error(`Skill resource is not a file: ${relativePath}`);
    if (stat.size > this.maxFileBytes) throw new Error(`Skill resource exceeds size limit: ${relativePath}`);
    return { skillId, path: relativePath, content: fs.readFileSync(filePath, 'utf-8'), bytes: stat.size };
  }

  private resolveSecureFile(relativePath: string): string {
    this.validateRelativePath(relativePath);
    for (const root of this.roots) {
      const candidate = path.resolve(root, relativePath);
      if (!isWithin(root, candidate) || !fs.existsSync(candidate)) continue;
      const real = fs.realpathSync(candidate);
      if (!isWithin(root, real)) throw new Error(`Skill path escapes approved root: ${relativePath}`);
      return real;
    }
    throw new Error(`Skill path is outside approved roots or missing: ${relativePath}`);
  }

  private validateRelativePath(relativePath: string): void {
    if (!relativePath || path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes('..')) throw new Error(`Path traversal or arbitrary absolute path rejected: ${relativePath}`);
  }

  private requireDescriptor(skillId: string): SkillDescriptor {
    const descriptor = this.descriptors.get(skillId);
    if (!descriptor) throw new Error(`Unknown skill: ${skillId}`);
    return descriptor;
  }

  private requireActive(skillId: string, executionId: string): SkillDescriptor {
    const descriptor = this.active.get(activeKey(executionId, skillId));
    if (!descriptor) throw new Error(`Skill ${skillId} is not active for execution ${executionId}`);
    return descriptor;
  }
}

function emitToLiveOperations(event: SkillLifecycleEvent): void {
  if (!event.execution) return;
  const data = {
    agentId: event.execution.agentId,
    agentName: event.execution.agentName,
    missionId: event.execution.missionId,
    missionName: event.execution.missionName,
    taskId: event.execution.taskId,
    taskName: event.execution.taskName,
    skill: event.skillId,
    resourcesLoaded: event.resources,
    error: event.error,
  };
  globalLiveOperationsStore.addEvent(globalAgentExecutionTelemetry.record(event.type as AgentExecutionEventType, data));
}

function freezeDescriptor(descriptor: SkillDescriptor): SkillDescriptor {
  return Object.freeze(cloneDescriptor(descriptor));
}
function cloneDescriptor(descriptor: SkillDescriptor): SkillDescriptor {
  return {
    id: descriptor.id, name: descriptor.name, category: descriptor.category, owner: descriptor.owner,
    version: descriptor.version, status: descriptor.status, summary: descriptor.summary,
    capabilities: [...descriptor.capabilities], triggerHints: descriptor.triggerHints ? [...descriptor.triggerHints] : undefined,
    dependencies: descriptor.dependencies ? [...descriptor.dependencies] : undefined, risk: descriptor.risk,
    permissions: descriptor.permissions ? [...descriptor.permissions] : undefined,
    instructionPath: descriptor.instructionPath, resourcePaths: descriptor.resourcePaths ? [...descriptor.resourcePaths] : undefined,
  };
}
function activeKey(executionId: string, skillId: string): string { return `${executionId}:${skillId}`; }
function isWithin(root: string, candidate: string): boolean { return candidate === root || candidate.startsWith(`${root}${path.sep}`); }
function emptyAccounting(): SkillContextAccounting {
  return {
    skillsDiscovered: 0, skillsMatched: 0, skillsActivated: 0, instructionResourcesLoaded: 0,
    supportingResourcesLoaded: 0, metadataBytesInspected: 0, instructionBytesLoaded: 0,
    resourceBytesLoaded: 0, unrelatedInstructionBytesAvoided: 0, tokenCount: 'Unavailable',
  };
}
