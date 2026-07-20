import { ModelRole, ModelRecord, ModelSelectionHistoryRecord } from './ModelTypes.js';
import { globalModelRegistry } from './ModelRegistry.js';
import { globalModelConfigManager } from './ModelConfiguration.js';
import { getModelCapabilities } from './ModelCapabilities.js';
import { globalEventBus } from '../kernel/events/EventBus.js';

export interface ModelSelectionResult {
  model: ModelRecord;
  role: ModelRole;
  reason: string;
  confidence: number;
  expectedBenefit: string;
  tradeoffs: string;
  suggestedAlternative?: string;
  suggestedAlternativeReason?: string;
}

export interface DeprecatedCompatibilityOverride {
  enabled: boolean;
  expirationDate: string; // ISO string
  approvedBy?: string;
  auditEventLogged?: boolean;
}

export class DeprecatedOverrideManager {
  private overrides: Map<string, DeprecatedCompatibilityOverride> = new Map();

  public enableOverride(modelId: string, expirationDate: string): void {
    console.warn(`[WARNING] Temporary compatibility override enabled for deprecated model "${modelId}". Expiration: ${expirationDate}`);
    this.overrides.set(modelId, {
      enabled: true,
      expirationDate,
      approvedBy: 'Commander',
      auditEventLogged: true
    });
    // Record audit event
    globalEventBus.publish('DeprecatedModelOverrideEnabled', { modelId, expirationDate });
  }

  public isOverrideActive(modelId: string): boolean {
    const override = this.overrides.get(modelId);
    if (!override || !override.enabled) return false;
    // Check expiration date
    if (new Date(override.expirationDate).getTime() < Date.now()) {
      console.warn(`[WARNING] Compatibility override for "${modelId}" has expired.`);
      this.overrides.delete(modelId);
      return false;
    }
    return true;
  }
}

export const globalDeprecatedOverrideManager = new DeprecatedOverrideManager();

export class ModelSelector {
  private history: ModelSelectionHistoryRecord[] = [];

  public getHistory(): ModelSelectionHistoryRecord[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }

  public getModelWithLifecycle(role: ModelRole): { model: ModelRecord | null; reason: string } {
    const allModels = globalModelRegistry.getAllModels();

    // 1. User-configured supported model
    const userPreferredId = globalModelConfigManager.getPreferredModel(role);
    let userModel = globalModelRegistry.getModel(userPreferredId);
    if (userModel && userModel.supported && (userModel.status === 'Available' || userModel.status === 'Configured')) {
      if (!userModel.deprecated) {
        return { model: userModel, reason: `User preferred model "${userPreferredId}" selected.` };
      } else if (globalDeprecatedOverrideManager.isOverrideActive(userModel.id)) {
        console.warn(`[WARNING] Using deprecated model "${userModel.id}" due to active compatibility override.`);
        return { model: userModel, reason: `User preferred model "${userPreferredId}" selected via compatibility override.` };
      }
    }

    // 2. Environment-configured supported model
    let envPreferredId = '';
    if (role === 'Builder') {
      envPreferredId = process.env.GEMINI_DEFAULT_MODEL || process.env.OPENAI_DEFAULT_MODEL || '';
    }
    if (envPreferredId) {
      const envModel = globalModelRegistry.getModel(envPreferredId);
      if (envModel && envModel.supported && (envModel.status === 'Available' || envModel.status === 'Configured')) {
        if (!envModel.deprecated) {
          return { model: envModel, reason: `Environment configured model "${envPreferredId}" selected.` };
        } else if (globalDeprecatedOverrideManager.isOverrideActive(envModel.id)) {
          console.warn(`[WARNING] Using deprecated model "${envModel.id}" due to active compatibility override.`);
          return { model: envModel, reason: `Environment configured model "${envPreferredId}" selected via compatibility override.` };
        }
      }
    }

    // 3. Current provider-discovered recommended model
    const recommended = allModels.find(m => 
      m.recommendedTasks.includes(role) && 
      m.supported && 
      (!m.deprecated || globalDeprecatedOverrideManager.isOverrideActive(m.id)) &&
      (m.status === 'Available' || m.status === 'Configured')
    );
    if (recommended) {
      return { model: recommended, reason: `Provider-discovered recommended model "${recommended.id}" selected for role "${role}".` };
    }

    // 4. Safe supported fallback
    const safeFallback = allModels.find(m => 
      m.supported && 
      (!m.deprecated || globalDeprecatedOverrideManager.isOverrideActive(m.id)) &&
      (m.status === 'Available' || m.status === 'Configured')
    );
    if (safeFallback) {
      return { model: safeFallback, reason: `Safe supported fallback model "${safeFallback.id}" selected.` };
    }

    // 5. Disconnected status when no supported model exists
    return { model: null, reason: 'Disconnected: No supported model exists.' };
  }

