import { describe, expect, it } from 'vitest';
import { assignUnassigned, formatMinutes, itemCount, minutesOf, plannedMinutes, stepsOf } from './review';

describe('minutesOf', () => {
  it('accepts whole minutes from 1 to 1440 and treats blank as null', () => {
    expect(minutesOf('30')).toBe(30);
    expect(minutesOf('1440')).toBe(1440);
    expect(minutesOf('  ')).toBeNull();
  });

  it('rejects anything else as NaN', () => {
    for (const bad of ['0', '1441', '1.5', '-3', 'ten']) expect(minutesOf(bad)).toBeNaN();
  });
});

describe('stepsOf', () => {
  it('keeps non-blank lines, trimmed', () => {
    expect(stepsOf(' a \n\n b\n')).toEqual(['a', 'b']);
  });
});

describe('itemCount', () => {
  it('counts lines with content and ignores list markers on their own', () => {
    expect(itemCount('- email the printer\n\n* podcast\n1. gym\n-\n  •  ')).toBe(3);
    expect(itemCount('')).toBe(0);
  });
});

describe('plannedMinutes and formatMinutes', () => {
  it('sums only valid estimates', () => {
    expect(plannedMinutes(['30', '', 'abc', '90', '0'])).toBe(120);
    expect(plannedMinutes([])).toBe(0);
  });

  it('formats minutes and hours', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(60)).toBe('1 h');
    expect(formatMinutes(150)).toBe('2 h 30 min');
    expect(formatMinutes(0)).toBe('0 min');
  });
});

describe('assignUnassigned', () => {
  it('fills only kept missions without a project, in both directions', () => {
    const drafts = [
      { key: 'a', include: true, projectId: '' },
      { key: 'b', include: true, projectId: 'p1' },
      { key: 'c', include: false, projectId: '' },
    ];
    const out = assignUnassigned(drafts, 'p2');
    expect(out.map((d) => d.projectId)).toEqual(['p2', 'p1', '']);
    expect(drafts[0].projectId).toBe('');
  });
});
