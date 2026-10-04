import { NextResponse } from 'next/server';
import { jsonResponse, errorResponse } from '../../../lib/api/response';
import { authenticateRequest } from '../../../lib/auth/request-auth';
import { loadWorkspaceOverview } from '../../../lib/workspace/overview';

// The caller's workspace, projects, missions and steps. Accepts a browser
// session or a personal access token.
export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    return jsonResponse(await loadWorkspaceOverview(auth.db));
  } catch (err) {
    console.error((err as Error).message);
    return errorResponse('internal_error', 'Could not load your workspace', null, 500);
  }
}
