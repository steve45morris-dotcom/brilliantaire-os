import { z } from 'zod';

// First-run setup. Users without a workspace are sent to /onboarding, which calls
// complete_onboarding() (supabase/migrations/20_onboarding.sql).

export const ONBOARDING_PATH = '/onboarding';

/**
 * Set once the signed-in user is known to have a workspace, so the middleware
 * stops querying for it. Its value is the auth user id: a different account
 * signing in on the same browser is checked again. It only skips a redirect,
 * so a forged value grants nothing.
 */
export const ONBOARDED_COOKIE = 'icyos_onboarded';
export const ONBOARDED_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
};

// Pages a user without a workspace can still open. Everything else redirects.
const SKIP_PREFIXES = [ONBOARDING_PATH, '/billing', '/login', '/auth/', '/terms', '/privacy'];

/** Page requests that should send a user without a workspace to /onboarding. */
export function needsFirstRunCheck(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return false;
  return !SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`));
}

const name = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(255, `${label} must be 255 characters or fewer`);

export const onboardingSchema = z.object({
  workspaceName: name('Workspace name'),
  projectName: name('Project name'),
  projectPriority: z.enum(['P1', 'P2', 'P3']).default('P2'),
  includeSampleMission: z.boolean().default(true),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export interface OnboardingResult {
  created: boolean;
  workspace_id: string;
  project_id?: string;
  sprint_id?: string;
  mission_id?: string | null;
}

/** The sample mission's steps, as inserted by complete_onboarding(). */
export const SAMPLE_MISSION = {
  name: 'Sample mission: plan your first week',
  actions: [
    'Capture three things on your mind in the Inbox',
    'Generate a plan on the Timeline and approve it',
    'Run one Focus session, then reflect in Review',
  ],
};
