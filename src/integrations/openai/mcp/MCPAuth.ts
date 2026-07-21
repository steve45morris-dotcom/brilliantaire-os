import crypto from 'node:crypto';

export interface IssuedToken {
  token: string;
  issuedAt: number;
  expiresAt: number;
}

export class MCPAuth {
  private static activeTokens: Map<string, IssuedToken> = new Map();

  /**
   * Issue a dynamic runtime session token with expiration.
   */
  public static issueToken(ttlMs = 3600000): string {
    const token = `mcp_rt_${crypto.randomBytes(32).toString('hex')}`;
    const now = Date.now();
    this.activeTokens.set(token, {
      token,
      issuedAt: now,
      expiresAt: now + ttlMs
    });
    return token;
  }

  public static revokeToken(token: string): void {
    this.activeTokens.delete(token);
  }

  public static isValidToken(token?: string): boolean {
    if (!token) return false;

    // 1. Check dynamic runtime issued tokens with expiration check
    const issued = this.activeTokens.get(token);
    if (issued) {
      if (Date.now() > issued.expiresAt) {
        this.activeTokens.delete(token);
        return false;
      }
      return true;
    }

    // 2. Check env-configured MCP_SECRET_KEY secret if set
    const envSecret = process.env.MCP_SECRET_KEY;
    if (envSecret && envSecret.trim().length > 0 && token === envSecret) {
      return true;
    }

    return false;
  }

  public static auditAccess(toolOrResource: string, success: boolean, detail = ''): void {
    console.log(`[MCP Audit] Access to ${toolOrResource}: ${success ? 'GRANTED' : 'DENIED'}. Detail: ${detail}`);
  }
}
