import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { actionKey, actionText, parseActionItems, setActionDone } from './next-actions';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MD = [
  '# 🎯 Next Actions',
  '',
  '## Do Now',
  '- [x] Done already',
  '- [ ] **Rerun** render intake',
  '',
  '## Schedule',
  '- [ ] Not a do-now item',
  '',
  '## Do Next',
  '- [ ] Review final build prompt',
  '- [ ] Rerun render intake',
  ''
].join('\n');

describe('item keys', () => {
  it('key the text with bold and extra spaces removed, so P.J.K. and the file agree', () => {
    expect(actionText('  **Rerun**   render intake ')).toBe('Rerun render intake');
    expect(actionKey('**Rerun** render intake')).toBe(actionKey('Rerun render intake'));
    expect(actionKey('Rerun render intake')).toMatch(/^[0-9a-f]{8}$/);
    expect(actionKey('Rerun render intake')).not.toBe(actionKey('Rerun render intake twice'));
  });
});

describe('parseActionItems', () => {
  it('reads only Do Now and Do Next items, ticked and open, in file order', () => {
    const items = parseActionItems(MD);
    expect(items.map((i) => [i.bucket, i.done, i.text])).toEqual([
      ['doNow', true, 'Done already'],
      ['doNow', false, 'Rerun render intake'],
      ['doNext', false, 'Review final build prompt'],
      ['doNext', false, 'Rerun render intake']
    ]);
    expect(items[1].line).toBe(4);
  });
});

describe('setActionDone', () => {
  const key = actionKey('Review final build prompt');

  it('ticks exactly one line and leaves every other byte alone', () => {
    const r = setActionDone(MD, key, true);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const before = MD.split('\n'), after = r.md.split('\n');
    expect(after.length).toBe(before.length);
    const changed = after.map((l, i) => (l === before[i] ? -1 : i)).filter((i) => i >= 0);
    expect(changed).toEqual([10]);
    expect(after[10]).toBe('- [x] Review final build prompt');
  });

  it('reopens a ticked item, and the round trip restores the file', () => {
    const t = setActionDone(MD, key, true);
    if (!t.ok) throw new Error(t.message);
    const back = setActionDone(t.md, key, false);
    expect(back.ok && back.md).toBe(MD);
  });

  it('ticks both copies of a task listed twice', () => {
    const r = setActionDone(MD, actionKey('Rerun render intake'), true);
    expect(r.ok && r.items.map((i) => i.line)).toEqual([4, 11]);
  });

  it('keeps Windows line endings', () => {
    const crlf = MD.replace(/\n/g, '\r\n');
    const r = setActionDone(crlf, key, true);
    expect(r.ok && r.md).toBe(crlf.replace('- [ ] Review final build prompt', '- [x] Review final build prompt'));
  });

  it('refuses a bad key, an unknown key, an item outside Do Now/Do Next, and a no-op', () => {
    expect(setActionDone(MD, 'xyz', true)).toMatchObject({ ok: false, reason: 'bad-key' });
    expect(setActionDone(MD, actionKey('Reworded since it was read'), true)).toMatchObject({ ok: false, reason: 'not-found' });
    expect(setActionDone(MD, actionKey('Not a do-now item'), true)).toMatchObject({ ok: false, reason: 'not-found' });
    expect(setActionDone(MD, actionKey('Done already'), true)).toMatchObject({ ok: false, reason: 'already' });
    expect(setActionDone(MD, actionKey('Review final build prompt'), false)).toMatchObject({ ok: false, reason: 'already' });
  });

  it('accepts an upper-case key', () => {
    expect(setActionDone(MD, key.toUpperCase(), true).ok).toBe(true);
  });
});

describe('next-tick script', () => {
  const run = (file: string, ...args: string[]) => {
    try {
      return { code: 0, out: execFileSync('npx', ['tsx', 'scripts/next-tick.ts', ...args], { cwd: root, env: { ...process.env, NEXT_ACTIONS_FILE: file }, encoding: 'utf8', stdio: 'pipe' }) };
    } catch (e) {
      const err = e as { status: number; stdout: string; stderr: string };
      return { code: err.status, out: `${err.stdout}${err.stderr}` };
    }
  };

  it('lists keys, ticks the file in place, reopens it, and refuses an unknown key', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'next-tick-'));
    const file = path.join(dir, 'NEXT_ACTIONS.md');
    fs.writeFileSync(file, MD);
    const key = actionKey('Review final build prompt');

    const list = run(file, 'tick');
    expect(list.code).toBe(0);
    expect(list.out).toContain(`${key}  Review final build prompt`);
    expect(list.out).not.toContain('Done already');

    expect(run(file, 'tick', key)).toMatchObject({ code: 0 });
    expect(fs.readFileSync(file, 'utf8')).toContain('- [x] Review final build prompt');
    expect(fs.readdirSync(dir)).toEqual(['NEXT_ACTIONS.md']);

    expect(run(file, 'reopen', key)).toMatchObject({ code: 0 });
    expect(fs.readFileSync(file, 'utf8')).toBe(MD);

    expect(run(file, 'reopen', key)).toMatchObject({ code: 0, out: expect.stringContaining('is already open') });

    const missing = run(file, 'tick', 'deadbeef');
    expect(missing.code).toBe(1);
    expect(fs.readFileSync(file, 'utf8')).toBe(MD);
  }, 30_000);
});
