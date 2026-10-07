import { MAX_PROPOSED, type ProposedMission } from './types';

// The rule-based brain-dump sorter: used when no AI key is set, or when Claude
// can't answer. Pure, so it is tested directly.
//
// One mission per line, bullet or sentence. "Thing: a, b and c" becomes a
// mission with steps. "30 min", "2h", "an hour" become the estimate. A
// mission that names an existing project (as whole words) is put in it.

export interface ProjectRef {
  id: string;
  name: string;
}

const LEAD = /^(?:(?:and|also|then|plus|oh|ok|okay|so|but)\b[,\s]*)+/i;
const FILLER = /^(?:i\s+(?:really\s+)?(?:need|have|got|want|ought)\s+to|i\s+must|i\s+should|need\s+to|have\s+to|got\s+to|gotta|must|should|remember\s+to|don'?t\s+forget\s+to|todo[:\s]|to-do[:\s]|to\s+do[:\s])\s*/i;
/** Venting, not a task: "ugh", "so much to do", "I'm so tired". */
const NOT_A_TASK = /^(?:ugh+|argh+|omg|wow|hmm+|phew|so much to do|too much to do|i'?m (?:so |really )?(?:tired|stressed|overwhelmed|behind)|feeling\b|i feel\b)/i;
const BULLET = /^\s*(?:[-*•–—>]+|\d{1,2}[.)]|\[[ xX]?\])\s*/;

function duration(text: string): { minutes: number | null; rest: string } {
  // "(30 min)", "for 2h", ", it takes about 2 hours", "half an hour".
  const lead = String.raw`(?:,?\s*(?:(?:it|that|this)\s+)?(?:takes?|will\s+take|'ll\s+take|should\s+take)\s+)?(?:for\s+)?(?:about|around|roughly|~)?\s*`;
  const patterns: [RegExp, (m: RegExpMatchArray) => number][] = [
    [new RegExp(`${lead}\\b(\\d+(?:\\.\\d+)?)\\s*(?:h|hr|hrs|hours?)\\b`, 'i'), (m) => Math.round(Number(m[1]) * 60)],
    [new RegExp(`${lead}\\b(\\d+)\\s*(?:m|min|mins|minutes?)\\b`, 'i'), (m) => Number(m[1])],
    [new RegExp(`${lead}\\bhalf\\s+an?\\s+hour\\b`, 'i'), () => 30],
    [new RegExp(`${lead}\\b(?:an|one)\\s+hour\\b`, 'i'), () => 60],
  ];
  for (const [re, toMinutes] of patterns) {
    const m = text.match(re);
    if (m) {
      const minutes = toMinutes(m);
      if (minutes >= 1 && minutes <= 1440) {
        return { minutes, rest: text.replace(re, ' ').replace(/\(\s*\)/g, ' ') };
      }
    }
  }
  return { minutes: null, rest: text };
}

const tidy = (s: string) =>
  s.replace(/\s+/g, ' ').replace(/^[\s,;:.\-–—]+|[\s,;:\-–—]+$/g, '').replace(/[.!?]+$/, '').trim();

const capitalise = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "a, b and c" → ["a", "b", "c"]. */
function list(s: string): string[] {
  return s.split(/\s*(?:;|,\s*(?:and\s+)?|\s+and\s+)\s*/i).map(tidy).filter((x) => x.length > 1);
}

function chunks(text: string): string[] {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.replace(BULLET, '').trim()).filter(Boolean);
  // A single paragraph: split it into sentences and "then"/"also" clauses.
  const parts = lines.length > 1 ? lines : lines.flatMap((l) => l.split(/(?<=[.!?])\s+|;\s*|\s+(?:and\s+)?then\s+|\s+also\s+/i));
  return parts.map((p) => p.trim()).filter(Boolean);
}

function projectFor(text: string, projects: ProjectRef[]): string | null {
  const words = (s: string) => ` ${s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
  const said = words(text);
  const hits = projects.filter((p) => words(p.name).trim().length > 1 && said.includes(words(p.name)));
  // "Launch" inside "Launch the new website" is the same mention; two separate projects are a guess, so neither.
  const outer = hits.filter((h) => !hits.some((o) => o !== h && words(o.name).includes(words(h.name)) && o.name.length > h.name.length));
  return outer.length === 1 ? outer[0].id : null;
}

export function sortByRules(text: string, projects: ProjectRef[]): ProposedMission[] {
  const out: ProposedMission[] = [];
  for (const raw of chunks(text)) {
    const { minutes, rest } = duration(raw);
    if (NOT_A_TASK.test(raw.trim())) continue;
    let body = tidy(tidy(rest).replace(LEAD, '').replace(FILLER, '').replace(LEAD, ''));
    let steps: string[] = [];
    const withSteps = body.match(/^(.{2,120}?):\s*(.+)$/);
    if (withSteps && list(withSteps[2]).length > 1) {
      body = tidy(withSteps[1]);
      steps = list(withSteps[2]).map((s) => capitalise(s).slice(0, 512)).slice(0, 50);
    }
    if (body.length < 2 || !/[\p{L}\p{N}]/u.test(body)) continue;
    out.push({
      name: capitalise(body).slice(0, 255),
      steps,
      projectId: projectFor(raw, projects),
      estimatedMinutes: minutes,
    });
    if (out.length >= MAX_PROPOSED) break;
  }
  return out;
}