  public selectModel(role: ModelRole, taskType = 'general'): ModelSelectionResult {
    const { model, reason } = this.getModelWithLifecycle(role);
    const preferredId = globalModelConfigManager.getPreferredModel(role);
    const override = preferredId !== model?.id;

    if (!model) {
      const disconnectedModel: ModelRecord = {
        id: 'disconnected-model',
        provider: 'Local',
        displayName: 'No Model Available (Disconnected)',
        version: '0.0.0',
        status: 'Disconnected',
        contextWindow: 0,
        supportsVision: false,
        supportsVoice: false,
        supportsReasoning: false,
        supportsCoding: false,
        supportsResearch: false,
        supportsAgents: false,
        supportsStreaming: false,
        supportsFunctionCalling: false,
        estimatedSpeed: 'fast',
        estimatedCost: 'low',
        recommendedTasks: [],
        supported: false,
        deprecated: false,
        capabilities: [],
        source: 'hardcoded'
      };
      
      return {
        model: disconnectedModel,
        role,
        reason: 'Disconnected: No supported models available.',
        confidence: 0,
        expectedBenefit: 'None',
        tradeoffs: 'System is completely disconnected.',
        suggestedAlternative: undefined
      };
    }

    const explainability = this.getExplainability(model, role, reason);
    if (override) {
      explainability.reason = `Preferred model "${preferredId}" is unavailable. Re-routed to available fallback. Reason: ${explainability.reason}`;
    }
    
    // Track history
    this.history.push({
      timestamp: new Date().toISOString(),
      modelId: model.id,
      role,
      taskType,
      reason: explainability.reason,
      override
    });

    if (this.history.length > 100) {
      this.history.shift();
    }

    return {
      model,
      role,
      ...explainability
    };
  }

  private getExplainability(
    model: ModelRecord,
    role: ModelRole,
    context: string
  ): {
    reason: string;
    confidence: number;
    expectedBenefit: string;
    tradeoffs: string;
    suggestedAlternative?: string;
    suggestedAlternativeReason?: string;
  } {
    const caps = getModelCapabilities(model);

    if (role === 'Builder') {
      if (model.provider === 'Google Gemini') {
        return {
          reason: `${context} Optimized for large TypeScript implementation.`,
          confidence: 97,
          expectedBenefit: 'Extremely fast code compilation support and massive context digestion.',
          tradeoffs: 'Slightly weaker architecture critique than Claude.',
          suggestedAlternative: 'claude-3-5-sonnet',
          suggestedAlternativeReason: 'Recommended if architecture complexity increases.'
        };
      } else {
        return {
          reason: `${context} High precision coding and tool use reasoning.`,
          confidence: 95,
          expectedBenefit: 'Excellent code generation compliance and few syntax errors.',
          tradeoffs: 'Slightly slower token generation speed than Gemini.',
          suggestedAlternative: 'gemini-1.5-pro',
          suggestedAlternativeReason: 'Recommended for large multi-file codebases.'
        };
      }
    }

    if (role === 'Architecture Reviewer') {
      if (model.provider === 'Anthropic') {
        return {
          reason: `${context} Excellent long-form reasoning and design review.`,
          confidence: 99,
          expectedBenefit: 'Catches edge-case system boundary breaches and circular imports.',
          tradeoffs: 'Longer response time.',
          suggestedAlternative: 'gemini-1.5-pro',
          suggestedAlternativeReason: 'Recommended for high-throughput batch analyses.'
        };
      } else {
        return {
          reason: `${context} Fastest semantic design check.`,
          confidence: 88,
          expectedBenefit: 'Instantaneous feedback on structure mapping.',
          tradeoffs: 'Weaker logical auditing depth.',
          suggestedAlternative: 'claude-3-5-sonnet',
          suggestedAlternativeReason: 'Recommended for complex logical safety validations.'
        };
      }
    }

    if (role === 'Research') {
      return {
        reason: `${context} Extended context window allows digesting multiple workspace sources.`,
        confidence: 94,
        expectedBenefit: 'Processes 2 million tokens of log and document history directly.',
        tradeoffs: 'Higher cost per token.',
        suggestedAlternative: 'gemini-1.5-flash',
        suggestedAlternativeReason: 'Recommended if latency becomes critical.'
      };
    }

    if (role === 'Debugger') {
      return {
        reason: `${context} Fast response time with coding analysis focus.`,
        confidence: 92,
        expectedBenefit: 'Quickly isolates stack trace paths.',
        tradeoffs: 'Limited to short file contexts.',
        suggestedAlternative: 'claude-3-5-sonnet',
        suggestedAlternativeReason: 'Recommended for multi-layered module debugging.'
      };
    }

    return {
      reason: `${context} Model selected with capabilities: ${caps.join(', ')}.`,
      confidence: 85,
      expectedBenefit: 'Standard capabilities match active operational task profile.',
      tradeoffs: 'Generic configuration, not highly optimized for specific task edge cases.',
      suggestedAlternative: model.id === 'gemini-1.5-pro' ? 'claude-3-5-sonnet' : 'gemini-1.5-pro',
      suggestedAlternativeReason: 'Provides complementary cognitive strengths.'
    };
  }
}

export const globalModelSelector = new ModelSelector();
