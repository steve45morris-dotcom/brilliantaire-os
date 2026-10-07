import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { errorResponse } from '../api/response';
import { hasAccess } from '../billing/entitlement';
import { billingEnforced } from '../billing/gate';
import { getServiceDb } from '../billing/server';
import { createServerSupabaseClient } from './supabase-server';
import { hashToken, signAccessJwt } from './api-tokens';
import { TOKEN_PATTERN, acceptsApiToken, bearerToken } from './token-routes';

export interface RequestAuth {
  /** A Supabase client acting as the caller, so RLS applies. */
  db: SupabaseClient;
  authUserId: string;
  via: 'session' | 'token';
}

/**
 * Who is calling: a browser session, or a personal access token on the routes
 * that accept one (token-routes.ts). Returns an error response when neither
 * works.
 *
 * Session requests already passed the middleware's subscription gate. Token
 * requests skip the middleware's session checks, so the gate is applied here.
 */
export async function authenticateRequest(req: Request): Promise<RequestAuth | NextResponse> {
  const token = bearerToken(req.headers);
  if (!token) {
    const db = await createServerSupabaseClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return errorResponse('unauthorized', 'Sign in required', null, 401);
    return { db, authUserId: user.id, via: 'session' };
  }

  if (!acceptsApiToken(new URL(req.url).pathname)) {
    return errorResponse('forbidden', 'Access tokens cannot be used for this request', null, 403);
  }
  if (!TOKEN_PATTERN.test(token)) return invalidToken();

  const secret = process.env.SUPABASE_JWT_SECRET;
  let service: SupabaseClient;
  try {
    if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set');
    service = getServiceDb();
  } catch (err) {
    console.error('Access tokens are not configured:', (err as Error).message);
    return errorResponse('tokens_unavailable', 'Access tokens are not available right now', null, 503);
  }

  const { data, error } = await service.rpc('resolve_api_token', { token_hash: hashToken(token) });
  if (error) {
    console.error('Token lookup failed:', error.message);
    return errorResponse('internal_error', 'Could not check the access token', null, 500);
  }
  const owner = (data as { token_id: string; auth_id: string }[] | null)?.[0];
  if (!owner) return invalidToken();

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${signAccessJwt(owner.auth_id, secret)}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  if (billingEnforced()) {
    const { data: subscription, error: subError } = await db
      .from('subscriptions')
      .select('status, trial_ends_at')
      .maybeSingle();
    if (subError) console.error('Subscription lookup failed; denying access:', subError.message);
    if (!hasAccess(subscription)) {
      return errorResponse('payment_required', 'An active subscription is required', null, 402);
    }
  }

  return { db, authUserId: owner.auth_id, via: 'token' };
}

function invalidToken() {
  return errorResponse('invalid_token', 'The access token is invalid, expired or revoked', null, 401);
}
