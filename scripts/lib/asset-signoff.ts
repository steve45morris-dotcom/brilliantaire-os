// Human sign-off for Episode 1 render intake v2.
//
// The pipeline carries an asset as far as TECHNICALLY_VERIFIED and no further:
// whether a face matches icyflamze_reference_MASTER.jpeg, and whether a frame
// fits the IP bible's visual language, are human judgements. This module decides
// what one recorded judgement does to an asset. It is pure so every rule can be
// tested; the v2 script does the file I/O.
//
// A sign-off is bound to the exact bytes that were reviewed. It is refused when
// the file on disk no longer matches the hash validate recorded, and editing the
// file afterwards resets the asset (validate's mutation path drops the sign-offs).

export type Review = 'identity' | 'creative';
export type Verdict = 'PASS' | 'FAIL';

export type ReviewScore = 'PASS' | 'FAIL' | 'N/A' | 'PENDING';

export interface SignoffRecord {
  verdict: Verdict;
  reviewer: string;
  timestamp: string;
  sha256: string;
  note: string;
}

/** The fields of a provenance entry that a sign-off reads or changes. */
export interface SignoffSubject {
  sha256: string;
  approvalState: string;
  identityScore: ReviewScore;
  technicalScore: 'PASS' | 'FAIL' | 'PENDING';
  creativeScore: 'PASS' | 'FAIL' | 'PENDING';
}

export type SignoffOutcome =
  | {
      ok: true;
      identityScore: ReviewScore;
      creativeScore: 'PASS' | 'FAIL' | 'PENDING';
      approvalState: 'APPROVED' | 'REJECTED' | 'TECHNICALLY_VERIFIED';
    }
  | { ok: false; reason: string };

export interface SignoffRequest {
  slotId: string;
  review: Review;
  verdict: Verdict;
  note: string;
}

export const SIGNOFF_USAGE =
  'signoff <SLOT> identity|creative pass|fail [note]   e.g. signoff IMG-01 identity pass';

/**
 * Parse `signoff` arguments. The command router splits quoted text on spaces,
 * so the note arrives as separate words and is joined back here.
 */
export function parseSignoffArgs(args: string[]): SignoffRequest | { error: string } {
  const [slotRaw, reviewRaw, verdictRaw, ...noteWords] = args;
  if (!slotRaw || !reviewRaw || !verdictRaw) {
    return { error: `Usage: ${SIGNOFF_USAGE}` };
  }

  const review = reviewRaw.toLowerCase();
  if (review !== 'identity' && review !== 'creative') {
    return { error: `Review must be "identity" or "creative", got "${reviewRaw}". Usage: ${SIGNOFF_USAGE}` };
  }

  const verdict = verdictRaw.toUpperCase();
  if (verdict !== 'PASS' && verdict !== 'FAIL') {
    return { error: `Verdict must be "pass" or "fail", got "${verdictRaw}". Usage: ${SIGNOFF_USAGE}` };
  }

  const note = noteWords.join(' ').trim();
  if (verdict === 'FAIL' && note === '') {
    return { error: 'A fail needs a note saying what to fix, e.g. signoff IMG-01 identity fail glasses changed shape' };
  }

  return { slotId: slotRaw.toUpperCase(), review, verdict, note };
}

/**
 * The state an asset holds given its three scores. Any failed human review
 * rejects; approval needs technical PASS, identity PASS or N/A, and creative PASS.
 */
export function resolveSignoffState(
  technical: SignoffSubject['technicalScore'],
  identity: ReviewScore,
  creative: SignoffSubject['creativeScore']
): 'APPROVED' | 'REJECTED' | 'TECHNICALLY_VERIFIED' {
  if (identity === 'FAIL' || creative === 'FAIL') return 'REJECTED';
  if (technical === 'PASS' && (identity === 'PASS' || identity === 'N/A') && creative === 'PASS') {
    return 'APPROVED';
  }
  return 'TECHNICALLY_VERIFIED';
}

/**
 * Apply one human verdict to an asset. `currentSha256` is the hash of the file
 * in the intake folder right now, or null when no file is staged for the slot.
 */
export function applySignoff(
  subject: SignoffSubject | undefined,
  review: Review,
  verdict: Verdict,
  currentSha256: string | null
): SignoffOutcome {
  if (!subject) {
    return { ok: false, reason: 'No validation record for this slot. Place the file and run validate first.' };
  }
  if (currentSha256 === null) {
    return { ok: false, reason: 'No file is staged for this slot in the intake folder.' };
  }
  if (currentSha256 !== subject.sha256) {
    return {
      ok: false,
      reason: 'The file changed since validate last checked it. Run validate, look at the new file, then sign off.'
    };
  }
  if (subject.approvalState === 'STALE') {
    return { ok: false, reason: 'The asset is STALE because a parent changed. Resolve its recovery job first.' };
  }
  if (subject.technicalScore !== 'PASS') {
    return {
      ok: false,
      reason: `Technical check is ${subject.technicalScore}, not PASS. Fix the file and run validate before review.`
    };
  }
  if (review === 'identity' && subject.identityScore === 'N/A') {
    return { ok: false, reason: 'This slot shows no character, so identity review does not apply. Sign off creative only.' };
  }

  const identityScore: ReviewScore = review === 'identity' ? verdict : subject.identityScore;
  const creativeScore = review === 'creative' ? verdict : subject.creativeScore;

  return {
    ok: true,
    identityScore,
    creativeScore,
    approvalState: resolveSignoffState(subject.technicalScore, identityScore, creativeScore)
  };
}

/** Which human reviews an asset is still waiting on. Empty when none apply or all are recorded. */
export function pendingReviews(subject: SignoffSubject): Review[] {
  if (subject.technicalScore !== 'PASS' || subject.approvalState === 'STALE') return [];
  const pending: Review[] = [];
  if (subject.identityScore === 'PENDING') pending.push('identity');
  if (subject.creativeScore === 'PENDING') pending.push('creative');
  return pending;
}
