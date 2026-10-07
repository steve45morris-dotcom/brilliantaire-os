import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '../../../lib/api/response';
import { validatePayload } from '../../../lib/api/validation';
import { createServerSupabaseClient } from '../../../lib/auth/supabase-server';
import {
  ONBOARDED_COOKIE,
  ONBOARDED_COOKIE_OPTIONS,
  onboardingSchema,
  type OnboardingResult,
} from '../../../lib/onboarding/first-run';

// Creates the signed-in user's workspace, first project, "Sprint 1" and the
// optional sample mission in one transaction. Repeat calls return the
// existing workspace with created: false.
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, onboardingSchema);
  if (!check.success) return check.response;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('unauthorized', 'Sign in required', null, 401);

  const { workspaceName, projectName, projectPriority, includeSampleMission } = check.data;
  const { data, error } = await supabase.rpc('complete_onboarding', {
    workspace_name: workspaceName,
    project_name: projectName,
    project_priority: projectPriority,
    include_sample_mission: includeSampleMission,
  });
  if (error || !data) {
    console.error('Onboarding failed:', error?.message);
    return errorResponse('onboarding_failed', 'Could not set up your workspace. Please try again.', null, 500);
  }

  const response = jsonResponse(data as OnboardingResult, (data as OnboardingResult).created ? 201 : 200);
  response.cookies.set(ONBOARDED_COOKIE, user.id, ONBOARDED_COOKIE_OPTIONS);
  return response;
}
