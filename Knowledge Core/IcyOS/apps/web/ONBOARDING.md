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

## Managing projects, missions and steps

From the dashboard, users can add, rename and delete projects, missions and steps, and change a
project's priority. Deletes ask for confirmation first; deleting a project also deletes its missions
and steps.

| Change | Route | Database function |
|---|---|---|
| Add project | `POST /api/projects` | `create_project` |
| Rename or reprioritise project | `PATCH /api/projects/[id]` | `update_project` |
| Delete project | `DELETE /api/projects/[id]` | `delete_project` |
| Add mission (with steps) | `POST /api/projects/[id]/missions` | `create_mission` |
| Rename mission | `PATCH /api/missions/[id]` | `rename_mission` |
| Delete mission | `DELETE /api/missions/[id]` | `delete_mission` |
| Add step | `POST /api/missions/[id]/steps` | `add_step` |
| Rename step | `PATCH /api/actions/[id]` | `rename_step` |
| Delete step | `DELETE /api/actions/[id]` | `delete_step` |

- **Database:** the functions are in `22_manage_work.sql`. Signed-in users still have no direct write
  access to these tables; these functions are the only way in.
  - Each function acts only on the caller's own rows. Someone else's row and a missing one both
    answer 404, so ids can't be probed.
  - Limits per account: 100 projects per workspace, 500 missions per project, 50 steps per mission.
  - Adding a step to a Completed mission makes it Running again. Deleting the last open step
    completes it.
- **API:** `src/lib/workspace/manage.ts` validates input and maps database errors:
  - bad input is a 400 with the database's own message;
  - a missing or foreign row is a 404;
  - anything else is a generic 500, with the detail logged.

## Deploying

Apply `20_onboarding.sql`, `21_mission_progress.sql` and `22_manage_work.sql` after 15 to 19. Without
them, `/onboarding` reports "Could not set up your workspace" and the dashboard can't load or change
anything.

## Not included yet

- Google Calendar and Obsidian connections: the app has no integration for either, so the flow
  doesn't offer them.
- Inviting teammates.
- Renaming the workspace after setup. The column exists, but there's no settings page for it yet.
- Reordering missions or steps.
