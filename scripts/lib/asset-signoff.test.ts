// Tests for the Episode 1 human sign-off rules.
//
// The property that matters: an asset reaches APPROVED if and only if it passed
// the technical probe and every human review that applies to it. Both directions
// are asserted across every combination of scores, not a sample.

import { describe, it, expect } from 'vitest';
import {
  applySignoff,
  parseSignoffArgs,
  pendingReviews,
  resolveSignoffState,
  type ReviewScore,
  type SignoffSubject
} from './asset-signoff.js';

const HASH = 'a'.repeat(64);

function subject(overrides: Partial<SignoffSubject> = {}): SignoffSubject {
  return {
    sha256: HASH,
    approvalState: 'TECHNICALLY_VERIFIED',
    identityScore: 'PENDING',
    technicalScore: 'PASS',
    creativeScore: 'PENDING',
    ...overrides
  };
}

const TECHNICAL: SignoffSubject['technicalScore'][] = ['PASS', 'FAIL', 'PENDING'];
const IDENTITY: ReviewScore[] = ['PASS', 'FAIL', 'N/A', 'PENDING'];
const CREATIVE: SignoffSubject['creativeScore'][] = ['PASS', 'FAIL', 'PENDING'];

describe('resolveSignoffState', () => {
  it('approves exactly when technical passed and every applicable review passed', () => {
    for (const t of TECHNICAL) {
      for (const i of IDENTITY) {
        for (const c of CREATIVE) {
          const shouldApprove = t === 'PASS' && (i === 'PASS' || i === 'N/A') && c === 'PASS';
          expect(resolveSignoffState(t, i, c) === 'APPROVED', `${t}/${i}/${c}`).toBe(shouldApprove);
        }
      }
    }
  });

  it('rejects exactly when a human review failed', () => {
    for (const t of TECHNICAL) {
      for (const i of IDENTITY) {
        for (const c of CREATIVE) {
          const shouldReject = i === 'FAIL' || c === 'FAIL';
          expect(resolveSignoffState(t, i, c) === 'REJECTED', `${t}/${i}/${c}`).toBe(shouldReject);
        }
      }
    }
  });
});

describe('applySignoff', () => {
  it('approves a character frame only after both identity and creative pass', () => {
    const afterIdentity = applySignoff(subject(), 'identity', 'PASS', HASH);
    expect(afterIdentity).toMatchObject({ ok: true, approvalState: 'TECHNICALLY_VERIFIED', identityScore: 'PASS' });

    const afterCreative = applySignoff(
      subject({ identityScore: 'PASS' }),
      'creative',
      'PASS',
      HASH
    );
    expect(afterCreative).toMatchObject({ ok: true, approvalState: 'APPROVED' });
  });

  it('approves a slot with no character on creative alone', () => {
    const out = applySignoff(subject({ identityScore: 'N/A' }), 'creative', 'PASS', HASH);
    expect(out).toMatchObject({ ok: true, approvalState: 'APPROVED', identityScore: 'N/A' });
  });

  it('rejects on a failed review, and a later pass on the same bytes can reverse it', () => {
    const failed = applySignoff(subject(), 'creative', 'FAIL', HASH);
    expect(failed).toMatchObject({ ok: true, approvalState: 'REJECTED', creativeScore: 'FAIL' });

    const reversed = applySignoff(
      subject({ approvalState: 'REJECTED', identityScore: 'PASS', creativeScore: 'FAIL' }),
      'creative',
      'PASS',
      HASH
    );
    expect(reversed).toMatchObject({ ok: true, approvalState: 'APPROVED' });
  });

  it('refuses when the file on disk is not the file that was validated', () => {
    const out = applySignoff(subject({ identityScore: 'PASS' }), 'creative', 'PASS', 'b'.repeat(64));
    expect(out.ok).toBe(false);
  });

  it('refuses when no file is staged or no record exists', () => {
    expect(applySignoff(subject(), 'creative', 'PASS', null).ok).toBe(false);
    expect(applySignoff(undefined, 'creative', 'PASS', HASH).ok).toBe(false);
  });

  it('refuses unless the technical check passed', () => {
    for (const technicalScore of ['FAIL', 'PENDING'] as const) {
      const out = applySignoff(
        subject({ technicalScore, identityScore: 'PASS' }),
        'creative',
        'PASS',
        HASH
      );
      expect(out.ok, technicalScore).toBe(false);
    }
  });

  it('refuses a STALE asset', () => {
    const out = applySignoff(subject({ approvalState: 'STALE', identityScore: 'PASS' }), 'creative', 'PASS', HASH);
    expect(out.ok).toBe(false);
  });

  it('refuses identity review on a slot that shows no character', () => {
    const out = applySignoff(subject({ identityScore: 'N/A' }), 'identity', 'PASS', HASH);
    expect(out.ok).toBe(false);
  });

  it('never approves when any precondition fails, whatever the verdict', () => {
    const blocked: Array<[SignoffSubject | undefined, string | null]> = [
      [undefined, HASH],
      [subject({ identityScore: 'PASS' }), null],
      [subject({ identityScore: 'PASS' }), 'c'.repeat(64)],
      [subject({ identityScore: 'PASS', technicalScore: 'FAIL' }), HASH],
      [subject({ identityScore: 'PASS', approvalState: 'STALE' }), HASH]
    ];
    for (const [s, hash] of blocked) {
      for (const verdict of ['PASS', 'FAIL'] as const) {
        const out = applySignoff(s, 'creative', verdict, hash);
        expect(out.ok).toBe(false);
      }
    }
  });
});

describe('parseSignoffArgs', () => {
  it('parses slot, review and verdict case-insensitively', () => {
    expect(parseSignoffArgs(['img-01', 'Identity', 'pass'])).toEqual({
      slotId: 'IMG-01',
      review: 'identity',
      verdict: 'PASS',
      note: ''
    });
  });

  it('joins a note the router split into words', () => {
    const out = parseSignoffArgs(['IMG-01', 'identity', 'fail', 'glasses', 'lost', 'their', 'frame']);
    expect(out).toMatchObject({ verdict: 'FAIL', note: 'glasses lost their frame' });
  });

  it('requires a note on a fail', () => {
    expect(parseSignoffArgs(['IMG-01', 'creative', 'fail'])).toHaveProperty('error');
  });

  it('rejects missing or unknown arguments', () => {
    expect(parseSignoffArgs([])).toHaveProperty('error');
    expect(parseSignoffArgs(['IMG-01', 'identity'])).toHaveProperty('error');
    expect(parseSignoffArgs(['IMG-01', 'technical', 'pass'])).toHaveProperty('error');
    expect(parseSignoffArgs(['IMG-01', 'identity', 'approve'])).toHaveProperty('error');
  });
});

describe('pendingReviews', () => {
  it('lists the reviews still owed', () => {
    expect(pendingReviews(subject())).toEqual(['identity', 'creative']);
    expect(pendingReviews(subject({ identityScore: 'N/A' }))).toEqual(['creative']);
    expect(pendingReviews(subject({ identityScore: 'PASS', creativeScore: 'PASS' }))).toEqual([]);
  });

  it('owes nothing on an asset that has not passed the technical check or is STALE', () => {
    expect(pendingReviews(subject({ technicalScore: 'FAIL' }))).toEqual([]);
    expect(pendingReviews(subject({ approvalState: 'STALE' }))).toEqual([]);
  });
});
