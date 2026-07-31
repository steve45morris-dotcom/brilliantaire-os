export interface RuntimeMemoryNode {
  key: string;
  value: any;
  updatedAt: string;
}

export class RuntimeMemory {
  private cache: Map<string, RuntimeMemoryNode> = new Map();

  public get(key: string): any {
    return this.cache.get(key)?.value;
  }

  public set(key: string, value: any): void {
    this.cache.set(key, {
      key,
      value,
      updatedAt: new Date().toISOString()
    });
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }
}

export const globalRuntimeMemory = new RuntimeMemory();
