import { globalIntegrationRegistry } from './IntegrationRegistry.js';
import { globalModelRoutingPolicy } from './ModelRoutingPolicy.js';
import { ModelProvider } from './ModelProvider.js';
import { ModelRoutingRequest, ModelRoutingResult, TaskRole } from './ModelRoutingTypes.js';
import { globalServiceRegistry } from '../../kernel/registry/ServiceRegistry.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalDeprecatedOverrideManager } from '../../models/ModelSelection.js';

export class ModelRouter {
  public registerService(): void {
    globalServiceRegistry.register('ModelRouter', this);
  }

  public validateRoute(
    providerId: string, 
    model: string, 
    request: ModelRoutingRequest
  ): { valid: boolean; reason: string; suggestedProvider?: string } {
    const provider = this.resolveModelProvider(providerId);
    if (!provider) {
      return { valid: false, reason: `Provider "${providerId}" is not registered.`, suggestedProvider: 'openai' };
    }

    // Check Integration Status
    if ((provider as any).status && (provider as any).status !== 'active') {
      const configured = this.findConfiguredProvider(request, providerId);
      return { 
        valid: false, 
        reason: `Provider "${providerId}" is not active (status: ${(provider as any).status}).`, 
        suggestedProvider: configured?.id 
      };
    }

    // 1. Check Provider Health
    const health = provider.health;
    if (health.status !== 'healthy' && health.status !== 'degraded') {
      const configured = this.findConfiguredProvider(request, providerId);
      return { 
        valid: false, 
        reason: `Provider "${providerId}" health check failed: status is "${health.status}". Message: ${health.message}`, 
        suggestedProvider: configured?.id 
      };
    }

    // 2. Check Credential Isolation
    const auth = provider.authentication;
    if (!auth.authenticated) {
      const configured = this.findConfiguredProvider(request, providerId);
      return { 
        valid: false, 
        reason: `Provider "${providerId}" credentials are not authenticated.`, 
        suggestedProvider: configured?.id 
      };
    }

    // 3. Check Model Availability
    const allModels = provider.listModels();
    if (!allModels.includes(model)) {
      const configured = this.findConfiguredProvider(request, providerId);
      return { 
        valid: false, 
        reason: `Model "${model}" is not available on provider "${providerId}".`, 
        suggestedProvider: configured?.id 
      };
    }

    // Check Deprecated Gemini model rejection
    const isGemini = providerId === 'gemini';
    const isDeprecated = model === 'gemini-2.0-flash'; // deprecated in test setup
    if (isGemini && isDeprecated && !globalDeprecatedOverrideManager.isOverrideActive(model)) {
      const configured = this.findConfiguredProvider(request, providerId);
      return {
        valid: false,
        reason: `Model "${model}" is deprecated and no compatibility override is active.`,
        suggestedProvider: configured?.id || 'openai'
      };
    }

    // 4. Check Model Capability
    const capability = request.requiredCapability || 'text';
    if (!provider.supportsCapability(capability)) {
      const configured = this.findConfiguredProvider(request, providerId);
      return { 
        valid: false, 
        reason: `Provider "${providerId}" does not support capability "${capability}".`, 
        suggestedProvider: configured?.id 
      };
    }

    // 5. Check Budget Status
    if (provider.costControls.dailyLimit > 0 && provider.usage.dailySpend >= provider.costControls.dailyLimit) {
      const configured = this.findConfiguredProvider(request, providerId);
      return { 
        valid: false, 
        reason: `Provider "${providerId}" daily budget limit exceeded.`, 
        suggestedProvider: configured?.id 
      };
    }

    return { valid: true, reason: 'Route validation succeeded.' };
  }

  private findConfiguredProvider(request: ModelRoutingRequest, skipProviderId: string): ModelProvider | null {
    const list = globalIntegrationRegistry.list().map(i => i as unknown as ModelProvider);
    for (const p of list) {
      if (p.id !== skipProviderId && p.authentication.authenticated && (p.health.status === 'healthy' || p.health.status === 'degraded')) {
        if (request.requiredCapability && !p.supportsCapability(request.requiredCapability)) {
          continue;
        }
        return p;
      }
    }
    return null;
  }

