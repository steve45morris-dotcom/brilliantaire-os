import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  WorkflowTemplate,
  WorkflowInstance,
  WorkflowStep,
  SkillCategory,
  SkillMetadata,
  SkillStatus
} from './types.js';
import { SKILLS_DIR, SkillRegistryManager } from './registry.js';
import { createSystematicStudyWorkflowTemplate } from '../study/StudyWorkflow.js';
import { createFrontendVisualQualityWorkflowTemplate } from '../design/FrontendVisualQualityWorkflow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const WORKFLOWS_DIR = path.join(REPO_ROOT, 'workflows');
export const TEMPLATES_DIR = path.join(WORKFLOWS_DIR, 'templates');
export const RUNS_DIR = path.join(WORKFLOWS_DIR, 'runs');

export function initWorkflowDirectories() {
  if (!fs.existsSync(WORKFLOWS_DIR)) {
    fs.mkdirSync(WORKFLOWS_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
  if (!fs.existsSync(RUNS_DIR)) {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
  }
}

// 10 Core Workflow Templates
export const DEFAULT_TEMPLATES: Record<string, WorkflowTemplate> = {
  'research-workflow': {
    name: 'Research Workflow',
    objective: 'Collect and summarize intelligence on a target topic.',
    inputs: ['topic', 'depth'],
    requiredSkills: ['market-explorer', 'completion-verifier'],
    expectedOutput: 'A comprehensive markdown research intelligence report with citations.',
    verificationCriteria: [
      'Contains at least 3 source citations',
      'Factual accuracy score is high',
      'Addresses the key research questions in depth'
    ],
    retryLogic: { maxRetries: 2, retryDelaySec: 5 },
    humanApprovalPoints: ['Final report presentation'],
    steps: [
      {
        id: 'r1',
        name: 'Market Scan',
        description: 'Scan external trends and identify key sources.',
        requiredSkills: ['market-explorer'],
        expectedOutput: 'Raw gathered data',
        humanApprovalRequired: false
      },
      {
        id: 'r2',
        name: 'Information Verification',
        description: 'Cross-reference facts and check sources.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Verified key statements',
        humanApprovalRequired: false
      },
      {
        id: 'r3',
        name: 'Report Synthesis',
        description: 'Synthesize findings into final document.',
        requiredSkills: ['copy-writer'],
        expectedOutput: 'Draft intelligence report',
        humanApprovalRequired: true
      }
    ]
  },
  'content-workflow': {
    name: 'Content Workflow',
    objective: 'Generate and refine high-fidelity marketing copy.',
    inputs: ['campaignGoal', 'audience'],
    requiredSkills: ['copy-writer', 'completion-verifier'],
    expectedOutput: 'Ready-to-publish campaign copy assets.',
    verificationCriteria: [
      'Aligns with campaign goal',
      'Contains call-to-actions',
      'Passes style and formatting guidelines'
    ],
    retryLogic: { maxRetries: 2, retryDelaySec: 10 },
    humanApprovalPoints: ['Copy publishing approval'],
    steps: [
      {
        id: 'c1',
        name: 'Outline Generation',
        description: 'Draft the narrative outline based on audience.',
        requiredSkills: ['copy-writer'],
        expectedOutput: 'Content outline',
        humanApprovalRequired: false
      },
      {
        id: 'c2',
        name: 'Draft Creation',
        description: 'Flesh out copy and write draft versions.',
        requiredSkills: ['copy-writer'],
        expectedOutput: 'Full draft copy',
        humanApprovalRequired: false
      },
      {
        id: 'c3',
        name: 'Quality Review',
        description: 'Verify tone and check for readability.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Reviewed and proofed copy',
        humanApprovalRequired: true
      }
    ]
  },
  'outreach-workflow': {
    name: 'Outreach Workflow',
    objective: 'Construct and queue outreach sequence campaigns.',
    inputs: ['prospectList', 'campaignName'],
    requiredSkills: ['email-sequencer', 'metric-tracker'],
    expectedOutput: 'Active queue of structured outreach sequences.',
    verificationCriteria: [
      'Prospect variables are correctly filled',
      'Tracking links are operational',
      'Emails conform to spam compliance'
    ],
    retryLogic: { maxRetries: 3, retryDelaySec: 15 },
    humanApprovalPoints: ['Campaign dispatch trigger'],
    steps: [
      {
        id: 'o1',
        name: 'Draft Sequences',
        description: 'Create individual sequence email steps.',
        requiredSkills: ['copy-writer'],
        expectedOutput: 'Sequence email drafts',
        humanApprovalRequired: false
      },
      {
        id: 'o2',
        name: 'Validate Variables',
        description: 'Check prospect tags, variables, and links.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Validated list data',
        humanApprovalRequired: false
      },
      {
        id: 'o3',
        name: 'Queue Dispatch',
        description: 'Queue messages in scheduler pipeline.',
        requiredSkills: ['email-sequencer'],
        expectedOutput: 'Active queue schedules',
        humanApprovalRequired: true
      }
    ]
  },
  'publishing-workflow': {
    name: 'Publishing Workflow',
    objective: 'Format, review, and stage assets for production release.',
    inputs: ['assetPath', 'targetChannel'],
    requiredSkills: ['task-runner', 'completion-verifier'],
    expectedOutput: 'Published assets with distribution logs.',
    verificationCriteria: [
      'Asset status is marked published',
      'Verification check returns pass',
      'Metadata contains target channel details'
    ],
    retryLogic: { maxRetries: 1, retryDelaySec: 5 },
    humanApprovalPoints: ['Final release publish gate'],
    steps: [
      {
        id: 'p1',
        name: 'Preflight Formatting',
        description: 'Format the asset according to channel requirements.',
        requiredSkills: ['task-runner'],
        expectedOutput: 'Formatted files',
        humanApprovalRequired: false
      },
      {
        id: 'p2',
        name: 'Release Verification',
        description: 'Verify code integrity and asset checksums.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Release verification report',
        humanApprovalRequired: false
      },
      {
        id: 'p3',
        name: 'Release Distribution',
        description: 'Transmit the files to final channel destinations.',
        requiredSkills: ['task-runner'],
        expectedOutput: 'Receipt token logs',
        humanApprovalRequired: true
      }
    ]
  },
  'market-scan-workflow': {
    name: 'Market Scan Workflow',
    objective: 'Perform competitive analysis and trend research.',
    inputs: ['niche', 'competitors'],
    requiredSkills: ['market-explorer', 'metric-tracker'],
    expectedOutput: 'Competitive matrix and threat assessment map.',
    verificationCriteria: [
      'Competitor list matches user inputs',
      'Identifies at least 2 distinct opportunities',
      'Telemetry index contains the scan event'
    ],
    retryLogic: { maxRetries: 2, retryDelaySec: 10 },
    humanApprovalPoints: ['Opportunity selection gate'],
    steps: [
      {
        id: 'm1',
        name: 'Source Scanning',
        description: 'Query Exa and web search tools for news.',
        requiredSkills: ['market-explorer'],
        expectedOutput: 'Raw search articles list',
        humanApprovalRequired: false
      },
      {
        id: 'm2',
        name: 'Telemetry Aggregation',
        description: 'Track volume patterns and score competitor popularity.',
        requiredSkills: ['metric-tracker'],
        expectedOutput: 'Score ledger data',
        humanApprovalRequired: false
      },
      {
        id: 'm3',
        name: 'Strategy Mapping',
        description: 'Synthesize matrix and opportunities report.',
        requiredSkills: ['copy-writer'],
        expectedOutput: 'Market Scan final overview',
        humanApprovalRequired: true
      }
    ]
  },
  'product-build-workflow': {
    name: 'Product Build Workflow',
    objective: 'Develop features, run tests, and confirm architectural alignment.',
    inputs: ['specs', 'targetFiles'],
    requiredSkills: ['task-runner', 'completion-verifier'],
    expectedOutput: 'Compiled, linted, and verified build output.',
    verificationCriteria: [
      'Types compile successfully without errors',
      'All unit and regression tests pass',
      'No boundary rules are violated'
    ],
    retryLogic: { maxRetries: 2, retryDelaySec: 8 },
    humanApprovalPoints: ['Deploy code to production'],
    steps: [
      {
        id: 'pb1',
        name: 'Scaffold and Code',
        description: 'Implement the logic files according to specs.',
        requiredSkills: ['task-runner'],
        expectedOutput: 'Draft code modules',
        humanApprovalRequired: false
      },
      {
        id: 'pb2',
        name: 'Audit and Test',
        description: 'Run vitest and static type checking.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Test suite pass logs',
        humanApprovalRequired: false
      },
      {
        id: 'pb3',
        name: 'Boundary Gate',
        description: 'Perform architectural review checks.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Safe boundaries confirmation',
        humanApprovalRequired: true
      }
    ]
  },
  'revenue-workflow': {
    name: 'Revenue Workflow',
    objective: 'Deploy monetization hooks and monitor pricing layers.',
    inputs: ['offerDetails', 'channelTarget'],
    requiredSkills: ['metric-tracker', 'conversion-optimizer'],
    expectedOutput: 'Live pricing pages and active tracking metrics.',
    verificationCriteria: [
      'Conversion pixel triggers correctly',
      'Price variables match active offers',
      'Billing endpoints are reachable'
    ],
    retryLogic: { maxRetries: 1, retryDelaySec: 10 },
    humanApprovalPoints: ['Pricing strategy launch'],
    steps: [
      {
        id: 'rev1',
        name: 'Offer Architecture',
        description: 'Design tier structuring and pricing formulas.',
        requiredSkills: ['copy-writer'],
        expectedOutput: 'Pricing specification schema',
        humanApprovalRequired: false
      },
      {
        id: 'rev2',
        name: 'Deployment of Hooks',
        description: 'Setup tracking triggers and web hooks.',
        requiredSkills: ['metric-tracker'],
        expectedOutput: 'Telemetry setup confirmations',
        humanApprovalRequired: false
      },
      {
        id: 'rev3',
        name: 'Checkout Simulation',
        description: 'Simulate user transactions and check conversion pipelines.',
        requiredSkills: ['conversion-optimizer'],
        expectedOutput: 'Verified funnel transactions report',
        humanApprovalRequired: true
      }
    ]
  },
  'daily-brief-workflow': {
    name: 'Daily Brief Workflow',
    objective: 'Sync knowledge inputs and draft the daily workspace roadmap.',
    inputs: ['obsidianPath'],
    requiredSkills: ['context-weaver', 'system-scheduler'],
    expectedOutput: 'A summary brief ready for audio / transcript feed.',
    verificationCriteria: [
      'Decisions and blockers are parsed',
      'Next actions are updated and prioritized',
      'Telemetry contains the ingestion status'
    ],
    retryLogic: { maxRetries: 2, retryDelaySec: 5 },
    humanApprovalPoints: ['Daily plan execution release'],
    steps: [
      {
        id: 'db1',
        name: 'Ingest Obsidian Note',
        description: 'Parse active canvas nodes and vault files.',
        requiredSkills: ['context-weaver'],
        expectedOutput: 'Extracted raw note summaries',
        humanApprovalRequired: false
      },
      {
        id: 'db2',
        name: 'Task Reprioritization',
        description: 'Align next action weights based on outcomes.',
        requiredSkills: ['system-scheduler'],
        expectedOutput: 'Ranked checklist data',
        humanApprovalRequired: false
      },
      {
        id: 'db3',
        name: 'Draft Briefing Summary',
        description: 'Generate markdown briefing file.',
        requiredSkills: ['copy-writer'],
        expectedOutput: 'Draft daily summary roadmap',
        humanApprovalRequired: true
      }
    ]
  },
  'media-generation-workflow': {
    name: 'Media Generation Workflow',
    objective: 'Generate asset scenes and sync them to scripts.',
    inputs: ['prompt', 'durationSec'],
    requiredSkills: ['video-generator', 'copy-writer'],
    expectedOutput: 'Rendered media artifacts catalog.',
    verificationCriteria: [
      'Render status is complete',
      'Duration constraints are satisfied',
      'Dialogue script matches scene timestamps'
    ],
    retryLogic: { maxRetries: 3, retryDelaySec: 20 },
    humanApprovalPoints: ['Final video rendering release'],
    steps: [
      {
        id: 'mg1',
        name: 'Dialogue Scripting',
        description: 'Create script prompts and timeline actions.',
        requiredSkills: ['copy-writer'],
        expectedOutput: 'Scene breakdown and timing lines',
        humanApprovalRequired: false
      },
      {
        id: 'mg2',
        name: 'Video Generation Run',
        description: 'Call media creation tools and fetch video URLs.',
        requiredSkills: ['video-generator'],
        expectedOutput: 'Render URLs links',
        humanApprovalRequired: false
      },
      {
        id: 'mg3',
        name: 'Composition Quality',
        description: 'Ensure layout looks cinematic and meets density rules.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Media review pass signature',
        humanApprovalRequired: true
      }
    ]
  },
  'github-monitoring-workflow': {
    name: 'GitHub Monitoring Workflow',
    objective: 'Audit PR requests, boundaries, and dependencies.',
    inputs: ['repoUrl'],
    requiredSkills: ['task-runner', 'completion-verifier'],
    expectedOutput: 'Vulnerability scan reports and conflict reviews.',
    verificationCriteria: [
      'All open PRs are scanned',
      'Security review check completes successfully',
      'No critical package warnings remain unflagged'
    ],
    retryLogic: { maxRetries: 2, retryDelaySec: 10 },
    humanApprovalPoints: ['PR merge approval'],
    steps: [
      {
        id: 'gh1',
        name: 'Fetch State',
        description: 'Scan Git commit history and branch paths.',
        requiredSkills: ['task-runner'],
        expectedOutput: 'PR lists and file modifications diff',
        humanApprovalRequired: false
      },
      {
        id: 'gh2',
        name: 'Boundary Check',
        description: 'Verify no circular references exist in code diffs.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Boundary verification logs',
        humanApprovalRequired: false
      },
      {
        id: 'gh3',
        name: 'Security Scan Run',
        description: 'Audit node_modules for vulnerability flags.',
        requiredSkills: ['completion-verifier'],
        expectedOutput: 'Scan summaries report',
        humanApprovalRequired: true
      }
    ]
  },
  'systematic-study-workflow': createSystematicStudyWorkflowTemplate(),
  'frontend-visual-quality-workflow': createFrontendVisualQualityWorkflowTemplate()
};

export class WorkflowManager {
  constructor() {
    initWorkflowDirectories();
    this.ensureTemplates();
  }

  private ensureTemplates() {
    Object.keys(DEFAULT_TEMPLATES).forEach((key) => {
      const template = DEFAULT_TEMPLATES[key];
      const templatePath = path.join(TEMPLATES_DIR, `${key}.json`);
      if (!fs.existsSync(templatePath)) {
        fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), 'utf-8');
      }
    });
  }

  // Load a template
  getTemplate(name: string): WorkflowTemplate | null {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const templatePath = path.join(TEMPLATES_DIR, `${slug}.json`);
    if (fs.existsSync(templatePath)) {
      try {
        return JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
      } catch (e) {
        console.error(`[Workflows] Failed to parse template ${slug}: ${(e as Error).message}`);
      }
    }
    return DEFAULT_TEMPLATES[slug] || null;
  }

  // List all templates
  listTemplates(): WorkflowTemplate[] {
    const files = fs.readdirSync(TEMPLATES_DIR);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf-8'));
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean) as WorkflowTemplate[];
  }

  // Instantiate template to create runnable instance
  createInstance(templateName: string, inputs: Record<string, any>): WorkflowInstance | null {
    const template = this.getTemplate(templateName);
    if (!template) return null;

    const id = `wf-run-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Map template steps to runnable steps with 'pending' status
    const steps: WorkflowStep[] = template.steps.map((step) => ({
      ...step,
      status: 'pending'
    }));

    const instance: WorkflowInstance = {
      id,
      templateName: template.name,
      objective: template.objective,
      inputs,
      steps,
      requiredSkills: template.requiredSkills,
      expectedOutput: template.expectedOutput,
      verificationCriteria: template.verificationCriteria,
      retryLogic: template.retryLogic,
      humanApprovalPoints: template.humanApprovalPoints,
      status: 'pending',
      currentStepIndex: 0,
      outputs: {},
      errors: []
    };

    this.saveInstance(instance);
    return instance;
  }

  saveInstance(instance: WorkflowInstance) {
    fs.writeFileSync(
      path.join(RUNS_DIR, `${instance.id}.json`),
      JSON.stringify(instance, null, 2),
      'utf-8'
    );
  }

  getInstance(id: string): WorkflowInstance | null {
    const runPath = path.join(RUNS_DIR, `${id}.json`);
    if (fs.existsSync(runPath)) {
      try {
        return JSON.parse(fs.readFileSync(runPath, 'utf-8'));
      } catch (e) {
        console.error(`[Workflows] Failed to parse instance ${id}: ${(e as Error).message}`);
      }
    }
    return null;
  }

  // Workflow Packaging Pipeline (Repeated successful workflow to skill)
  packageWorkflowToSkill(
    instanceId: string,
    skillCategory: SkillCategory,
    newSkillName: string,
    owner: string
  ): boolean {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      console.error(`[Packaging] Workflow run instance ${instanceId} not found.`);
      return false;
    }

    if (instance.status !== 'completed') {
      console.error(`[Packaging] Workflow run instance ${instanceId} did not complete successfully. Current state: ${instance.status}`);
      return false;
    }

    const skillRegistry = new SkillRegistryManager();
    const metadata = skillRegistry.loadMetadataOnly();
    if (metadata[newSkillName]) {
      console.error(`[Packaging] Skill named '${newSkillName}' is already registered.`);
      return false;
    }

    // Assemble packaging content
    const cleanName = newSkillName.toLowerCase().replace(/\s+/g, '-');
    const skillFolder = path.join(SKILLS_DIR, skillCategory, cleanName);
    
    // Create folders
    fs.mkdirSync(skillFolder, { recursive: true });
    fs.mkdirSync(path.join(skillFolder, 'references'), { recursive: true });
    fs.mkdirSync(path.join(skillFolder, 'scripts'), { recursive: true });

    // Generate SKILL.md
    const stepsList = instance.steps
      .map((s, idx) => `${idx + 1}. **${s.name}**\n   - Action: ${s.description}\n   - Output expectations: ${s.expectedOutput}`)
      .join('\n');

    const skillInstructions = `# Skill Instructions: ${instance.templateName} Evolved

This skill was packaged from successful run \`${instance.id}\`.
Category: ${skillCategory}
Owner: ${owner}

## Objective
${instance.objective}

## Core Workflow Steps Translated to Guidelines
${stepsList}

## Dynamic Execution
When triggered:
1. Load context inputs.
2. Formulate step logic.
3. Validate each outputs iteratively.
`;

    fs.writeFileSync(path.join(skillFolder, 'SKILL.md'), skillInstructions, 'utf-8');

    // Generate metadata.json
    const newMeta: SkillMetadata = {
      name: cleanName,
      owner,
      version: '1.0.0',
      status: 'experimental', // Marked experimental until manually verified
      category: skillCategory,
      dependencies: instance.requiredSkills,
      lastUsed: null,
      usageCount: 0,
      successRate: 0.0,
      failureNotes: [],
      retirementCandidate: false,
      verificationNotes: `Packaged automatically from workflow run ${instance.id}. Staged for human verification.`
    };

    fs.writeFileSync(path.join(skillFolder, 'metadata.json'), JSON.stringify(newMeta, null, 2), 'utf-8');

    // Generate examples.md
    const examplesContent = `# Successful Run Example

## Inputs
\`\`\`json
${JSON.stringify(instance.inputs, null, 2)}
\`\`\`

## Outputs
\`\`\`json
${JSON.stringify(instance.outputs, null, 2)}
\`\`\`
`;
    fs.writeFileSync(path.join(skillFolder, 'examples.md'), examplesContent, 'utf-8');

    // Generate tests.md
    const testsContent = `# Verification Tests

## Rubric Checks
${instance.verificationCriteria.map((c) => `- [ ] Verify: ${c}`).join('\n')}

## Test Run Script
To run mock validation:
\`npm run verify-output -- --runId ${instance.id}\`
`;
    fs.writeFileSync(path.join(skillFolder, 'tests.md'), testsContent, 'utf-8');

    // Generate changelog.md
    const changelogContent = `# Changelog

## [1.0.0] - ${new Date().toISOString().split('T')[0]}
- Initial release packaged from successful workflow run \`${instance.id}\`.
`;
    fs.writeFileSync(path.join(skillFolder, 'changelog.md'), changelogContent, 'utf-8');

    // Add to main registry
    const mainRegistry = skillRegistry.loadMetadataOnly();
    mainRegistry[cleanName] = newMeta;
    skillRegistry.saveMetadata(mainRegistry);

    return true;
  }
}
