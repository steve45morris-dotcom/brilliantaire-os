import { createHash, createHmac, randomBytes } from 'node:crypto';
import { TOKEN_PREFIX } from './token-routes';

// Server-only: personal access token material. Never import from client
// components or the middleware.

export interface NewToken {
  /** Shown to the user once, never stored. */
  token: string;
  /** SHA-256 of the token, hex. The only form the database keeps. */
  hash: string;
  /** "icy_" plus the first 8 characters, for recognising a token in a list. */
  prefix: string;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function generateToken(): NewToken {
  const token = TOKEN_PREFIX + randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token), prefix: token.slice(0, TOKEN_PREFIX.length + 8) };
}

/** Lifetime of the identity passed to Supabase for one token request. */
export const ACCESS_JWT_TTL_SECONDS = 300;

/**
 * A short-lived Supabase access token (HS256) for the token's owner. PostgREST
 * accepts it like a browser session's, so auth.uid() and every RLS policy and
 * function apply unchanged. Signed with the project's JWT secret.
 */
export function signAccessJwt(authUserId: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub: authUserId,
    role: 'authenticated',
    aud: 'authenticated',
    iss: 'icyos-api-token',
    iat: nowSeconds,
    exp: nowSeconds + ACCESS_JWT_TTL_SECONDS,
  });
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export const EXPIRY_CHOICES = [30, 90, 365] as const;

/** Expiry timestamp for a choice in days, or null for a token that never expires. */
export function expiresAt(days: number | null, now = Date.now()): string | null {
  return days === null ? null : new Date(now + days * 86_400_000).toISOString();
}
