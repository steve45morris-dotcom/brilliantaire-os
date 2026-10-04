#!/usr/bin/env node
// Checks a deployed IcyOS, after a launch or an update.
//
//   pnpm launch-check
//
// It reads ICYOS_URL and ICYOS_TOKEN from the environment, or else from
// ~/sentinel-os/.env.local (or $SENTINEL_OS_ROOT/.env.local), where
// `pjkkey ICYOS_TOKEN` and `pjkkey ICYOS_URL` save them for P.J.K. That keeps
// the token out of shell history.
//
// Uses a personal access token (Settings → Personal access tokens) and only
// reads: nothing is created, changed or deleted. The brain-dump check sends
// one sample sentence to /api/inbox/sort, which saves nothing (with
// ANTHROPIC_API_KEY set, IcyOS passes it to Claude). Skip it with --skip-ai.
//
// The token is never printed. Exit code 0 means ready; 1 means something
// needs fixing (each failure says what).

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const TIMEOUT_MS = 15_000;
const skipAi = process.argv.includes('--skip-ai');

const results = [];
const ok = (name, detail) => results.push({ level: 'ok', name, detail });
const warn = (name, detail, fix) => results.push({ level: 'warn', name, detail, fix });
const fail = (name, detail, fix) => results.push({ level: 'fail', name, detail, fix });

/** ICYOS_URL and ICYOS_TOKEN from P.J.K.'s settings file, if there is one. Reads nothing else from it. */
function savedSettings() {
  const file = join(process.env.SENTINEL_OS_ROOT || join(homedir(), 'sentinel-os'), '.env.local');
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return {};
  }
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^(ICYOS_URL|ICYOS_TOKEN)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

function config() {
  const saved = process.env.ICYOS_URL && process.env.ICYOS_TOKEN ? {} : savedSettings();
  const rawUrl = (process.env.ICYOS_URL || saved.ICYOS_URL)?.trim();
  const token = (process.env.ICYOS_TOKEN || saved.ICYOS_TOKEN)?.trim();
  if (!rawUrl || !token) {
    console.error('IcyOS isn\'t connected yet. Create a token in IcyOS under Settings → Personal access tokens, then run:\n  pjkkey ICYOS_TOKEN\n  pjkkey ICYOS_URL\nand run this again. (Or set ICYOS_URL and ICYOS_TOKEN in the environment.)');
    process.exit(1);
  }
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    console.error(`ICYOS_URL isn't a web address: ${rawUrl}`);
    process.exit(1);
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    console.error('ICYOS_URL must start with https:// so the token is never sent unencrypted.');
    process.exit(1);
  }
  if (!/^icy_[A-Za-z0-9_-]{43}$/.test(token)) {
    console.error("ICYOS_TOKEN doesn't look like an IcyOS token (it starts with icy_). Create one under Settings → Personal access tokens.");
    process.exit(1);
  }
  return { base: url.origin, token };
}

