export interface ParsedIntent {
  intentType: 'research_ai' | 'generate_report' | 'run_revenue' | 'open_memory' | 'launch_agent' | 'create_skill' | 'create_project' | 'generate_freestyle' | 'summarize_intel' | 'unknown';
  payload: Record<string, any>;
  rawQuery: string;
}

export class IntentParser {
  public parse(query: string): ParsedIntent {
    const lower = query.toLowerCase();
    
    if (lower.includes('research') && (lower.includes('ai') || lower.includes('agent'))) {
      return { intentType: 'research_ai', payload: {}, rawQuery: query };
    }
    if (lower.includes('generate') && lower.includes('report')) {
      const type = lower.includes('weekly') ? 'Weekly' : lower.includes('daily') ? 'Daily' : 'Monthly';
      return { intentType: 'generate_report', payload: { type }, rawQuery: query };
    }
    if (lower.includes('revenue') && (lower.includes('run') || lower.includes('workflow'))) {
      return { intentType: 'run_revenue', payload: {}, rawQuery: query };
    }
    if (lower.includes('memory') || lower.includes('vault')) {
      return { intentType: 'open_memory', payload: {}, rawQuery: query };
    }
    if (lower.includes('launch') && lower.includes('agent')) {
      const agentId = lower.includes('planner') ? 'planner' : lower.includes('research') ? 'research' : 'content';
      return { intentType: 'launch_agent', payload: { agentId }, rawQuery: query };
    }
    if (lower.includes('create') && lower.includes('skill')) {
      return { intentType: 'create_skill', payload: {}, rawQuery: query };
    }
    if (lower.includes('create') && lower.includes('project')) {
      return { intentType: 'create_project', payload: {}, rawQuery: query };
    }
    if (lower.includes('freestyle') || lower.includes('lyric')) {
      return { intentType: 'generate_freestyle', payload: {}, rawQuery: query };
    }
    if (lower.includes('summarize') && lower.includes('intel')) {
      return { intentType: 'summarize_intel', payload: {}, rawQuery: query };
    }

    return { intentType: 'unknown', payload: {}, rawQuery: query };
  }
}

export const globalIntentParser = new IntentParser();
