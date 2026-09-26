import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { placeholdersIn } from './config';

async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  vi.unstubAllEnvs();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  const config = await import('./config');
  const content = await import('./content');
  return { ...config, ...content };
}

describe('legal documents', () => {
  it('flag unfilled placeholders until they are configured', async () => {
    const draft = await load();
    expect(placeholdersIn(draft.documentText(draft.TERMS))).toEqual(['[CONTACT_EMAIL]']);
    expect(placeholdersIn(draft.documentText(draft.PRIVACY)).sort()).toEqual(['[CONTACT_EMAIL]', '[HOSTING_PROVIDER]']);

    const filled = await load({
      NEXT_PUBLIC_LEGAL_CONTACT_EMAIL: 'privacy@example.com',
      NEXT_PUBLIC_HOSTING_PROVIDER: 'Vercel',
    });
    expect(placeholdersIn(filled.documentText(filled.TERMS))).toEqual([]);
    expect(placeholdersIn(filled.documentText(filled.PRIVACY))).toEqual([]);
    expect(filled.documentText(filled.PRIVACY)).toContain('privacy@example.com');
    vi.unstubAllEnvs();
  });

  it('state the same trial length the database grants at signup', async () => {
    const { LEGAL, documentText, TERMS } = await load();
    const migration = readFileSync(resolve(__dirname, '../../../../../supabase/migrations/19_billing.sql'), 'utf8');

    expect(migration).toContain(`INTERVAL '${LEGAL.trialDays} days'`);
    expect(documentText(TERMS)).toContain(`${LEGAL.trialDays}-day free trial`);
  });

  it('keep the billing, refund, AI and jurisdiction commitments', async () => {
    const { documentText, TERMS, PRIVACY } = await load();
    const terms = documentText(TERMS);
    const privacy = documentText(PRIVACY);

    expect(terms).toContain('renew automatically each month until cancelled');
    expect(terms).toContain('do not give partial or prorated refunds');
    expect(terms).toContain('do not use Your Content to train artificial intelligence models');
    expect(terms).toContain('the State of Delaware, United States');
    expect(privacy).toContain('use Your Content to train AI models');
    for (const processor of ['Supabase', 'Stripe', 'Anthropic', 'OpenAI', 'Google (Gemini)', 'Ollama']) {
      expect(privacy).toContain(processor);
    }
    expect(privacy).toContain('We use only essential cookies');
  });

  it('give every section a unique anchor', async () => {
    const { TERMS, PRIVACY } = await load();
    for (const doc of [TERMS, PRIVACY]) {
      const ids = doc.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
