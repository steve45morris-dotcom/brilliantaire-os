import { describe, it, expect } from 'vitest';
import { DecisionEngine } from './engine';

describe('Decision Engine & AI Orchestrator Rules', () => {
  const engine = new DecisionEngine();

  it('should handle deterministic routing locally for simple knowledge lookup', () => {
    const result = engine.evaluate({
      category: 'knowledge_lookup',
      input: 'List rules'
    });

    expect(result.decision_source).toBe('deterministic');
    expect(result.llm_required).toBe(false);
    expect(result.confidence_score).toBe(0.98);
  });

  it('should escalate to LLM for messy inbox parsing queries', () => {
    const result = engine.evaluate({
      category: 'inbox_parsing',
      input: 'remind me to fix the timezone parsing offset by tomorrow noon'
    });

    expect(result.decision_source).toBe('llm_orchestrated');
    expect(result.llm_required).toBe(true);
    expect(result.orchestration_request).toBeDefined();
    expect(result.orchestration_request?.model_hint).toBe('fast');
  });

  it('should route reflection summarization to heavy LLM model', () => {
    const result = engine.evaluate({
      category: 'reflection_summarization',
      input: 'Session completed successfully.'
    });

    expect(result.decision_source).toBe('llm_orchestrated');
    expect(result.llm_required).toBe(true);
    expect(result.orchestration_request?.model_hint).toBe('heavy');
  });
});
