import crypto from 'node:crypto';
import { globalSecurityManager } from '../../../kernel/security/SecurityManager.js';

export interface IssuedToken {
  token: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Timing-safe string comparison guarding against length mismatch exceptions.
 */
function timingSafeCompare(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export class MCPAuth {
  private static activeTokens: Map<string, IssuedToken> = new Map();

  /**
   * Issue a dynamic runtime session token with expiration.
   * Requires a valid SecurityManager session (Operator/Administrator) OR an explicit timing-safe secret match.
   */
  public static issueToken(callerTokenOrSecret?: string, ttlMs = 3600000): string | null {
    let authorized = false;

    // 1. Check if caller has an active SecurityManager session with sufficient role
    const session = globalSecurityManager.getSession();
    if (session && callerTokenOrSecret && timingSafeCompare(session.token, callerTokenOrSecret)) {
      if (globalSecurityManager.checkPermission('mcp:issue_token', 'Operator')) {
        authorized = true;
      }
    }

    // 2. Check explicit env secret fallback using timingSafeCompare
    const envSecret = process.env.MCP_SECRET_KEY;
    if (!authorized && envSecret && callerTokenOrSecret && timingSafeCompare(envSecret, callerTokenOrSecret)) {
      authorized = true;
    }

    if (!authorized) {
      console.warn('[MCPAuth] Unauthorized attempt to issue runtime MCP token.');
      return null;
    }

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

    // 2. Check env-configured MCP_SECRET_KEY secret if set using timing-safe comparison
    const envSecret = process.env.MCP_SECRET_KEY;
    if (envSecret && envSecret.trim().length > 0 && timingSafeCompare(envSecret, token)) {
      return true;
    }

    return false;
  }

  public static auditAccess(toolOrResource: string, success: boolean, detail = ''): void {
    console.log(`[MCP Audit] Access to ${toolOrResource}: ${success ? 'GRANTED' : 'DENIED'}. Detail: ${detail}`);
  }
}
