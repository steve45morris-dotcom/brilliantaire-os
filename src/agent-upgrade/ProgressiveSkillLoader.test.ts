import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProgressiveSkillLoader, type SkillDescriptor, type SkillLifecycleEvent } from './ProgressiveSkillLoader.js';
import { PromptCompiler } from '../runtime/PromptCompiler.js';
import { CapabilityCompletionGuard } from '../kernel/governance/CapabilityCompletionGuard.js';

let root = '';
let events: SkillLifecycleEvent[] = [];

const base: SkillDescriptor = {
  id: 'research-safe', name: 'Research Safe', category: 'research', owner: 'Planner', version: '1.0.0',
  status: 'active', summary: 'Researches approved sources.', capabilities: ['market-research'],
  triggerHints: ['research', 'market'], dependencies: [], risk: 'low', permissions: ['network:read'],
  instructionPath: 'research-safe/SKILL.md', resourcePaths: ['research-safe/references/guide.md'],
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'progressive-skills-'));
  events = [];
  fs.mkdirSync(path.join(root, 'research-safe', 'references'), { recursive: true });
  fs.writeFileSync(path.join(root, 'research-safe', 'SKILL.md'), '# PRIVATE INSTRUCTIONS\nUse approved sources.');
  fs.writeFileSync(path.join(root, 'research-safe', 'references', 'guide.md'), '# PRIVATE GUIDE');
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function loader(descriptors: SkillDescriptor[] = [base], overrides: Record<string, unknown> = {}) {
  return new ProgressiveSkillLoader({
    approvedRoots: [root], descriptors, emit: (event) => events.push(event),
    maxFileBytes: 128, maxDependencyDepth: 4, ...overrides,
  });
}

const request = { mission: 'Research the market', intent: 'research competitors', requiredCapabilities: ['market-research'], permissions: ['network:read'], maxRisk: 'medium' as const };
const execution = { executionId: 'exec-1', agentId: 'agent-1', agentName: 'Planner' };