/** One request. Never follows redirects, so the token stays on ICYOS_URL. */
async function call(cfg, method, path, { auth = true, body } = {}) {
  try {
    const res = await fetch(cfg.base + path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(auth ? { Authorization: `Bearer ${cfg.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* not JSON */
    }
    return { status: res.status, json, location: res.headers.get('location') };
  } catch (err) {
    return { status: 0, json: null, error: err?.name === 'TimeoutError' ? 'timed out' : 'unreachable' };
  }
}

const isRedirect = (r) => r.status >= 300 && r.status < 400;

/** What a failed token request means, in words that say what to do. */
function explain(r, migration) {
  if (r.status === 0) return [`IcyOS ${r.error === 'timed out' ? 'took too long to answer' : "couldn't be reached"}`, 'Check ICYOS_URL and that the app is deployed.'];
  if (r.status === 401) return ['IcyOS turned the token down', 'It may be revoked or expired: create a new one under Settings → Personal access tokens.'];
  if (r.status === 402) return ["The account's trial or subscription has ended", 'Renew it under Billing, or set BILLING_ENFORCEMENT=off on the server while testing.'];
  if (r.status === 503) return ['Access tokens are switched off on the server', 'Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_JWT_SECRET on the IcyOS server and redeploy.'];
  if (r.status === 429) return ['IcyOS asked us to slow down', 'Wait a minute and run this again.'];
  if (isRedirect(r)) return ["IcyOS didn't accept a token for this", 'The deployed IcyOS may be older than this check: deploy the latest version.'];
  if (r.status >= 500) return [`IcyOS failed (error ${r.status})`, migration ? `Most likely ${migration} hasn't been applied in Supabase. Apply it, then run this again.` : 'Check the server logs.'];
  return [`IcyOS answered with error ${r.status}${r.json?.error?.message ? `: ${r.json.error.message}` : ''}`, 'Check the server logs.'];
}

function pad(n) {
  return String(n).padStart(2, '0');
}

async function main() {
  const cfg = config();
  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  console.log(`Checking ${cfg.base} …\n`);

  // 1. The app is up.
  const health = await call(cfg, 'GET', '/api/health', { auth: false });
  if (health.status === 200 && health.json?.data?.status === 'ok') ok('App is up', 'the health check answers');
  else if (isRedirect(health)) warn('App is up', 'the health check needs a sign-in, so this IcyOS is older than the launch kit', 'Deploy the latest version so uptime monitors can use /api/health.');
  else {
    fail('App is up', explain(health)[0], 'Check ICYOS_URL and that the deploy finished.');
    return;
  }

  // 2. Signed-out requests are turned away.
  const anon = await call(cfg, 'GET', '/api/workspace', { auth: false });
  if (isRedirect(anon) || anon.status === 401) ok('Sign-in required', 'signed-out requests are turned away');
  else if (anon.status === 200) fail('Sign-in required', 'the workspace answered WITHOUT signing in', 'Stop and check the deploy: the middleware is not running (it must be at apps/web/src/middleware.ts).');
  else warn('Sign-in required', `signed-out requests got error ${anon.status}`, 'Expected a redirect to /login. Check the server logs.');

  // 3. The token works, and the workspace loads (migrations 15–24).
  const ws = await call(cfg, 'GET', '/api/workspace');
  if (ws.status !== 200 || !ws.json?.success) {
    const [why, fix] = explain(ws, 'one of migrations 15–24');
    fail('Token and workspace', why, fix);
    return;
  }
  const overview = ws.json.data;
  if (!overview.workspace) {
    warn('Token and workspace', 'the token works, but this account has no workspace yet', 'Sign in to IcyOS once and finish the setup screen.');
  } else {
    const t = overview.totals;
    ok('Token and workspace', `"${overview.workspace.name}": ${t.projects} projects, ${t.missions} missions`);
  }

  // 4. A token can't reach account settings.
  const tokens = await call(cfg, 'GET', '/api/tokens');
  if (tokens.status === 200) fail('Token limits', 'a token can list access tokens', 'Stop and check the deploy: tokens must only reach the work routes (src/lib/auth/token-routes.ts).');
  else ok('Token limits', "a token can't reach token management or settings");

  // 5. Each part of the app, and the migration it needs.
  const parts = [
    ['Timeline', `/api/timeline?date=${today}`, 'migration 25 (25_day_planning.sql)'],
    ['Focus', `/api/focus?date=${today}`, 'migration 25 (25_day_planning.sql)'],
    ['Review', `/api/review?date=${today}&start=${encodeURIComponent(dayStart.toISOString())}&end=${encodeURIComponent(dayEnd.toISOString())}`, 'migration 25 (25_day_planning.sql)'],
    ['Knowledge notes', '/api/knowledge', 'migration 26 (26_knowledge_notes.sql)'],
  ];
  for (const [name, path, migration] of parts) {
    const r = await call(cfg, 'GET', path);
    if (r.status === 200 && r.json?.success) ok(name, 'loads');
    else fail(name, ...explain(r, migration));
  }

  // 6. The planner proposes (saves nothing).
  const start = new Date(Math.ceil(now.getTime() / 300_000) * 300_000);
  const end = new Date(start.getTime() + 4 * 3_600_000);
  const plan = await call(cfg, 'POST', '/api/timeline/propose', { body: { date: today, start: start.toISOString(), end: end.toISOString() } });
  if (plan.status === 200 && plan.json?.success) ok('Day planner', `proposes plans (${plan.json.data.blocks.length} blocks for the next 4 hours; nothing saved)`);
  else fail('Day planner', ...explain(plan, 'migration 25 (25_day_planning.sql)'));

  // 7. Brain-dump sorting (saves nothing).
  if (skipAi) {
    warn('Brain-dump sorting', 'skipped (--skip-ai)');
  } else {
    const sort = await call(cfg, 'POST', '/api/inbox/sort', { body: { text: 'Email the printer about the posters (30 min)' } });
    if (sort.status === 200 && sort.json?.success) {
      if (sort.json.data.source === 'claude') ok('Brain-dump sorting', 'Claude sorts the Inbox (ANTHROPIC_API_KEY works)');
      else warn('Brain-dump sorting', 'works, using simple rules', 'Optional: set ANTHROPIC_API_KEY on the IcyOS server for Claude sorting. If it is set, check the server logs for why it fell back.');
    } else {
      fail('Brain-dump sorting', ...explain(sort, 'migration 24 (24_inbox.sql)'));
    }
  }
}

await main();

const icon = { ok: '✓', warn: '!', fail: '✗' };
for (const r of results) {
  console.log(`${icon[r.level]} ${r.name}: ${r.detail}`);
  if (r.fix) console.log(`    → ${r.fix}`);
}
const failed = results.filter((r) => r.level === 'fail').length;
const warned = results.filter((r) => r.level === 'warn').length;
console.log(
  failed
    ? `\n${failed} problem${failed === 1 ? '' : 's'} to fix${warned ? `, ${warned} note${warned === 1 ? '' : 's'}` : ''}.`
    : `\nReady${warned ? `, with ${warned} note${warned === 1 ? '' : 's'}` : ''}. Next: connect P.J.K. (see LAUNCH.md, step 6).`
);
process.exit(failed ? 1 : 0);
