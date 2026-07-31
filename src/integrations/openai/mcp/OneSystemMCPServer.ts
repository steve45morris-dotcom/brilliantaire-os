import { getOpenAIConfig } from '../OpenAIConfig.js';
import { MCPToolRegistry } from './MCPToolRegistry.js';
import { MCPResourceRegistry } from './MCPResourceRegistry.js';
import { MCPResponse } from './MCPTypes.js';

export class OneSystemMCPServer {
  private enabled = false;

  constructor() {
    const config = getOpenAIConfig();
    this.enabled = config.enableMcp;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public async listTools() {
    if (!this.enabled) {
      throw new Error('MCP Server is currently disabled.');
    }
    return MCPToolRegistry.listTools().map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }));
  }

  public async listResources() {
    if (!this.enabled) {
      throw new Error('MCP Server is currently disabled.');
    }
    return MCPResourceRegistry.listResources().map(r => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType
    }));
  }

  public async executeTool(name: string, args: any, token?: string): Promise<any> {
    if (!this.enabled) {
      throw new Error('MCP Server is currently disabled.');
    }
    return MCPToolRegistry.executeTool(name, args, token);
  }

  public async readResource(uri: string, token?: string): Promise<MCPResponse> {
    if (!this.enabled) {
      throw new Error('MCP Server is currently disabled.');
    }
    const resource = MCPResourceRegistry.getResource(uri);
    if (!resource) {
      throw new Error(`Resource "${uri}" not found in MCP Server.`);
    }
    const text = await resource.read(token);
    return {
      contents: [{ uri, mimeType: resource.mimeType, text }]
    };
  }
}

export const globalMCPServer = new OneSystemMCPServer();
export default globalMCPServer;
