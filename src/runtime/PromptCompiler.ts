import { ParsedIntent } from './IntentParser.js';
import type { LoadedSkillContent, SkillDescriptor } from '../agent-upgrade/ProgressiveSkillLoader.js';

export interface KernelCommandPayload {
  commandName: string;
  payload: Record<string, any>;
}

export class PromptCompiler {
  public assembleContext(
    baseContext: string,
    missionContext: string,
    matchedMetadata: SkillDescriptor[],
    instructions: LoadedSkillContent[],
    resources: LoadedSkillContent[],
  ): string {
    const activatedIds = new Set(instructions.map((instruction) => instruction.skillId));
    const selectedMetadata = matchedMetadata
      .filter((descriptor) => activatedIds.has(descriptor.id))
      .map((descriptor) => ({
        id: descriptor.id,
        name: descriptor.name,
        summary: descriptor.summary,
        capabilities: descriptor.capabilities,
        risk: descriptor.risk || 'low',
        permissions: descriptor.permissions || [],
      }));
    return [
      baseContext,
      missionContext,
      selectedMetadata.length ? `SKILL METADATA\n${JSON.stringify(selectedMetadata)}` : '',
      ...instructions.map((instruction) => `SKILL INSTRUCTIONS [${instruction.skillId}]\n${instruction.content}`),
      ...resources.map((resource) => `SKILL RESOURCE [${resource.skillId}:${resource.path}]\n${resource.content}`),
    ].filter(Boolean).join('\n\n');
  }

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
