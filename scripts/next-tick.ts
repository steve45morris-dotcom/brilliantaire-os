import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseActionItems, setActionDone } from '../config/next-actions.js';

/**
 * Ticks or reopens one NEXT_ACTIONS.md item, named by its key.
 *
 *   npm run command -- next-tick <key>     tick it
 *   npm run command -- next-reopen <key>   untick it
 *   npm run command -- next-tick           list open items with their keys
 *
 * P.J.K. stages `next-tick <key>` for the Commander's approval when he says
 * "mark <item> done in brilliantaire". See config/next-actions.ts.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = process.env.NEXT_ACTIONS_FILE ?? path.join(root, 'NEXT_ACTIONS.md');

const [mode, key] = process.argv.slice(2);
if (mode !== 'tick' && mode !== 'reopen') {
  console.error('Usage: next-tick.ts tick|reopen [key]');
  process.exit(2);
}
const done = mode === 'tick';

let md: string;
try { md = fs.readFileSync(file, 'utf8'); }
catch { console.error(`❌ ${file} not found.`); process.exit(1); }

if (!key) {
  const items = parseActionItems(md).filter((i) => i.done !== done);
  console.log(done ? 'Open items (tick one with: npm run command -- next-tick <key>):' : 'Ticked items (reopen one with: npm run command -- next-reopen <key>):');
  for (const i of items) console.log(`  ${i.key}  ${i.text}`);
  if (!items.length) console.log('  (none)');
  process.exit(0);
}

const r = setActionDone(md, key, done);
if (!r.ok) {
  // Already ticked (by hand, since it was staged) is the state that was asked for, not a failure.
  if (r.reason === 'already') { console.log(`ℹ️ ${r.message}`); process.exit(0); }
  console.error(`❌ ${r.message}`);
  process.exit(1);
}

// Write beside the file and rename over it, so a crash never leaves it half-written.
const tmp = `${file}.${process.pid}.tmp`;
fs.writeFileSync(tmp, r.md, 'utf8');
fs.renameSync(tmp, file);
console.log(`✅ ${done ? 'Ticked' : 'Reopened'}: ${r.items[0].text}${r.items.length > 1 ? ` (${r.items.length} copies)` : ''}`);
