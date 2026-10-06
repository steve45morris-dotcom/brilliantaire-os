// Tests for the Episode 1 human sign-off rules.
//
// The property that matters: an asset reaches APPROVED if and only if it passed
// the technical probe and every human review that applies to it. Both directions
// are asserted across every combination of scores, not a sample.

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  applySignoff,
  parseSignoffArgs,
  pendingReviews,
  reconcileIdentityRequirement,
  resolveSignoffState,
  slotsMissingIdentityFlag,
  type ReviewScore,
  type SignoffSubject
} from './asset-signoff.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

describe('slotsMissingIdentityFlag', () => {
  it('names every slot without a boolean flag, and only those', () => {
    expect(
      slotsMissingIdentityFlag([
        { id: 'A', requires_identity: true },
        { id: 'B', requires_identity: false },
        { id: 'C' },
        { id: 'D', requires_identity: 'yes' }
      ])
    ).toEqual(['C', 'D']);
  });

  it('passes the real production manifest, which flags exactly the character frames', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../config/episode_1_production_manifest.json'), 'utf-8')
    );
    expect(slotsMissingIdentityFlag(manifest.assets)).toEqual([]);
    const flagged = manifest.assets.filter((a: any) => a.requires_identity).map((a: any) => a.id).sort();
    expect(flagged).toEqual(
      ['COV-01', 'COV-02', 'COV-03', 'COV-05', 'IMG-01', 'IMG-02', 'IMG-06', 'VID-01', 'VID-06', 'VID-08']
    );
  });
});

describe('reconcileIdentityRequirement', () => {
  it('drops an identity review a slot no longer needs, and approves if creative passed', () => {
    for (const identityScore of ['PENDING', 'PASS'] as const) {
      const out = reconcileIdentityRequirement(subject({ identityScore, creativeScore: 'PASS' }), false);
      expect(out, identityScore).toEqual({ changed: true, identityScore: 'N/A', approvalState: 'APPROVED' });
    }
  });

  it('owes an identity review again when a slot starts needing one, and withdraws approval', () => {
    const out = reconcileIdentityRequirement(
      subject({ identityScore: 'N/A', creativeScore: 'PASS', approvalState: 'APPROVED' }),
      true
    );
    expect(out).toEqual({ changed: true, identityScore: 'PENDING', approvalState: 'TECHNICALLY_VERIFIED' });
  });

  it('keeps FAIL, which validate also records for a file that failed its checks', () => {
    for (const required of [true, false]) {
      const out = reconcileIdentityRequirement(subject({ identityScore: 'FAIL', approvalState: 'REJECTED' }), required);
      expect(out.changed, String(required)).toBe(false);
    }
  });

  it('never revives a STALE asset or one that failed its technical check', () => {
    const stale = reconcileIdentityRequirement(
      subject({ identityScore: 'PENDING', creativeScore: 'PASS', approvalState: 'STALE' }),
      false
    );
    expect(stale.approvalState).toBe('STALE');
    const failed = reconcileIdentityRequirement(
      subject({ identityScore: 'PENDING', creativeScore: 'PASS', technicalScore: 'FAIL', approvalState: 'REJECTED' }),
      false
    );
    expect(failed.approvalState).toBe('REJECTED');
  });

  it('changes nothing when the record already agrees with the flag', () => {
    const scores: ReviewScore[] = ['PASS', 'FAIL', 'N/A', 'PENDING'];
    for (const identityScore of scores) {
      for (const required of [true, false]) {
        const s = subject({ identityScore });
        const out = reconcileIdentityRequirement(s, required);
        const agrees = required ? identityScore !== 'N/A' : identityScore === 'N/A' || identityScore === 'FAIL';
        expect(out.changed, `${identityScore}/${required}`).toBe(!agrees);
        if (agrees) expect(out).toEqual({ changed: false, identityScore, approvalState: s.approvalState });
      }
    }
  });
});