describe('ProgressiveSkillLoader', () => {
  it('discovers Level 1 metadata without SKILL.md contents', () => {
    const result = loader().discover();
    expect(result.skills[0]).toEqual(base);
    expect(JSON.stringify(result)).not.toContain('PRIVATE INSTRUCTIONS');
  });

  it('matches declared capabilities before trigger hints', () => {
    const weak = { ...base, id: 'hint-only', instructionPath: 'research-safe/SKILL.md', capabilities: ['other'], triggerHints: ['research'] };
    expect(loader([weak, base]).match(request).candidates.map((item) => item.descriptor.id)).toEqual(['research-safe', 'hint-only']);
  });

  it('does not load non-matching skills', () => {
    const other = { ...base, id: 'writer', category: 'content', capabilities: ['copywriting'], triggerHints: ['write'] };
    const instance = loader([base, other]);
    const matched = instance.match(request);
    instance.activate(matched.candidates[0].descriptor.id, execution, request);
    expect(instance.loadInstructions('research-safe', execution).content).toContain('PRIVATE INSTRUCTIONS');
    expect(instance.getAccounting().instructionBytesLoaded).toBe(Buffer.byteLength('# PRIVATE INSTRUCTIONS\nUse approved sources.'));
  });

  it('loads instructions only after activation', () => {
    const instance = loader();
    expect(() => instance.loadInstructions(base.id, execution)).toThrow(/not active/i);
    instance.activate(base.id, execution, request);
    expect(instance.loadInstructions(base.id, execution).content).toContain('PRIVATE INSTRUCTIONS');
  });

  it('does not load supporting resources automatically', () => {
    const instance = loader();
    instance.activate(base.id, execution, request);
    instance.loadInstructions(base.id, execution);
    expect(instance.getAccounting().resourceBytesLoaded).toBe(0);
  });

  it('loads only an explicitly requested declared resource', () => {
    const instance = loader();
    instance.activate(base.id, execution, request);
    const loaded = instance.loadResources(base.id, ['research-safe/references/guide.md'], execution);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].content).toContain('PRIVATE GUIDE');
  });

  it('fails clearly on a missing dependency', () => {
    expect(() => loader([{ ...base, dependencies: ['missing'] }]).activate(base.id, execution, request)).toThrow(/missing dependency/i);
  });

  it('rejects circular dependencies', () => {
    const second = { ...base, id: 'second', dependencies: [base.id] };
    expect(() => loader([{ ...base, dependencies: ['second'] }, second]).activate(base.id, execution, request)).toThrow(/dependency cycle/i);
  });

  it('rejects dependencies that exceed the execution permission boundary', () => {
    const dependency = { ...base, id: 'dependency', permissions: ['secrets:read'] };
    expect(() => loader([{ ...base, dependencies: ['dependency'] }, dependency]).activate(base.id, execution, request)).toThrow(/not active\/compatible/i);
  });

  it('does not activate retired skills', () => {
    expect(() => loader([{ ...base, status: 'retired' }]).activate(base.id, execution, request)).toThrow(/retired/i);
  });

  it('makes duplicate activation idempotent', () => {
    const instance = loader();
    expect(instance.activate(base.id, execution, request)).toEqual(instance.activate(base.id, execution, request));
    expect(events.filter((event) => event.type === 'skill.activated')).toHaveLength(1);
  });

  it('rejects path traversal', () => {
    expect(() => loader([{ ...base, instructionPath: '../outside.md' }]).activate(base.id, execution, request)).toThrow(/path traversal|approved root/i);
  });

  it('rejects symlink escape', () => {
    const outside = path.join(os.tmpdir(), `outside-${Date.now()}.md`);
    fs.writeFileSync(outside, 'outside');
    fs.symlinkSync(outside, path.join(root, 'research-safe', 'escape.md'));
    const instance = loader([{ ...base, resourcePaths: ['research-safe/escape.md'] }]);
    instance.activate(base.id, execution, request);
    expect(() => instance.loadResources(base.id, ['research-safe/escape.md'], execution)).toThrow(/approved root/i);
    fs.rmSync(outside, { force: true });
  });

  it('rejects oversized resources', () => {
    fs.writeFileSync(path.join(root, 'research-safe', 'references', 'guide.md'), 'x'.repeat(129));
    const instance = loader(); instance.activate(base.id, execution, request);
    expect(() => instance.loadResources(base.id, [base.resourcePaths![0]], execution)).toThrow(/size limit/i);
  });

  it('rejects unsupported file types', () => {
    fs.writeFileSync(path.join(root, 'research-safe', 'payload.bin'), 'binary');
    const instance = loader([{ ...base, resourcePaths: ['research-safe/payload.bin'] }]);
    instance.activate(base.id, execution, request);
    expect(() => instance.loadResources(base.id, ['research-safe/payload.bin'], execution)).toThrow(/file type/i);
  });

  it('release clears active runtime state', () => {
    const instance = loader(); instance.activate(base.id, execution, request); instance.release(base.id, execution);
    expect(instance.isActive(base.id, execution.executionId)).toBe(false);
  });

  it('failure releases active runtime state', async () => {
    const instance = loader();
    await expect(instance.runActivated(base.id, execution, request, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(instance.isActive(base.id, execution.executionId)).toBe(false);
    expect(events.slice(-2).map((event) => event.type)).toEqual(['skill.failed', 'skill.released']);
  });

  it('does not replace CapabilityCompletionGuard authority', () => {
    const instance = loader(); instance.activate(base.id, execution, request); instance.release(base.id, execution);
    const result = new CapabilityCompletionGuard().evaluate({ objective: 'verify task', target: 'output', requiredCapabilities: ['proof'], availableCapabilities: [], executionSurface: 'test' });
    expect(result.status).toBe('BLOCKED_CAPABILITY');
  });

  it('emits lifecycle events consumed by existing execution telemetry', () => {
    const instance = loader(); instance.discover(execution); instance.match(request, execution); instance.activate(base.id, execution, request);
    instance.loadInstructions(base.id, execution); instance.loadResources(base.id, [base.resourcePaths![0]], execution); instance.release(base.id, execution);
    expect(events.map((event) => event.type)).toEqual(['skill.discovered', 'skill.selected', 'skill.activated', 'skill.instructions.loaded', 'skill.resources.loaded', 'skill.released']);
  });

  it('assembles prompts without unrelated skill instructions', () => {
    const compiler = new PromptCompiler();
    const prompt = compiler.assembleContext('base', 'mission', [base], [{ skillId: base.id, path: base.instructionPath, content: 'SELECTED', bytes: 8 }], []);
    expect(prompt).toContain('SELECTED');
    expect(prompt).not.toContain('UNRELATED');
  });

  it('ignores new registry fields when assembling loaded context', () => {
    const descriptor = { ...base, futurePrivateField: 'DO NOT LOAD' } as SkillDescriptor;
    const prompt = new PromptCompiler().assembleContext('base', 'mission', [descriptor], [], []);
    expect(prompt).not.toContain('DO NOT LOAD');
  });

  it('adding an unselected skill does not increase active prompt context', () => {
    const compiler = new PromptCompiler();
    const instruction = { skillId: base.id, path: base.instructionPath, content: 'SELECTED', bytes: 8 };
    const one = compiler.assembleContext('base', 'mission', [base], [instruction], []);
    const added = { ...base, id: 'unrelated', summary: 'Unrelated', instructionPath: 'unrelated/SKILL.md' };
    const two = compiler.assembleContext('base', 'mission', [base, added], [instruction], []);
    expect(Buffer.byteLength(two)).toBe(Buffer.byteLength(one));
  });
});
