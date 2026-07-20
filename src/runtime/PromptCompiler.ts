import { ParsedIntent } from './IntentParser.js';

export interface KernelCommandPayload {
  commandName: string;
  payload: Record<string, any>;
}

export class PromptCompiler {
  public compile(intent: ParsedIntent, context: Record<string, any>): KernelCommandPayload {
    switch (intent.intentType) {
      case 'research_ai':
        return {
          commandName: 'Run Intelligence Scan',
          payload: { query: 'AI agents updates', workspace: context.currentWorkspace }
        };
      case 'generate_report':
        return {
          commandName: 'Generate Report',
          payload: { type: intent.payload.type || 'Weekly', format: 'markdown' }
        };
      case 'run_revenue':
        return {
          commandName: 'Run Workflow',
          payload: { triggerKey: 'npm run workflow -- "audit-campaign-roi"' }
        };
      case 'open_memory':
        return {
          commandName: 'Update Memory',
          payload: { action: 'fetch_summaries' }
        };
      case 'launch_agent':
        return {
          commandName: 'Launch Agent',
          payload: { agentId: intent.payload.agentId }
        };
      case 'create_skill':
        return {
          commandName: 'Create Skill',
          payload: { version: '1.0.0' }
        };
      case 'create_project':
        return {
          commandName: 'Open Workspace',
          payload: { projectPath: `${context.currentWorkspace}/project` }
        };
      default:
        return {
          commandName: 'Generic Command',
          payload: { query: intent.rawQuery }
        };
    }
  }
}

export const globalPromptCompiler = new PromptCompiler();
