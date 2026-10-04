import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse, errorResponse } from '../../../../lib/api/response';
import { validatePayload } from '../../../../lib/api/validation';
import { authenticateRequest } from '../../../../lib/auth/request-auth';
import { sortBrainDump } from '../../../../lib/inbox/brain-dump';
import { sortSchema } from '../../../../lib/inbox/types';

// Turns a brain-dump into proposed missions. Saves nothing: the user reviews
// them, then POST /api/inbox/add saves the ones they keep. Rate limited as AI.
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, sortSchema);
  if (!check.success) return check.response;
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { data: projects, error } = await auth.db.from('projects').select('id, name');
  if (error) {
    console.error('Loading projects failed:', error.message);
    return errorResponse('internal_error', 'Could not load your projects', null, 500);
  }
  return jsonResponse(await sortBrainDump(check.data.text, (projects ?? []) as { id: string; name: string }[]));
}
