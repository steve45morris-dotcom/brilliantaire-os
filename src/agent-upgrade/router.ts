import {
  AgentDefinition,
  RouterDecision,
  WorkflowTemplate
} from './types.js';
import { SkillRegistryManager } from './registry.js';
import { WorkflowManager } from './workflows.js';

// Core Agent Definitions (lean definitions with zero skill logic duplication)
export const CORE_AGENTS: Record<string, AgentDefinition> = {
  'planner-agent': {
    name: 'Planner Agent',
    role: 'OS Architect & Strategist',
    systemPrompt: 'You design execution paths, align requirements, and write blueprints before acting.',
    skills: ['market-explorer', 'context-weaver']
  },
  'executor-agent': {
    name: 'Executor Agent',
    role: 'Action Runner',
    systemPrompt: 'You carry out commands, execute scripts, and complete modular tasks in the shell sandbox.',
    skills: ['task-runner']
  },
  'verifier-agent': {
    name: 'Verifier Agent',
    role: 'Quality Auditor',
    systemPrompt: 'You verify facts, compliance criteria, formats, and prevent hallucinations or premature completion declarations.',
    skills: ['completion-verifier', 'metric-tracker']
  },
  'memory-agent': {
    name: 'Memory Agent',
    role: 'Knowledge Librarian',
    systemPrompt: 'You organize decisions, extract outcomes, compile lessons, and sync note nodes without overlaps.',
    skills: ['context-weaver']
  },
  'research-agent': {
    name: 'Research Agent',
    role: 'Competitive Intelligence Scout',
    systemPrompt: 'You scan the web, aggregate competitor strategies, and summarize niche reports with source citations.',
    skills: ['market-explorer']
  },
  'content-agent': {
    name: 'Content Agent',
    role: 'Copywriter & Creator',
    systemPrompt: 'You write high-fidelity copy, structure narrative drafts, and draft platform-native marketing assets.',
    skills: ['copy-writer']
  },
  'automation-agent': {
    name: 'Automation Agent',
    role: 'Workflow Integrator',
    systemPrompt: 'You wire background triggers, manage schedulers, and automate loops efficiently.',
    skills: ['task-runner', 'system-scheduler']
  },
  'revenue-agent': {
    name: 'Revenue Agent',
    role: 'Monetization Strategist',
    systemPrompt: 'You design billing configurations, setup conversion trackers, and map campaign ad structures.',
    skills: ['metric-tracker', 'conversion-optimizer']
  },
  'media-workflow-agent': {
    name: 'Media Workflow Agent',
    role: 'Creative Media Producer',
    systemPrompt: 'You write dialogue timelines, script visual clips, and drive scene rendering loops.',
    skills: ['video-generator', 'copy-writer']
  },
  'operations-agent': {
    name: 'Operations Agent',
    role: 'Release Deployment Manager',
    systemPrompt: 'You manage queue lists, coordinate releases, and monitor live systems metrics.',
    skills: ['system-scheduler', 'email-sequencer', 'task-runner']
  },
  'design-review-agent': {
    name: 'Design Review Agent',
    role: 'Independent Frontend Quality Reviewer',
    systemPrompt: 'Invoke Frontend Design Guardian, inspect desktop and mobile evidence, compare the implementation with DESIGN.md, score with cited evidence, reject work below threshold, and produce prioritized revisions. Never approve your own initial implementation without an independent verification pass.',
    skills: ['frontend-design-guardian']
  }
};

export class AgentRouter {
  private registryManager: SkillRegistryManager;
  private workflowManager: WorkflowManager;

  constructor() {
    this.registryManager = new SkillRegistryManager();
    this.workflowManager = new WorkflowManager();
  }

