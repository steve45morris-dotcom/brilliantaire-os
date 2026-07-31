import { VerificationResult, VerificationCriterionResult } from './types.js';

export class GoalVerificationEngine {
  constructor() {}

  // Verify an execution output against goals and criteria
  verify(
    goal: string,
    successCriteria: string[],
    outputContent: string,
    metadata: {
      expectedFormat?: string;
      dependenciesExpected?: string[];
      hasFactualReferences?: boolean;
    } = {}
  ): VerificationResult {
    const checklist: VerificationCriterionResult[] = [];
    const errors: string[] = [];
    const lowerContent = outputContent.toLowerCase();

    // 1. Completion & Hallucination Checks
    // Search for signs of empty placeholders or hallucinated completeness like "Insert here", "TODO", "[Placeholder]", etc.
    const placeholders = ['todo', '[insert', '<insert', 'placeholder', 'lorem ipsum', 'insert-here'];
    const hasPlaceholders = placeholders.some((p) => lowerContent.includes(p));
    
    // Check if the output claims completion but has zero substance
    const claimsCompletionWithoutSubstance = 
      (lowerContent.includes('complete') || lowerContent.includes('successfully finished')) && 
      outputContent.trim().length < 50;

    const hallucinationDetected = hasPlaceholders || claimsCompletionWithoutSubstance;
    if (hasPlaceholders) {
      errors.push('Hallucination/Placeholder Warning: Found pending placeholder strings in output.');
    }
    if (claimsCompletionWithoutSubstance) {
      errors.push('Hallucination/Substance Warning: Output claims completion but contains insufficient text detail.');
    }

    // 2. Format Checks
    let formattingValid = true;
    if (metadata.expectedFormat === 'json') {
      try {
        JSON.parse(outputContent);
      } catch (e) {
        formattingValid = false;
        errors.push(`Format Error: Expected JSON format but parse failed: ${(e as Error).message}`);
      }
    } else if (metadata.expectedFormat === 'markdown') {
      // Check if starts with a header
      if (!outputContent.trim().startsWith('#')) {
        formattingValid = false;
        errors.push("Format Warning: Expected markdown format starting with a heading (e.g. '# Title').");
      }
    }

    // 3. Instruction Compliance
    let instructionComplianceValid = true;
    // Check if the content addresses the main goal text keywords
    const goalWords = goal.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const matchedGoalKeywordsCount = goalWords.filter((w) => lowerContent.includes(w)).length;
    
    if (goalWords.length > 0 && (matchedGoalKeywordsCount / goalWords.length) < 0.3) {
      instructionComplianceValid = false;
      errors.push('Compliance Warning: Output content has very low keyword alignment with the original goal description.');
    }

    // 4. Missing Dependencies
    if (metadata.dependenciesExpected) {
      metadata.dependenciesExpected.forEach((dep) => {
        if (!lowerContent.includes(dep.toLowerCase())) {
          errors.push(`Dependency Missing: Expected reference to '${dep}' was not found in the output text.`);
        }
      });
    }

    // 5. Success Criteria Checklist Verification
    successCriteria.forEach((criterion) => {
      const cleanCriterion = criterion.toLowerCase();
      // Simple rule-based match
      // In real runs, this could call an LLM evaluation interface. Here we run key-phrase heuristic validation.
      let passed = false;
      let reason = 'Heuristic: Criterion keyword matching check failed.';

      // Examples: "Contains at least 3 source citations", "Contains call-to-actions"
      if (cleanCriterion.includes('citation') || cleanCriterion.includes('source')) {
        const citationsCount = (outputContent.match(/\[\d+\]|http[s]?:\/\//g) || []).length;
        if (citationsCount >= 2) {
          passed = true;
          reason = `Heuristic: Found ${citationsCount} source references/links in the content.`;
        } else {
          reason = `Heuristic Failure: Expected references/links but only found ${citationsCount}.`;
        }
      } else if (cleanCriterion.includes('format') || cleanCriterion.includes('markdown') || cleanCriterion.includes('json')) {
        passed = formattingValid;
        reason = formattingValid ? 'Heuristic: Format parsed successfully.' : 'Heuristic Failure: Format checks failed.';
      } else if (cleanCriterion.includes('accuracy') || cleanCriterion.includes('factual')) {
        // High word alignment indicates accuracy
        passed = instructionComplianceValid;
        reason = instructionComplianceValid ? 'Heuristic: High goal alignment.' : 'Heuristic Failure: Weak compliance.';
      } else {
        // Fallback keyword correlation check
        const critWords = criterion.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
        const matchCount = critWords.filter((w) => lowerContent.includes(w)).length;
        if (critWords.length === 0 || (matchCount / critWords.length) >= 0.2) {
          passed = true;
          reason = 'Heuristic: Found keyword alignment matching the criterion.';
        } else {
          reason = 'Heuristic Failure: Low semantic overlap with output content.';
        }
      }

      checklist.push({ criterion, passed, reason });
    });

    // 6. Scoring Calculations
    const passedCount = checklist.filter((item) => item.passed).length;
    const passedRatio = successCriteria.length > 0 ? passedCount / successCriteria.length : 1.0;
    
    const factualAccuracyScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          passedRatio * 100 - (hallucinationDetected ? 40 : 0) - (errors.length * 10)
        )
      )
    );

    const businessImpactScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          passedRatio * 100 - (errors.length * 5)
        )
      )
    );

    const passedOverall = passedRatio >= 0.7 && !hallucinationDetected && formattingValid;

    return {
      passed: passedOverall,
      checklist,
      errors,
      factualAccuracyScore,
      formattingValid,
      instructionComplianceValid,
      hallucinationDetected,
      businessImpactScore
    };
  }
}
