# Terms of Service and Privacy Policy

Drafts, not legal advice. Have them reviewed by a lawyer before launch.

- **Pages:** `/terms` and `/privacy`. They are public, so they work signed out and after the trial ends.
- **Where they're linked:** the login page, the billing page, and the Stripe Checkout submit text.
- **Where the text lives:** `src/lib/legal/content.ts`.
- **Shared facts:** entity, governing law, trial length and age limit are in `src/lib/legal/config.ts`.

## Before publishing

1. ~~**Fill the placeholders.**~~ ✅ Done — defaults set in `config.ts` (`legal@icyos.app`, `Vercel`).
   Override with `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` and `NEXT_PUBLIC_HOSTING_PROVIDER` if needed.
2. **Confirm the legal entity.** `LEGAL.entity` says "Supernova Systems". Use the exact registered
   name, for example "Supernova Systems LLC".
3. ~~**Back up two promises with a real process.**~~ ✅ Done — self-serve APIs added:
   - `DELETE /api/account` — deletes all user data and the auth record (session-only, no token access).
   - `GET /api/account/export` — returns a full JSON export of the user's data.
   - Database functions: `delete_account()` and `export_account()` in migration 27.
4. **Check the processor list** in the Privacy Policy against what you actually run:
   - Supabase;
   - Stripe;
   - whichever AI providers are enabled (Anthropic, OpenAI or Gemini), or Ollama if self-hosted;
   - your host.

## Keeping them true

`src/lib/legal/legal.test.ts` fails if the stated trial length stops matching
`supabase/migrations/19_billing.sql`. It also fails if the documents drop any of these commitments:
- monthly auto-renewal;
- no partial refunds;
- no AI training on customer content;
- Delaware law;
- the processor list.

If billing, data handling or providers change, update `content.ts` along with them.
