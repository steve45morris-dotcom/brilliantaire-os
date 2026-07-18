export class ToastManager {
  private listeners: ((msg: string, type: 'info' | 'success' | 'warn') => void)[] = [];

  public subscribe(callback: (msg: string, type: 'info' | 'success' | 'warn') => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public show(msg: string, type: 'info' | 'success' | 'warn' = 'info'): void {
    this.listeners.forEach(l => l(msg, type));
  }
}

export const globalToastManager = new ToastManager();
