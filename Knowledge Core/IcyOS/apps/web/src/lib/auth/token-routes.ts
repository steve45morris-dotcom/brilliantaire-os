// Which requests may authenticate with a personal access token instead of a
// browser session. Shared by the middleware (Edge runtime) and the API routes,
// so it uses nothing Node-specific.
//
// Tokens reach the user's own work (projects, missions, steps, day plans,
// focus sessions, reviews and notes) only: never billing,
// onboarding, settings or token management, so a leaked token can't mint more
// tokens or change the account.

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

const TOKEN_ROUTES: RegExp[] = [
  /^\/api\/workspace$/,
  /^\/api\/projects$/,
  new RegExp(`^/api/projects/${UUID}$`),
  new RegExp(`^/api/projects/${UUID}/missions$`),
  new RegExp(`^/api/missions/${UUID}$`),
  new RegExp(`^/api/missions/${UUID}/steps$`),
  new RegExp(`^/api/actions/${UUID}$`),
  /^\/api\/actions\/complete$/,
  /^\/api\/inbox\/sort$/,
  /^\/api\/inbox\/add$/,
  /^\/api\/timeline$/,
  /^\/api\/timeline\/propose$/,
  /^\/api\/timeline\/save$/,
  /^\/api\/focus$/,
  /^\/api\/focus\/start$/,
  new RegExp(`^/api/focus/${UUID}$`),
  /^\/api\/review$/,
  /^\/api\/knowledge$/,
  new RegExp(`^/api/knowledge/${UUID}$`),
  /^\/api\/pjk\/status$/,
];

export const TOKEN_PREFIX = 'icy_';

/** "icy_" plus 32 random bytes in base64url. */
export const TOKEN_PATTERN = /^icy_[A-Za-z0-9_-]{43}$/;

export function acceptsApiToken(pathname: string): boolean {
  return TOKEN_ROUTES.some((route) => route.test(pathname));
}

/** The token from an `Authorization: Bearer icy_…` header, or null. */
export function bearerToken(headers: Headers): string | null {
  const match = /^Bearer\s+(icy_\S+)$/i.exec(headers.get('authorization')?.trim() ?? '');
  return match ? match[1] : null;
}

/** A token as listed in Settings. The hash is never readable by users. */
export interface ApiTokenRow {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

/** POST /api/tokens: the row plus the token itself, shown once. */
export interface CreatedApiToken {
  id: string;
  name: string;
  prefix: string;
  expires_at: string | null;
  token: string;
}
