import { createHash } from 'node:crypto';

/**
 * NEXT_ACTIONS.md as a checklist that can be ticked one item at a time.
 *
 * Items are named by a key: the first 8 hex digits of the SHA-256 of the
 * item's text (bold markers removed, whitespace collapsed). A key names the
 * text, not a position, so an item that was reworded or removed since the
 * key was read cannot be ticked by mistake.
 *
 * P.J.K. (sentinel-os, lib/pjk-brilliantaire.ts) computes the same key from
 * the same text and stages `next-tick <key>` through the Safe Command Router.
 * config/commands.contract.test.ts pins the algorithm with a known value on
 * both sides; change it in both repos or neither.
 *
 * Only items under "## Do Now" and "## Do Next" count, the same sections P.J.K.
 * and `npm run next` read. Everything else in the file is left byte-for-byte.
 */

export type ActionBucket = 'doNow' | 'doNext';

export interface ActionItem {
  /** 0-based line index in the file. */
  line: number;
  bucket: ActionBucket;
  done: boolean;
  text: string;
  key: string;
}

/** The text an item is keyed on: bold markers removed, whitespace collapsed. */
export function actionText(raw: string): string {
  return raw.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

/** The key for an item's text. */
export function actionKey(raw: string): string {
  return createHash('sha256').update(actionText(raw), 'utf8').digest('hex').slice(0, 8);
}

const ITEM = /^\s*-\s*\[([ xX])\]\s*(.+?)\s*$/;

/** Every checklist item under Do Now / Do Next, ticked or not, in file order. */
export function parseActionItems(md: string): ActionItem[] {
  const out: ActionItem[] = [];
  let bucket: ActionBucket | null = null;
  md.split('\n').forEach((raw, line) => {
    const t = raw.replace(/\r$/, '').trim();
    if (t.startsWith('## ')) {
      const h = t.slice(3).trim().toLowerCase();
      bucket = h === 'do now' ? 'doNow' : h === 'do next' ? 'doNext' : null;
      return;
    }
    if (!bucket) return;
    const m = raw.replace(/\r$/, '').match(ITEM);
    if (m) out.push({ line, bucket, done: m[1] !== ' ', text: actionText(m[2]), key: actionKey(m[2]) });
  });
  return out;
}

export type SetDoneResult =
  | { ok: true; md: string; items: ActionItem[] }
  | { ok: false; reason: 'bad-key' | 'not-found' | 'already' | 'ambiguous'; message: string };

const KEY = /^[0-9a-f]{8}$/;

/**
 * Ticks (done = true) or reopens (done = false) the item with this key.
 * Every unticked copy of the same text is ticked together, since it is the
 * same task listed twice. Two different texts sharing a key is refused.
 */
export function setActionDone(md: string, key: string, done: boolean): SetDoneResult {
  const k = key.trim().toLowerCase();
  if (!KEY.test(k)) return { ok: false, reason: 'bad-key', message: `"${key}" is not an item key (8 hex digits). Run next-tick with no key to list them.` };
  const all = parseActionItems(md).filter((i) => i.key === k);
  if (!all.length) return { ok: false, reason: 'not-found', message: `No Do Now or Do Next item has key ${k}. It may have been reworded or removed.` };
  if (new Set(all.map((i) => i.text)).size > 1) return { ok: false, reason: 'ambiguous', message: `Key ${k} matches more than one item, so nothing was changed.` };
  const todo = all.filter((i) => i.done !== done);
  if (!todo.length) return { ok: false, reason: 'already', message: `"${all[0].text}" is already ${done ? 'ticked' : 'open'}.` };
  const lines = md.split('\n');
  for (const i of todo) lines[i.line] = lines[i.line].replace(/\[[ xX]\]/, done ? '[x]' : '[ ]');
  return { ok: true, md: lines.join('\n'), items: todo };
}
