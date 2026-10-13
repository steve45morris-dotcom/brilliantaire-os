import { describe, it, expect } from 'vitest';
import { SkillRegistryManager } from './registry.js';
import { AgentRouter } from './router.js';
import { GoalVerificationEngine } from './verifier.js';

describe('SkillRegistryManager', () => {
  it('should load initial metadata successfully', () => {
    const registry = new SkillRegistryManager();
    const metadata = registry.loadMetadataOnly();
    expect(Object.keys(metadata).length).toBeGreaterThanOrEqual(10);
    expect(metadata['market-explorer']).toBeDefined();
    expect(metadata['market-explorer'].status).toBe('active');
  });

  it('should match intent query correctly', () => {
    const registry = new SkillRegistryManager();
    const matches = registry.matchIntent('Perform overnight competitive trend scanning');
    expect(matches.selected).toContain('market-explorer');
  });

  // Nine entries were retired on 2026-10-13 after never being used. Retirement
  // is a status, not a deletion, so the names stay resolvable for the agents,
  // bundles and workflow templates that list them. Both directions: a retired
  // skill is never selected, whatever the intent says, and it is not reported
  // as unused, because that would flag it on every audit forever.
  it('never matches a retired skill, and never counts one as unused', () => {
    const registry = new SkillRegistryManager();
    const metadata = registry.loadMetadataOnly();
    const retired = Object.values(metadata)
      .filter((m) => m.status === 'archived' || m.status === 'deprecated')
      .map((m) => m.name);
    expect(retired.length).toBeGreaterThanOrEqual(9);

    // One intent per category keyword, plus every retired name spelled out,
    // so each retired skill would match on both counts if status were ignored.
    const intents = [
      'research the market', 'write copy', 'send an email sequence', 'verify and audit',
      'track a metric', 'run a script', 'revenue and conversion', 'schedule a job',
      'obsidian memory context', 'render a video', ...retired.map((n) => n.replace(/-/g, ' '))
    ];
    for (const intent of intents) {
      const { selected, rejected } = registry.matchIntent(intent);
      for (const name of retired) {
        expect(selected, `${name} selected for "${intent}"`).not.toContain(name);
        expect(rejected, `${name} missing from rejected for "${intent}"`).toContain(name);
      }
    }

    const report = registry.auditSkills();
    expect(report.archivedCount + report.deprecatedCount).toBe(retired.length);
    for (const name of retired) expect(report.unusedSkills).not.toContain(name);
  });
});

describe('AgentRouter', () => {
  it('should route planning request to planner agent', () => {
    const router = new AgentRouter();
    const decision = router.inspectAndRoute('test-req', 'Draft a plan spec for SaaS backend');
    expect(decision.agentAssignment).toBe('planner-agent');
    expect(decision.detectedIntent).toBe('planning');
  });

  it('should route research request to research agent and select workflow', () => {
    const router = new AgentRouter();
    const decision = router.inspectAndRoute('test-req', 'Conduct a competitive scanner audit');
    expect(decision.agentAssignment).toBe('research-agent');
    expect(decision.workflowSelection).toBe('research-workflow');
  });
});

describe('GoalVerificationEngine', () => {
  it('should verify compliant outputs successfully', () => {
    const verifier = new GoalVerificationEngine();
    const result = verifier.verify(
      'Collect and summarize intelligence on a target topic.',
      ['Contains at least 3 source citations', 'Factual accuracy score is high'],
      '# Title\n\nGathered scan records for topic and verified variables.\n\nObjective: We collect and summarize research intelligence on target topic. References: [1] link, [2] link.',
      { expectedFormat: 'markdown' }
    );
    expect(result.passed).toBe(true);
    expect(result.factualAccuracyScore).toBeGreaterThanOrEqual(80);
  });

  it('should fail verification if placeholders are detected', () => {
    const verifier = new GoalVerificationEngine();
    const result = verifier.verify(
      'Collect and summarize intelligence.',
      ['Contains citations'],
      'Narration step placeholder TODO. Insert information here.',
      { expectedFormat: 'markdown' }
    );
    expect(result.passed).toBe(false);
    expect(result.hallucinationDetected).toBe(true);
  });
});
