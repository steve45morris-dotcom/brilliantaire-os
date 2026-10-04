# Inbox: brain-dump to missions

The Inbox takes everything on someone's mind, as messy as they like, and turns it into missions they
review before anything is saved.

1. **Sort it** (`POST /api/inbox/sort`): proposes missions, each with optional steps, a project and a
   time estimate. Nothing is saved. Rate limited as AI (10 a minute per user).
2. **Review:** untick, rename, edit steps (one per line), choose or create a project, and adjust the
   estimate.
3. **Add** (`POST /api/inbox/add`): saves the kept missions in one transaction through
   `add_inbox_missions()` (`supabase/migrations/24_inbox.sql`). Either all of them are added or none
   is.

Both routes accept personal access tokens, so P.J.K. can sort and add by voice. The dashboard shows
estimates as "~30 min" on each mission.

## Who sorts it

- **Claude**, when `ANTHROPIC_API_KEY` is set (`src/lib/inbox/brain-dump.ts`):
  - The model is `claude-opus-5-5` at low effort, with structured output, so the reply always has
    the right shape.
  - It sends the brain-dump plus the user's project names, and nothing else, to Anthropic.
  - Anthropic is already listed as a processor in the Privacy Policy, and doesn't train on it.
  - Server-side refusal fallbacks are on (`fallbacks: "default"`). If Claude still declines, errors
    or returns nothing, the rules below take over, so sorting never fails because of the AI.
  - Only the kind of failure is logged, never the text.
- **Simple rules**, otherwise (`src/lib/inbox/rules.ts`):
  - One mission per line, bullet or sentence.
  - Filler is stripped ("I need to", "don't forget to", "also").
  - Venting lines are skipped.
  - "Thing: a, b and c" becomes a mission with steps.
  - "30 min", "2h", "an hour" become the estimate.
  - A mission that names one existing project goes into it.
  - The page says when the rules sorted it, so names get a second look.

## Setup

- **Apply `24_inbox.sql` after 15 to 23.** It adds `missions.estimated_minutes`, which the dashboard
  now reads. Apply it before deploying this version, or the dashboard can't load.
- **Optional:** set `ANTHROPIC_API_KEY` on the server for Claude sorting. Without it, the Inbox uses
  the rules.
