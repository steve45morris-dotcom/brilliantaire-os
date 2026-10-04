import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '../../../../lib/api/response';
import { createServerSupabaseClient } from '../../../../lib/auth/supabase-server';
import { notFound, routeId } from '../../../../lib/workspace/manage';

// Revokes a token at once; requests using it start failing with 401.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await routeId(params);
  if (!id) return notFound();

  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return errorResponse('unauthorized', 'Sign in required', null, 401);

  const { data, error } = await db.rpc('revoke_api_token', { token_id: id });
  if (error?.code === 'P0002') return notFound();
  if (error) {
    console.error('Revoking token failed:', error.message);
    return errorResponse('internal_error', 'Could not revoke the token', null, 500);
  }
  return jsonResponse(data);
}
