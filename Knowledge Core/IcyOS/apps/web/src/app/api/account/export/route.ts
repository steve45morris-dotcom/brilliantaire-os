import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../lib/auth/request-auth';
import { errorResponse } from '../../../../lib/api/response';

export async function GET(req: Request): Promise<NextResponse> {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await auth.db.rpc('export_account');
  if (error) {
    console.error('export_account failed:', error.message);
    return errorResponse('internal_error', 'Could not export account data. Please try again.', null, 500);
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="icyos-export.json"',
    },
  });
}
