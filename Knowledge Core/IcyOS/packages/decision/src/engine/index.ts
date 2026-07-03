import { DecisionRequest, DecisionResult } from '../routing';

export class DecisionEngine {
  evaluate(request: DecisionRequest): DecisionResult {
    const { category, input } = request;

    // Evaluate deterministic rules
    if (category === 'knowledge_lookup') {
      const isSimpleIndex = input.toLowerCase().startsWith('get rule:') || input.toLowerCase().startsWith('list rules');
      if (isSimpleIndex) {
        return {
          decision_source: 'deterministic',
          confidence_score: 0.98,
          explanation: 'Deterministic lookup triggered by simple structured command query pattern.',
          llm_required: false,
        };
      }
    }

    if (category === 'timeline_generation') {
      const isStandard = input === 'generate_standard_timeline';
      if (isStandard) {
        return {
          decision_source: 'deterministic',
          confidence_score: 0.95,
          explanation: 'Handled locally using standard schedule template configuration patterns.',
          llm_required: false,
        };
      }
    }

    // Default escalation for messy inputs or complex semantic routing
    let modelHint: 'fast' | 'reasoning' | 'heavy' = 'fast';
    if (category === 'executive_briefing') {
      modelHint = 'reasoning';
    } else if (category === 'reflection_summarization') {
      modelHint = 'heavy';
    }

    return {
      decision_source: 'llm_orchestrated',
      confidence_score: 0.85,
      explanation: `Escalated to LLM model because category "${category}" requires semantic analysis or advanced summarization templates.`,
      llm_required: true,
      orchestration_request: {
        model_hint: modelHint,
        prompt_template_id: `TEMPLATE-${category.toUpperCase()}`,
        payload: { input },
      },
    };
  }
}
