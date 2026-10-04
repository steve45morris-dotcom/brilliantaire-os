# Launching IcyOS

Do these in order. Each step says where to do it. Step 7 checks the steps before it.

Never paste a key into a chat. Keys go into Supabase, your hosting dashboard or `pjkkey`, nowhere else.

## 1. Database (Supabase)

Run the files in `supabase/migrations/`, oldest first, ending with `26_knowledge_notes.sql`.

- **SQL editor:** open the Supabase dashboard → SQL Editor. Paste one file, run it, then do the next.
- **Supabase CLI**, if this folder is linked to your project: run `supabase db push`.
- **Which ones:** run only the ones your database doesn't have yet. If you're not sure where you stopped, don't guess. Step 7 names any update that's missing.

| Files | What they add |
|---|---|
| 01–14 | Tables, roles and starting data |
| 15–18 | Fixes to who can read what |
| 19 | Billing |
| 20 | First-run setup |
| 21–22 | Dashboard progress; creating and editing work |
| 23 | Personal access tokens (P.J.K.) |
| 24 | Inbox brain dumps and time estimates |
| 25 | Timeline, Focus and Review |
| 26 | Knowledge notes |

## 2. Sign-in addresses (Supabase)

Go to Authentication → URL Configuration:

- **Site URL:** your IcyOS address, for example `https://app.example.com`.
- **Redirect URLs:** add `https://app.example.com/auth/callback`.

## 3. Server settings (your hosting dashboard)

Set these as environment variables on the IcyOS server.

**Required**

| Setting | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API: Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page: the `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page: the `service_role` key. It is secret: keep it on the server only. |
| `SUPABASE_JWT_SECRET` | Same page, JWT settings: the JWT secret. Without it, P.J.K.'s token can't work. |
| `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` | The address for legal and privacy requests (see `apps/web/LEGAL.md`) |
| `NEXT_PUBLIC_HOSTING_PROVIDER` | Who hosts the app, for example `Vercel` |

**Billing:** choose one.

- **Charge for it:** set the Stripe settings in `apps/web/BILLING.md`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO` and `STRIPE_PRICE_TEAM`. Then add the webhook in Stripe as that file describes. Use Stripe's test mode first.
- **Not yet:** set `BILLING_ENFORCEMENT=off`, and nobody is asked to pay.

**Optional**

- `ANTHROPIC_API_KEY`: Claude sorts Inbox brain dumps. Without it, simple rules do.

## 4. Deploy

Deploy the app in `apps/web`. It's a Next.js app in a pnpm monorepo and needs Node 20 or newer.

- **On Vercel:** set Root Directory to `Knowledge Core/IcyOS/apps/web`. Leave the framework as Next.js. Vercel finds the pnpm workspace above it.
- **Anywhere else:** run `pnpm install` and `pnpm build` in `Knowledge Core/IcyOS`, then serve `apps/web` with `pnpm --filter web-app start`.

Settings changed in step 3 only take effect after a deploy.

## 5. First sign-in (IcyOS)

1. Open your IcyOS address and sign in.
2. Finish the setup screen. It creates your workspace and first project.
3. Check that the Terms and Privacy pages show your contact address. Have them read before inviting anyone (see `apps/web/LEGAL.md`).

## 6. Token for P.J.K. (IcyOS, then your Mac)

1. In IcyOS, open Settings → Personal access tokens → Create. Name it "P.J.K. on my Mac" and pick an expiry. Copy it: it's shown once.
2. On the Mac, run:

   ```bash
   pjkkey ICYOS_TOKEN   # paste the token at the hidden prompt
   pjkkey ICYOS_URL     # your IcyOS address, e.g. https://app.example.com
   ```

   If `pjkkey` is missing, install it first from `docs/PJKKEY.md` in the brilliantaire-os repo.

## 7. Launch check (your Mac)

From the brilliantaire-os repo:

```bash
cd "Knowledge Core/IcyOS"
pnpm launch-check
```

It uses the token and address you just saved, only reads, and never prints the token. It checks, in order:

1. The app is up (`/api/health`).
2. Signed-out requests are turned away.
3. The token works and your workspace loads (migrations 15–24).
4. A token can't reach settings or token management.
5. Timeline, Focus and Review load (migration 25), and so do Knowledge notes (migration 26).
6. The day planner proposes a plan. Nothing is saved.
7. Brain-dump sorting works, and whether Claude or the simple rules did it. This sends one sample sentence ("Email the printer about the posters"). Nothing is saved. Add `--skip-ai` to leave this check out.

Each problem comes with what to do, such as "apply 26_knowledge_notes.sql" or "set SUPABASE_JWT_SECRET". Fix it, then run the check again until it says **Ready**.

## 8. Connect P.J.K. (your Mac)

```bash
cd ~/sentinel-os
git pull
npm run pjk:doctor -- --online   # the IcyOS row should say "connected"
npm run pjk                      # restart P.J.K.
```

P.J.K. uses the Mac's clock for "today", so check the Mac's time zone is yours. Then try:

- "IcyOS, what's on?"
- "IcyOS, plan my day"
- "IcyOS, what's my plan?"

## After launch

- **Uptime monitor:** point one at `https://<your-address>/api/health`. It answers without signing in, and says only that the app is up.
- **After every update:** run `pnpm launch-check` again, especially when the update includes a new migration.
- **More than one server:** rate limits are counted per server today. Before running more than one, see "Rate limiting" in the repo's `CLAUDE.md`.
