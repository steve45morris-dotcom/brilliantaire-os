# Timeline, Focus and Review

Three pages that turn missions into a day: plan it, work it, look back on it. All three read and
write real data through `supabase/migrations/25_day_planning.sql`. They replace the earlier
placeholder pages and their mock `/api/timelines/*`, `/api/sessions/*`, `/api/reviews/*` and
`/api/learning/*` routes.

The browser always sends the user's local date and, where it matters, the start and end of their
day or working window as instants. So the server never has to guess a time zone.

## Timeline

1. **Plan my day** (`POST /api/timeline/propose`) takes a working window, from now at the earliest.
   It lays out open missions (`src/lib/day/planner.ts`):
   - Missions already running come first, then P1, P2 and P3 projects, keeping dashboard order.
   - Each mission gets its estimate, or 30 minutes, from 10 minutes to 4 hours.
   - A buffer follows each mission: a fifth of its length, from 5 to 45 minutes, scaled by habits
     (below).
   - There's a 15-minute break after every 90 minutes of missions.
   - Missions that don't fit are listed under "Didn't fit today", not dropped.
   - Nothing is saved yet.
2. **Review:** leave missions out with ✕. Later blocks move up to close the gap.
3. **Save plan** (`POST /api/timeline/save`) stores it through `save_day_plan()`, replacing any
   plan for that day. The function checks block kinds, times, order and that each mission is the
   caller's.

Each mission block links to Focus.

## Focus

- **Start** (`POST /api/focus/start`): picks a mission (the one linked from the Timeline, else the
  next one in today's plan) and an optional number of planned minutes. `start_focus()` allows one
  running session per workspace and sets the mission to Running.
- **Pause, Resume, Done, Stop** (`POST /api/focus/[id]`). The server keeps the clock:
  `focus_seconds` is the time from start to finish less pauses. So a reload, or a second device,
  shows the same timer.
- The mission's steps can be ticked while focusing.

## Review

- `GET /api/review` shows the day: steps ticked, focus time and sessions, and how many planned
  missions got a session or a ticked step.
- A reflection (score 1 to 10, what went well, what got in the way, what to change) is saved
  through `save_review()`, one per day. It can be updated later. The arrows show earlier days.

## Habits: buffers that adapt

This is the "learns how you work" idea from P.J.K.'s old copy of IcyOS, rebuilt on real sessions
(`computeInsights` in `src/lib/day/planner.ts`):

- It looks at focus sessions from the last 14 days that were finished as **Done** with planned
  minutes.
- With at least three, it averages actual ÷ planned time.
- Running over makes buffers longer by the same share, up to double. Finishing early never makes
  them shorter than usual.
- The Timeline and Review say which applies, in one sentence.

## Personal access tokens

All of these routes accept tokens (see `API_TOKENS.md`), so P.J.K. can plan the day, run focus
sessions and log reflections by voice.

## Setup

- **Apply `25_day_planning.sql` after `24_inbox.sql`.** It adds columns to `timelines`,
  `timeline_blocks`, `sessions` and `reviews`, and the functions above. Apply it before deploying
  this version, or these three pages can't load.
