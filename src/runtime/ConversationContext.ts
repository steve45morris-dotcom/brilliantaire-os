export interface ChatMessage {
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export class ConversationContext {
  private currentProject = 'The One System';
  private currentWorkspace = '/Users/alexanderanthony';
  private history: ChatMessage[] = [];
  private goals: string[] = [];

  constructor() {
    // Initial logs
    this.history.push({
      sender: 'system',
      content: 'Supernova Runtime active. Operating shell mapped to Kernel layers.',
      timestamp: new Date().toISOString()
    });
  }

  public getHistory(): ChatMessage[] {
    return [...this.history];
  }

  public addMessage(sender: ChatMessage['sender'], content: string): void {
    this.history.push({
      sender,
      content,
      timestamp: new Date().toISOString()
    });
  }

  public getContextDetails() {
    return {
      currentProject: this.currentProject,
      currentWorkspace: this.currentWorkspace,
      goals: [...this.goals]
    };
  }

  public setProject(project: string): void {
    this.currentProject = project;
  }

  public addGoal(goal: string): void {
    this.goals.push(goal);
  }

  public clearGoals(): void {
    this.goals = [];
  }
}

export const globalConversationContext = new ConversationContext();