  // Inspect and route requests
  inspectAndRoute(requestId: string, requestText: string): RouterDecision {
    const cleanText = requestText.toLowerCase();
    
    // 1. Intent Detection
    let detectedIntent = 'general_execution';
    let workflowSelection: string | undefined = undefined;
    let reasoning = 'General request routed to Executor Agent.';
    
    if (cleanText.includes('plan') || cleanText.includes('blueprint') || cleanText.includes('roadmap')) {
      detectedIntent = 'planning';
      reasoning = 'Request asks for structuring / planning, routed to Planner Agent.';
    } else if (cleanText.includes('research') || cleanText.includes('scan') || cleanText.includes('competitive')) {
      detectedIntent = 'research';
      workflowSelection = 'research-workflow';
      reasoning = 'Request asks for research intelligence gathering, matched to Research Workflow.';
    } else if (cleanText.includes('write') || cleanText.includes('copy') || cleanText.includes('draft')) {
      detectedIntent = 'content_generation';
      workflowSelection = 'content-workflow';
      reasoning = 'Request asks for writing copy drafts, matched to Content Workflow.';
    } else if (cleanText.includes('email') || cleanText.includes('sequence') || cleanText.includes('outreach')) {
      detectedIntent = 'outreach';
      workflowSelection = 'outreach-workflow';
      reasoning = 'Request asks for email sequences setup, matched to Outreach Workflow.';
    } else if (cleanText.includes('publish') || cleanText.includes('release') || cleanText.includes('distribute')) {
      detectedIntent = 'publishing';
      workflowSelection = 'publishing-workflow';
      reasoning = 'Request asks for production release operations, matched to Publishing Workflow.';
    } else if (cleanText.includes('build') || cleanText.includes('compile') || cleanText.includes('test')) {
      detectedIntent = 'product_build';
      workflowSelection = 'product-build-workflow';
      reasoning = 'Request involves software product engineering, matched to Product Build Workflow.';
    } else if (cleanText.includes('revenue') || cleanText.includes('pricing') || cleanText.includes('monetize')) {
      detectedIntent = 'revenue';
      workflowSelection = 'revenue-workflow';
      reasoning = 'Request addresses pricing structures or billing, matched to Revenue Workflow.';
    } else if (cleanText.includes('brief') || cleanText.includes('obsidian') || cleanText.includes('sync note')) {
      detectedIntent = 'daily_briefing';
      workflowSelection = 'daily-brief-workflow';
      reasoning = 'Request targets knowledge sync or status briefing, matched to Daily Brief Workflow.';
    } else if (cleanText.includes('video') || cleanText.includes('render') || cleanText.includes('audio')) {
      detectedIntent = 'media_generation';
      workflowSelection = 'media-generation-workflow';
      reasoning = 'Request requests visual scene synthesis, matched to Media Generation Workflow.';
    } else if (cleanText.includes('github') || cleanText.includes('pr audit')) {
      detectedIntent = 'github_monitoring';
      workflowSelection = 'github-monitoring-workflow';
      reasoning = 'Request handles branch or repository scanning, matched to GitHub Monitoring Workflow.';
    }

    // 2. Skill Match
    const skillMatches = this.registryManager.matchIntent(requestText);
    const requiredSkills = skillMatches.selected;

    // 3. Agent Assignment
    let agentAssignment = 'executor-agent';
    
    switch (detectedIntent) {
      case 'planning':
        agentAssignment = 'planner-agent';
        break;
      case 'research':
        agentAssignment = 'research-agent';
        break;
      case 'content_generation':
        agentAssignment = 'content-agent';
        break;
      case 'outreach':
        agentAssignment = 'operations-agent';
        break;
      case 'publishing':
        agentAssignment = 'operations-agent';
        break;
      case 'product_build':
        agentAssignment = 'executor-agent';
        break;
      case 'revenue':
        agentAssignment = 'revenue-agent';
        break;
      case 'daily_briefing':
        agentAssignment = 'memory-agent';
        break;
      case 'media_generation':
        agentAssignment = 'media-workflow-agent';
        break;
      case 'github_monitoring':
        agentAssignment = 'automation-agent';
        break;
    }

    // 4. Human Approval Determination (high risk operations trigger approval requirement)
    let humanApprovalRequired = false;
    if (
      detectedIntent === 'publishing' || 
      detectedIntent === 'outreach' || 
      detectedIntent === 'revenue' ||
      cleanText.includes('deploy') || 
      cleanText.includes('delete') || 
      cleanText.includes('merge')
    ) {
      humanApprovalRequired = true;
    }

    // 5. Background Queue Determination (long processes or schedules)
    let backgroundQueueRequired = false;
    if (
      cleanText.includes('schedule') || 
      cleanText.includes('recurring') || 
      cleanText.includes('background') || 
      cleanText.includes('overnight') || 
      detectedIntent === 'github_monitoring'
    ) {
      backgroundQueueRequired = true;
    }

    return {
      requestId,
      requestText,
      detectedIntent,
      agentAssignment,
      requiredSkills,
      workflowSelection,
      humanApprovalRequired,
      backgroundQueueRequired,
      reasoning
    };
  }

  // Get agent properties
  getAgent(name: string): AgentDefinition | null {
    return CORE_AGENTS[name.toLowerCase()] || null;
  }
}
