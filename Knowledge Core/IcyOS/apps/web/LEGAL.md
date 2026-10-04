# Terms of Service and Privacy Policy

Drafts, not legal advice. Have them reviewed by a lawyer before launch.

- **Pages:** `/terms` and `/privacy`. They are public, so they work signed out and after the trial ends.
- **Where they're linked:** the login page, the billing page, and the Stripe Checkout submit text.
- **Where the text lives:** `src/lib/legal/content.ts`.
- **Shared facts:** entity, governing law, trial length and age limit are in `src/lib/legal/config.ts`.

## Before publishing

1. **Fill the placeholders.** Both pages show a "Draft pending legal review" banner until these are set:
   - `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL`: the address for legal and privacy requests.
   - `NEXT_PUBLIC_HOSTING_PROVIDER`: who hosts the app, for example "Vercel".
2. **Confirm the legal entity.** `LEGAL.entity` says "Supernova Systems". Use the exact registered
   name, for example "Supernova Systems LLC".
3. **Back up two promises with a real process.** The documents promise both of these, but the app has
   no self-serve feature for either yet:
   - account deletion within 30 days of a request;
   - a content export for 30 days after termination.
   Until that exists, handle requests by hand through the contact address.
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
