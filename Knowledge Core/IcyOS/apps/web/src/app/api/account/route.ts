import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../../lib/auth/request-auth';
import { jsonResponse, errorResponse } from '../../../lib/api/response';
import { getServiceDb } from '../../../lib/billing/server';

export async function DELETE(req: Request): Promise<NextResponse> {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.via === 'token') {
    return errorResponse('forbidden', 'Account deletion requires a browser session', null, 403);
  }

  const { error } = await auth.db.rpc('delete_account');
  if (error) {
    console.error('delete_account failed:', error.message);
    return errorResponse('internal_error', 'Could not delete account. Please try again.', null, 500);
  }

  try {
    const service = getServiceDb();
    await service.auth.admin.deleteUser(auth.authUserId);
  } catch (err) {
    console.error('auth.admin.deleteUser failed:', (err as Error).message);
  }

  return jsonResponse({ deleted: true });
}
