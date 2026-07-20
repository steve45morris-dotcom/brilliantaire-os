export class MCPAuth {
  private static validTokens: Set<string> = new Set(['mcp-session-default-token']);

  public static isValidToken(token?: string): boolean {
    if (!token) return false;
    return this.validTokens.has(token);
  }

  public static auditAccess(toolOrResource: string, success: boolean, detail = ''): void {
    console.log(`[MCP Audit] Access to ${toolOrResource}: ${success ? 'GRANTED' : 'DENIED'}. Detail: ${detail}`);
  }
}
