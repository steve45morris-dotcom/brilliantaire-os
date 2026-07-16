import { beforeEach, describe, expect, it } from 'vitest';
import { CORE_AGENTS } from '../agent-upgrade/router.js';
import { SkillRegistryManager } from '../agent-upgrade/registry.js';
import { DEFAULT_TEMPLATES } from '../agent-upgrade/workflows.js';
import { globalLiveOperationsStore } from '../kernel/live/LiveOperationsStore.js';
import { COMPONENT_SOURCES } from './ComponentSourceRegistry.js';
import { applyDesignDashboardAction, DESIGN_QUALITY_ACTIONS } from './DesignDashboardActions.js';
import { runDesignCommand } from './DesignCli.js';
import { DESIGN_PROFILES } from './DesignProfiles.js';
import { PILOT_VERIFICATIONS } from './PilotVerification.js';
import {
  calculateVisualScore,
  detectForbiddenPatterns,
  evaluateVisualAcceptance,
  validateDesignSpec,
} from './DesignGuardian.js';

describe('Frontend Design Guardian', () => {
  beforeEach(() => globalLiveOperationsStore.clear());

  it('requires all DESIGN.md sections and rejects forbidden defaults', () => {
    const result = validateDesignSpec('# Product identity\nJoy Beauty Studio\n');
    expect(result.valid).toBe(false);
    expect(result.missingSections).toContain('Business objective');

    expect(detectForbiddenPatterns('Use a generic purple gradient with random neon.')).toEqual(
      expect.arrayContaining(['generic purple gradients', 'random neon']),
    );
  });

  it('calculates a 100-point score and applies project thresholds', () => {
    const categories = {
      brandDistinction: 9,
      typography: 9,
      layoutHierarchy: 9,
      spacingConsistency: 9,
      colorDiscipline: 9,
      imageryVisualInterest: 9,
      responsiveBehavior: 9,
      interactionQuality: 9,
      accessibility: 9,
      conversionClarity: 9,
    };
    expect(calculateVisualScore(categories)).toBe(90);
    expect(evaluateVisualAcceptance({ projectId: 'joy-beauty-studio', categories, evidence: {
      desktop: '/tmp/desktop.png', mobile: '/tmp/mobile.png', independentReviewer: 'design-review-agent',
    } }).decision).toBe('pass');
  });

  it('requires desktop, mobile, and independent-review evidence', () => {
    const categories = Object.fromEntries([
      'brandDistinction', 'typography', 'layoutHierarchy', 'spacingConsistency', 'colorDiscipline',
      'imageryVisualInterest', 'responsiveBehavior', 'interactionQuality', 'accessibility', 'conversionClarity',
    ].map((key) => [key, 10])) as any;
    const result = evaluateVisualAcceptance({ projectId: 'joy-beauty-studio', categories, evidence: {
      desktop: '/tmp/desktop.png', mobile: '', independentReviewer: '',
    } });
    expect(result.decision).toBe('revise');
    expect(result.blockers).toEqual(expect.arrayContaining([
      'Mobile screenshot evidence is required.',
      'Independent review evidence is required.',
    ]));
  });

  it('ships eight project design profiles with valid thresholds', () => {
    expect(DESIGN_PROFILES).toHaveLength(8);
    expect(new Set(DESIGN_PROFILES.map((profile) => profile.projectId)).size).toBe(8);
    expect(DESIGN_PROFILES.every((profile) => profile.minimumVisualScore >= 80)).toBe(true);
  });

  it('governs component sources with approved status values', () => {
    const statuses = new Set(['trusted', 'approved', 'experimental', 'rejected', 'deprecated']);
    expect(COMPONENT_SOURCES.length).toBeGreaterThanOrEqual(4);
    expect(COMPONENT_SOURCES.every((source) => statuses.has(source.status))).toBe(true);
  });

  it('returns structured CLI output and logs Live Operations', () => {
    const result = runDesignCommand('design:score', ['joy-beauty-studio']);
    expect(result).toMatchObject({
      command: 'design:score',
      projectId: 'joy-beauty-studio',
      threshold: 85,
      visualScore: 91,
      decision: 'pass',
      evidencePaths: expect.any(Array),
    });
    expect(globalLiveOperationsStore.getEvents()).toContainEqual(expect.objectContaining({
      type: 'DesignCommandExecuted',
      source: 'DesignCli',
    }));
  });

  it('derives pilot acceptance from an independent verification record', () => {
    expect(PILOT_VERIFICATIONS['joy-beauty-studio']).toMatchObject({
      reviewer: 'Design Review Agent',
      baselineScore: 10,
      unresolvedBlockers: [],
      runtime: {
        desktop: { consoleErrors: 0, horizontalOverflow: false },
        mobile: { consoleErrors: 0, horizontalOverflow: false },
      },
    });
    expect(runDesignCommand('design:score', ['treegroove'])).toMatchObject({
      visualScore: 0,
      decision: 'revise',
    });
  });

  it('provides meaningful behavior for every dashboard action', () => {
    expect(DESIGN_QUALITY_ACTIONS).toEqual([
      'Run Audit', 'Open DESIGN.md', 'Capture Screenshots', 'Run Review',
      'View Score', 'Compare Versions', 'Start Revision',
    ]);
    for (const action of DESIGN_QUALITY_ACTIONS) {
      expect(applyDesignDashboardAction('joy-beauty-studio', action)).toMatchObject({
        projectId: 'joy-beauty-studio',
        action,
        status: expect.stringMatching(/ready|revise/),
        detail: expect.any(String),
        evidencePaths: expect.any(Array),
      });
    }
  });

  it('registers the experimental skill, lean review agent, and visual workflow', () => {
    const skill = new SkillRegistryManager().loadFullSkill('frontend-design-guardian');
    expect(skill).toMatchObject({ name: 'frontend-design-guardian', status: 'experimental' });
    expect(CORE_AGENTS['design-review-agent']).toMatchObject({
      skills: ['frontend-design-guardian'],
    });
    expect(CORE_AGENTS['design-review-agent'].systemPrompt).toMatch(/independent/i);
    expect(DEFAULT_TEMPLATES['frontend-visual-quality-workflow']).toMatchObject({
      requiredSkills: ['frontend-design-guardian'],
    });
  });
});