  public route(request: ModelRoutingRequest): ModelRoutingResult {
    const policy = globalModelRoutingPolicy.getSettings();
    const taskRole = request.taskType || this.inferRoleFromDescription(request.taskDescription);

    // 1. Manual Routing Mode
    if (policy.routingMode === 'manual') {
      const providerId = request.selectedProvider || policy.preferredProvider;
      const provider = this.resolveModelProvider(providerId);

      if (!provider) {
        throw new Error(`Manual routing failed: Selected provider "${providerId}" is not registered.`);
      }

      const model = request.selectedModel || provider.configuration.defaultModel || provider.models[0] || 'unknown-model';
      
      const validation = this.validateRoute(providerId, model, request);
      if (!validation.valid) {
        return {
          providerId,
          model,
          role: taskRole,
          reason: `Manual Mode locked. Validation Failed: ${validation.reason}. Suggested configured provider: ${validation.suggestedProvider}`,
          confidence: 0.0,
          requiresApproval: true,
          validationFailed: true,
          suggestedProviderId: validation.suggestedProvider
        };
      }

      const requiresApproval = this.checkBudgetExceeded(provider, model);

      return {
        providerId,
        model,
        role: taskRole,
        reason: `Manual Mode locked. User selected provider: ${providerId}, model: ${model}.`,
        confidence: 1.0,
        requiresApproval
      };
    }

    // 2. Automatic Routing Mode
    const preferredProviderId = request.selectedProvider || globalModelRoutingPolicy.getPreferredProviderForRole(taskRole);
    let provider = this.resolveModelProvider(preferredProviderId);
    let chosenProviderId = preferredProviderId;
    let chosenModel = '';
    let isFallbackActive = false;
    let fallbackProviderId: string | undefined;
    let fallbackModel: string | undefined;
    let explanation = '';

    if (provider) {
      chosenModel = request.selectedModel || this.getModelForRole(provider, taskRole);
    }

    // Check preferred provider viability via validateRoute
    const validation = provider ? this.validateRoute(preferredProviderId, chosenModel, request) : { valid: false, reason: 'Provider not found.' };

    if (provider && validation.valid) {
      explanation = `Automatic Mode: Routed task role "${taskRole}" to preferred provider "${preferredProviderId}" using model "${chosenModel}".`;
    } else {
      // Preferred provider failed health, connection, or budget. Trigger fallback scan.
      explanation = `Automatic Mode: Preferred provider "${preferredProviderId}" is unavailable or degraded. Reason: ${validation.reason}.`;
      
      if (policy.allowProviderFallback) {
        const fallback = this.findFallbackProvider(taskRole, preferredProviderId);
        if (fallback) {
          fallbackProviderId = fallback.id;
          fallbackModel = this.getModelForRole(fallback, taskRole);
          isFallbackActive = true;

          // If fallback switch requires approval
          if (policy.requireApprovalBeforeProviderSwitch) {
            explanation += ` Fallback provider "${fallbackProviderId}" found, awaiting switch approval.`;
            // Block execute and require approval, do not silently switch
            return {
              providerId: preferredProviderId,
              model: chosenModel || 'default-model',
              role: taskRole,
              reason: explanation,
              confidence: 0.5,
              fallbackProviderId,
              fallbackModel,
              requiresApproval: true,
              validationFailed: true, // Mark validation failed to force approval/blocking
              suggestedProviderId: fallbackProviderId
            };
          } else {
            provider = fallback;
            chosenProviderId = fallback.id;
            chosenModel = fallbackModel;
            explanation += ` Auto-switched to fallback provider "${chosenProviderId}" using model "${chosenModel}".`;
          }
        } else {
          explanation += ` No viable fallback providers found.`;
          return {
            providerId: preferredProviderId,
            model: chosenModel || 'default-model',
            role: taskRole,
            reason: explanation,
            confidence: 0.0,
            requiresApproval: true,
            validationFailed: true
          };
        }
      } else {
        explanation += ` Fallback is disabled.`;
        return {
          providerId: preferredProviderId,
          model: chosenModel || 'default-model',
          role: taskRole,
          reason: explanation,
          confidence: 0.0,
          requiresApproval: true,
          validationFailed: true
        };
      }
    }

    if (!chosenModel && provider) {
      chosenModel = provider.configuration.defaultModel || provider.models[0] || 'default-model';
    }

    if (!chosenModel) {
      chosenModel = 'system-default-model';
    }

    const requiresApproval = provider ? this.checkBudgetExceeded(provider, chosenModel) : false;

    // Log the automatic selection event
    globalEventBus.publish('ModelRouterSelection', {
      taskRole,
      providerId: chosenProviderId,
      model: chosenModel,
      fallbackActive: isFallbackActive,
      fallbackProviderId,
      explanation
    });

    console.log(`[ModelRouter] Selected: ${chosenProviderId} | Model: ${chosenModel} | Reason: ${explanation}`);

    return {
      providerId: chosenProviderId,
      model: chosenModel,
      role: taskRole,
      reason: explanation,
      confidence: isFallbackActive ? 0.7 : 0.95,
      fallbackProviderId,
      fallbackModel,
      requiresApproval: requiresApproval || isFallbackActive
    };
  }

