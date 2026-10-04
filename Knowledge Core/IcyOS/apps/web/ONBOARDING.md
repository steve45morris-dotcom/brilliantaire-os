# Client onboarding

New users get an account and a trial when they sign up (migration 19), but no workspace or projects.
Until they have a workspace, every app page redirects to `/onboarding`, a three-step setup:

1. **Workspace:** name it.
2. **First project:** name it and pick a priority (P1 to P3).
3. **Sample mission:** optionally add "Sample mission: plan your first week", with three steps
   covering Inbox, Timeline, Focus and Review.

Finishing creates the workspace, the project, "Sprint 1" and the sample mission in one transaction.

## How it works

- **Database:** `supabase/migrations/20_onboarding.sql` adds `complete_onboarding()`.
  - It acts only for the signed-in user.
  - Calling it again once they have a workspace returns that workspace and creates nothing.
  - Signed-in users still have no direct write access to these tables; the function is the only
    way in.
  - It also adds `workspaces.name` and makes sprint names unique per project instead of across the
    whole database, so every user can have a "Sprint 1".
- **API:** `POST /api/onboarding` validates the input (`src/lib/onboarding/first-run.ts`) and calls the
  function.
- **Redirect:** the middleware checks for a workspace on page requests. Once one is found it sets the
  `icyos_onboarded` cookie, so later requests skip the lookup. The cookie holds the auth user id, so
  a different account on the same browser is checked again.
  - Billing, legal, login and API routes are never redirected.
  - A locked-out user goes to `/billing` first.
  - If the lookup fails, the request goes through: onboarding is not a security check.

## After setup: the dashboard

`/dashboard` shows the workspace, its projects (P1 first), and each mission with its steps.
- **Reading:** `GET /api/workspace` loads everything in one query through RLS
  (`src/lib/workspace/overview.ts`), so it only returns the user's own rows.
- **Ticking steps:** `POST /api/actions/complete` calls `set_action_completed()` from
  `21_mission_progress.sql`. Like onboarding, this function is the only write users have. It also
  moves the mission along:
  - the first step done makes it Running;
  - all steps done makes it Completed;
  - un-ticking a step on a Completed mission makes it Running again.
  - Skipped and Failed missions are left alone.

## Deploying

Apply `20_onboarding.sql` and `21_mission_progress.sql` after 15 to 19. Without them,
`/onboarding` reports "Could not set up your workspace" and the dashboard can't load or update steps.

## Not included yet

- Google Calendar and Obsidian connections: the app has no integration for either, so the flow
  doesn't offer them.
- Inviting teammates.
- Renaming the workspace after setup. The column exists, but there's no settings page for it yet.
