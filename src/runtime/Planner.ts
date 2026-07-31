import { ParsedIntent } from './IntentParser.js';

export interface PlanStep {
  index: number;
  description: string;
  workflow?: string;
  skill?: string;
  agent?: string;
}

export interface ExecutionPlan {
  steps: PlanStep[];
  estimatedDurationSeconds: number;
  approvalRequired: boolean;
  retryPolicy: { retries: number; backoffMs: number };
  intentType: ParsedIntent['intentType'];
}

export class Planner {
  public generatePlan(intent: ParsedIntent): ExecutionPlan {
    const steps: PlanStep[] = [];
    let duration = 5;
    let approval = false;

    switch (intent.intentType) {
      case 'research_ai':
        steps.push(
          { index: 1, description: 'Spawn SID Research Agent container', agent: 'research' },
          { index: 2, description: 'Trigger Exa API neural trend crawler', skill: 'exa-search' },
          { index: 3, description: 'Compile research updates report', workflow: 'wf-research' }
        );
        duration = 10;
        approval = true; // External API search
        break;

      case 'generate_report':
        steps.push(
          { index: 1, description: 'Fetch system metrics and audit history', skill: 'lint-validate' },
          { index: 2, description: 'Render outcome report documents', workflow: 'wf-publishing' }
        );
        duration = 5;
        approval = false;
        break;

      case 'run_revenue':
        steps.push(
          { index: 1, description: 'Fetch Stripe webhook ledgers', agent: 'revenue' },
          { index: 2, description: 'Calculate conversions ROI metrics', workflow: 'wf-revenue' }
        );
        duration = 8;
        approval = true; // Revenue execution
        break;

      case 'open_memory':
        steps.push(
          { index: 1, description: 'Index Obsidian memory vault nodes', agent: 'memory' }
        );
        duration = 3;
        approval = false;
        break;

      case 'launch_agent':
        steps.push(
          { index: 1, description: `Launch container container for agent "${intent.payload.agentId}"`, agent: intent.payload.agentId }
        );
        duration = 4;
        approval = false;
        break;

      case 'create_skill':
        steps.push(
          { index: 1, description: 'Scaffold new skill configuration schema', skill: 'agent-tool-builder' }
        );
        duration = 3;
        approval = true; // Plugin/Skill install
        break;

      case 'create_project':
        steps.push(
          { index: 1, description: 'Initialize project directory mappings', agent: 'operations' }
        );
        duration = 5;
        approval = false;
        break;

      case 'generate_freestyle':
        steps.push(
          { index: 1, description: 'Pull lyrics draft queue from Obsidian' },
          { index: 2, description: 'Compile caption social formats pack', agent: 'content' }
        );
        duration = 6;
        approval = true; // Creative content publishing
        break;

      case 'summarize_intel':
        steps.push(
          { index: 1, description: 'Ingest daily AI trend reports', agent: 'intelligence' }
        );
        duration = 4;
        approval = false;
        break;

      default:
        steps.push(
          { index: 1, description: 'Execute generic prompt command' }
        );
        duration = 5;
        approval = false;
    }

    return {
      steps,
      estimatedDurationSeconds: duration,
      approvalRequired: approval,
      retryPolicy: { retries: 3, backoffMs: 2000 },
      intentType: intent.intentType
    };
  }
}

export const globalPlanner = new Planner();
