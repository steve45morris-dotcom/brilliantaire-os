import { jsonResponse, errorResponse } from '../../../lib/api/response';
import { createServerSupabaseClient } from '../../../lib/auth/supabase-server';
import { loadWorkspaceOverview } from '../../../lib/workspace/overview';

// The signed-in user's workspace, projects, missions and steps.
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('unauthorized', 'Sign in required', null, 401);

  try {
    return jsonResponse(await loadWorkspaceOverview(supabase));
  } catch (err) {
    console.error((err as Error).message);
    return errorResponse('internal_error', 'Could not load your workspace', null, 500);
  }
}
