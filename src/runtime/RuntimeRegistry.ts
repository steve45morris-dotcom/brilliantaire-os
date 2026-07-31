export class RuntimeRegistry {
  private services: Map<string, any> = new Map();
  private commands: string[] = [];

  public registerService(name: string, service: any): void {
    this.services.set(name, service);
  }

  public registerCommand(name: string): void {
    if (!this.commands.includes(name)) {
      this.commands.push(name);
    }
  }

  public getCommands(): string[] {
    return [...this.commands];
  }
}

export const globalRuntimeRegistry = new RuntimeRegistry();
