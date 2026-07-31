export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, authToken?: string) => Promise<any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  read: (authToken?: string) => Promise<string>;
}

export interface MCPResponse {
  contents: Array<{
    uri?: string;
    mimeType?: string;
    text: string;
  }>;
}
