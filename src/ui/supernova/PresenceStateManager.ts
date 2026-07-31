import { PresenceState, PresenceContext } from './PresenceTypes.js';
import { getPresenceSuggestions } from './PresenceSuggestions.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';
import { ModelRole } from '../../models/ModelTypes.js';
import { globalModelSelector } from '../../models/ModelSelection.js';
import { getModelCapabilities } from '../../models/ModelCapabilities.js';
import { globalRuntimeState } from '../../runtime/RuntimeState.js';

export class PresenceStateManager {
  private currentContext: PresenceContext = {
    currentState: 'idle',
    activeAlertCount: 0,
    recommendedFocus: 'the-one-system'
  };
  private listeners: ((context: PresenceContext) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).globalPresenceStateManager = this;
    }
    this.updateContext({});
  }

  public subscribe(callback: (context: PresenceContext) => void): () => void {
    this.listeners.push(callback);
    // Push current context immediately on subscription
    callback({ ...this.currentContext });
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public setState(state: PresenceState): void {
    this.updateContext({ currentState: state });
  }

  public setProjectContext(projectId?: string): void {
    const suggestions = getPresenceSuggestions(projectId);
    this.updateContext({
      currentProjectId: projectId,
      suggestedAction: suggestions.action,
      recommendedFocus: suggestions.focus
    });
    globalEventBus.publish('SupernovaContextSwitched', { projectId });
  }

  public updateAlertCount(count: number): void {
    this.updateContext({ activeAlertCount: count });
  }

  private mapStateToRole(state: PresenceState): ModelRole {
    switch (state) {
      case 'idle':
        return 'Conversation';
      case 'observing':
        return 'Research';
      case 'thinking':
        return 'Knowledge Summarizer';
      case 'planning':
        return 'Workflow Planner';
      case 'executing':
        return 'Builder';
      case 'approval':
        return 'Conversation';
      case 'reporting':
        return 'Executive Reports';
      case 'alert':
        return 'Debugger';
      case 'waiting':
        return 'Conversation';
      case 'error':
        return 'Debugger';
      default:
        return 'Conversation';
    }
  }

  private updateContext(updates: Partial<PresenceContext>): void {
    this.currentContext = {
      ...this.currentContext,
      ...updates
    };
    
    // Automatically recalculate next actions if active project context changed
    if (updates.currentProjectId !== undefined) {
      const suggestions = getPresenceSuggestions(this.currentContext.currentProjectId);
      this.currentContext.suggestedAction = suggestions.action;
      this.currentContext.recommendedFocus = suggestions.focus;
    }

    // Automatically resolve model if state changed, or if it is first initialization
    const state = this.currentContext.currentState;
    const role = this.mapStateToRole(state);
    const selection = globalModelSelector.selectModel(role);
    
    this.currentContext.activeModelRole = role;
    this.currentContext.activeModelId = selection.model.id;
    this.currentContext.activeModelName = selection.model.displayName;
    this.currentContext.activeModelProvider = selection.model.provider;
    this.currentContext.activeModelReason = selection.reason;
    this.currentContext.activeModelCapabilities = getModelCapabilities(selection.model);
    this.currentContext.activeModelConfidence = selection.confidence;
    this.currentContext.activeModelExpectedBenefit = selection.expectedBenefit;
    this.currentContext.activeModelTradeoffs = selection.tradeoffs;
    this.currentContext.activeModelSuggestedAlternative = selection.suggestedAlternative;
    this.currentContext.activeModelSuggestedAlternativeReason = selection.suggestedAlternativeReason;


    // Sync to global runtime state
    globalRuntimeState.updateState({ activeModelName: selection.model.displayName });

    this.listeners.forEach(l => l({ ...this.currentContext }));
  }

  public getContext(): PresenceContext {
    return { ...this.currentContext };
  }
}

export const globalPresenceStateManager = new PresenceStateManager();

