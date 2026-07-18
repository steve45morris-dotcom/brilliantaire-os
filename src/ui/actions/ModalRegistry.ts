export interface ModalConfig {
  title: string;
  content: string;
  type: 'fallback' | 'approval' | 'info';
}

export class ModalRegistry {
  private currentModal: ModalConfig | null = null;
  private listeners: ((modal: ModalConfig | null) => void)[] = [];

  public subscribe(callback: (modal: ModalConfig | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public open(config: ModalConfig): void {
    this.currentModal = config;
    this.listeners.forEach(l => l(config));
  }

  public close(): void {
    this.currentModal = null;
    this.listeners.forEach(l => l(null));
  }

  public getCurrentModal(): ModalConfig | null {
    return this.currentModal;
  }
}

export const globalModalRegistry = new ModalRegistry();