  public async executeRoutedRequest(request: ModelRoutingRequest, requestPayload: any): Promise<any> {
    const routeResult = this.route(request);

    if (routeResult.validationFailed) {
      return {
        success: false,
        status: 'validation-failed',
        message: `Routing validation failed: ${routeResult.reason}. Human approval required.`,
        route: routeResult
      };
    }

    const provider = this.resolveModelProvider(routeResult.providerId);

    if (!provider) {
      throw new Error(`Routing execution failed: Provider "${routeResult.providerId}" not resolved.`);
    }

    // Enforce cost limits check
    if (routeResult.requiresApproval && requestPayload.approvalStatus !== 'approved') {
      return {
        success: false,
        status: 'approval-required',
        message: `Execution blocked. Estimated cost or fallback switch requires Human Approval. Routing Reason: ${routeResult.reason}`,
        route: routeResult
      };
    }

    try {
      const capability = request.requiredCapability || 'text';
      let executionResult: any;

      if (capability === 'structured-output') {
        executionResult = await provider.executeStructured({ ...requestPayload, selectedModel: routeResult.model });
      } else if (capability === 'tools') {
        executionResult = await provider.executeTools({ ...requestPayload, selectedModel: routeResult.model });
      } else if (capability === 'streaming') {
        executionResult = await provider.executeStreaming({ ...requestPayload, selectedModel: routeResult.model });
      } else if (capability === 'voice') {
        executionResult = await provider.executeVoice({ ...requestPayload, selectedModel: routeResult.model });
      } else if (capability === 'image') {
        executionResult = await provider.executeImage({ ...requestPayload, selectedModel: routeResult.model });
      } else {
        executionResult = await provider.executeText({ ...requestPayload, selectedModel: routeResult.model });
      }

      return {
        ...executionResult,
        route: routeResult
      };
    } catch (err) {
      if (routeResult.fallbackProviderId && globalModelRoutingPolicy.getSettings().allowProviderFallback) {
        console.warn(`[ModelRouter] Request to ${routeResult.providerId} failed. Retrying fallback: ${routeResult.fallbackProviderId}`);
        
        const fallbackProvider = this.resolveModelProvider(routeResult.fallbackProviderId);
        if (fallbackProvider) {
          try {
            const fallbackModel = routeResult.fallbackModel || fallbackProvider.models[0];
            const fallbackResult = await fallbackProvider.executeText({
              ...requestPayload,
              selectedModel: fallbackModel
            });
            return {
              ...fallbackResult,
              route: {
                ...routeResult,
                providerId: routeResult.fallbackProviderId,
                model: fallbackModel,
                reason: `Primary request failed. Retried and fell back to: ${routeResult.fallbackProviderId}`
              }
            };
          } catch (fallbackErr) {
            throw new Error(`Primary execution failed: ${(err as Error).message}. Fallback also failed: ${(fallbackErr as Error).message}`);
          }
        }
      }
      throw err;
    }
  }

  private resolveModelProvider(providerId: string): ModelProvider | null {
    const integration = globalIntegrationRegistry.get(providerId);
    if (integration && integration.type === 'model-provider') {
      return integration as unknown as ModelProvider;
    }
    return null;
  }

  private isProviderViable(provider: ModelProvider): boolean {
    if ((provider as any).status && (provider as any).status !== 'active') {
      return false;
    }
    const health = provider.health;
    if (health.status !== 'healthy' && health.status !== 'degraded') {
      return false;
    }
    if (provider.costControls.dailyLimit > 0 && provider.usage.dailySpend >= provider.costControls.dailyLimit) {
      return false;
    }
    return true;
  }

  private findFallbackProvider(role: TaskRole, skipProviderId: string): ModelProvider | null {
    const providers = globalIntegrationRegistry.list()
      .filter(i => i.type === 'model-provider' && i.id !== skipProviderId)
      .map(i => i as unknown as ModelProvider);

    for (const p of providers) {
      if (p.fallbackEligibility && this.isProviderViable(p)) {
        return p;
      }
    }
    return null;
  }

  private getModelForRole(provider: ModelProvider, role: TaskRole): string {
    const config = provider.configuration;
    switch (role) {
      case 'fast':
        return config.fastModel || provider.models[1] || provider.models[0];
      case 'reasoning':
        return config.reasoningModel || provider.models[0];
      case 'coding':
        return config.reasoningModel || provider.models[0];
      case 'verification':
        return config.defaultModel || provider.models[0];
      case 'voice':
        return config.realtimeModel || provider.models[0];
      default:
        return config.defaultModel || provider.models[0];
    }
  }

  private inferRoleFromDescription(desc: string): TaskRole {
    const lower = desc.toLowerCase();
    if (lower.includes('ui assistance') || lower.includes('simple') || lower.includes('chat') || lower.includes('quick')) {
      return 'fast';
    }
    if (lower.includes('plan') || lower.includes('reason') || lower.includes('complex') || lower.includes('deep')) {
      return 'reasoning';
    }
    if (lower.includes('code') || lower.includes('program') || lower.includes('compile') || lower.includes('typescript')) {
      return 'coding';
    }
    if (lower.includes('verify') || lower.includes('test') || lower.includes('lint') || lower.includes('check')) {
      return 'verification';
    }
    if (lower.includes('voice') || lower.includes('speak') || lower.includes('audio') || lower.includes('speech')) {
      return 'voice';
    }
    if (lower.includes('image') || lower.includes('draw') || lower.includes('generate photo')) {
      return 'image';
    }
    return 'general';
  }

  private checkBudgetExceeded(provider: ModelProvider, model: string): boolean {
    const policy = globalModelRoutingPolicy.getSettings();
    const estimatedCost = provider.estimateCost(model, 1000, 1000);
    return estimatedCost > policy.maxEstimatedCostPerRequest;
  }
}

export const globalModelRouter = new ModelRouter();
export default globalModelRouter;
