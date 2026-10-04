# Personal access tokens

Personal access tokens let a user's own tools, such as P.J.K., read and change that user's projects,
missions and steps without a browser session. Users create and revoke them in **Settings**.

## What a token can do

A token can only reach these routes, as its owner:

| Route | Does |
|---|---|
| `GET /api/workspace` | Workspace, projects, missions and steps |
| `POST /api/projects` | Add a project |
| `PATCH`/`DELETE /api/projects/[id]` | Rename, reprioritise or delete a project |
| `POST /api/projects/[id]/missions` | Add a mission with steps |
| `PATCH`/`DELETE /api/missions/[id]` | Rename or delete a mission |
| `POST /api/missions/[id]/steps` | Add a step |
| `PATCH`/`DELETE /api/actions/[id]` | Rename or delete a step |
| `POST /api/actions/complete` | Tick or un-tick a step |

Anything else answers as if the request were signed out. That includes billing, onboarding, settings,
token management and the older placeholder routes. So a leaked token can't create more tokens or
change the account. The list lives in `src/lib/auth/token-routes.ts`.

Example:

```bash
curl -H "Authorization: Bearer $ICYOS_TOKEN" https://<your-app>/api/workspace
```

## How it works

1. **Creating:** the app generates `icy_` plus 32 random bytes and shows it once. The database keeps
   only its SHA-256 hash and the first 12 characters, for recognising it in the list
   (`supabase/migrations/23_api_tokens.sql`).
2. **Using:** the middleware gives each token its own rate limit and leaves it to the route. The route
   (`src/lib/auth/request-auth.ts`):
   - looks the hash up through `resolve_api_token()`, which only the service role can call;
   - signs a 5-minute Supabase access JWT for the token's owner;
   - makes its database calls with that JWT.

   Every RLS policy and database function then treats the request exactly like that user's browser
   session. The subscription gate applies too: a lapsed account gets 402.
3. **Revoking:** a revoked token stops working on its next request.

Limits: 20 active tokens per user. A token expires after 30 days, 90 days or 1 year, or never.

## Setup

- **Apply migration 23** after 15 to 22.
- **Set two server-only environment variables:**
  - `SUPABASE_SERVICE_ROLE_KEY`, already used for billing.
  - `SUPABASE_JWT_SECRET`: the project's JWT secret, under Supabase **Project Settings → JWT Keys**
    (shown as the legacy JWT secret on projects that have moved to the new signing keys). Tokens only
    work while that secret is still accepted. If it has been revoked, token requests fail with 401
    from Supabase.

  Without either variable, token requests get 503 and the rest of the app is unaffected.
- **For P.J.K.:** save the token with `pjkkey ICYOS_TOKEN` on the Mac, never in chat or a file in
  either repo.
