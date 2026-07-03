export interface PromptTemplate {
  template_id: string;
  version: string;
  capability_required: 'fast' | 'reasoning' | 'heavy' | 'local';
  expected_output_schema: any; // e.g. zod schema or description
  validation_rules: string[];
  system_prompt: string;
  user_template: string;
}

export class PromptLibrary {
  private templates = new Map<string, PromptTemplate>();

  constructor() {
    this.registerTemplate({
      template_id: 'TEMPLATE-INBOX_PARSING',
      version: '1.0.0',
      capability_required: 'fast',
      expected_output_schema: 'json',
      validation_rules: ['must contain tasks', 'must parse times'],
      system_prompt: 'You are IcyOS Inbox Parser. Extract tasks from messy thoughts.',
      user_template: 'Parse the following messy input: {{input}}'
    });

    this.registerTemplate({
      template_id: 'TEMPLATE-TIMELINE_GENERATION',
      version: '1.0.0',
      capability_required: 'heavy',
      expected_output_schema: 'json',
      validation_rules: ['must fit 24 hours', 'no overlaps'],
      system_prompt: 'You are IcyOS Timeline Planner. Generate optimized timeline blocks.',
      user_template: 'Generate daily timeline blocks for user details: {{input}}'
    });

    this.registerTemplate({
      template_id: 'TEMPLATE-REFLECTION_SUMMARIZATION',
      version: '1.0.0',
      capability_required: 'heavy',
      expected_output_schema: 'json',
      validation_rules: ['must summarize wins', 'must summarize blockers'],
      system_prompt: 'You are IcyOS Reflection Engine. Summarize daily wins and blockers.',
      user_template: 'Summarize the user daily review logs: {{input}}'
    });

    this.registerTemplate({
      template_id: 'TEMPLATE-EXECUTIVE_BRIEFING',
      version: '1.0.0',
      capability_required: 'reasoning',
      expected_output_schema: 'text',
      validation_rules: ['under 100 words', 'motivational tone'],
      system_prompt: 'You are IcyOS Executive Coach. Generate daily briefing overview.',
      user_template: 'Create a briefing for the user: {{input}}'
    });

    this.registerTemplate({
      template_id: 'TEMPLATE-KNOWLEDGE_QUERY',
      version: '1.0.0',
      capability_required: 'local',
      expected_output_schema: 'text',
      validation_rules: ['fact-based', 'structured'],
      system_prompt: 'You are IcyOS Knowledge Librarian. Retrieve rules matching the query.',
      user_template: 'Query local rules repository for: {{input}}'
    });
  }

  registerTemplate(template: PromptTemplate) {
    this.templates.set(template.template_id, template);
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  render(template_id: string, variables: Record<string, string>): string {
    const template = this.getTemplate(template_id);
    if (!template) {
      throw new Error(`Prompt template "${template_id}" not found`);
    }
    let rendered = template.user_template;
    for (const [key, val] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), val);
    }
    return rendered;
  }
}
