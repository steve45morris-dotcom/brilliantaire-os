import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse, errorResponse } from '../../../lib/api/response';
import { validatePayload } from '../../../lib/api/validation';
import { createServerSupabaseClient } from '../../../lib/auth/supabase-server';
import { EXPIRY_CHOICES, expiresAt, generateToken } from '../../../lib/auth/api-tokens';
import type { ApiTokenRow } from '../../../lib/auth/token-routes';

// Personal access tokens: browser sessions only. The middleware never lets a
// token reach these routes, so a token can't list, create or revoke tokens.

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  expiresInDays: z.union([z.literal(EXPIRY_CHOICES[0]), z.literal(EXPIRY_CHOICES[1]), z.literal(EXPIRY_CHOICES[2]), z.null()]),
});

async function signedIn() {
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  return user ? db : null;
}

export async function GET() {
  const db = await signedIn();
  if (!db) return errorResponse('unauthorized', 'Sign in required', null, 401);

  const { data, error } = await db
    .from('api_tokens')
    .select('id, name, prefix, created_at, last_used_at, expires_at, revoked_at')
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Listing tokens failed:', error.message);
    return errorResponse('internal_error', 'Could not load your tokens', null, 500);
  }
  return jsonResponse((data ?? []) as ApiTokenRow[]);
}

// The token is in this response and nowhere else: it is not stored or logged.
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, createSchema);
  if (!check.success) return check.response;
  const db = await signedIn();
  if (!db) return errorResponse('unauthorized', 'Sign in required', null, 401);

  const { token, hash, prefix } = generateToken();
  const expires = expiresAt(check.data.expiresInDays);
  const { data, error } = await db.rpc('create_api_token', {
    token_name: check.data.name,
    token_hash: hash,
    token_prefix: prefix,
    expires_at: expires,
  });
  if (error?.code === '22023') return errorResponse('validation_error', error.message, null, 400);
  if (error || !data) {
    console.error('Creating token failed:', error?.message);
    return errorResponse('internal_error', 'Could not create the token', null, 500);
  }
  return jsonResponse({ id: (data as { id: string }).id, name: check.data.name, prefix, expires_at: expires, token }, 201);
}
