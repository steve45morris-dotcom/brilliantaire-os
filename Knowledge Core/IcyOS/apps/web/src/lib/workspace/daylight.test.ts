import { describe, expect, it } from 'vitest';
import type { MissionStatus } from '@icyos/shared';
import type { MissionView, ProjectView } from './overview';
import { featuredMission, greeting, statusCounts, upNext, weekDays } from './daylight';

const mission = (id: string, status: MissionStatus, done = 0, total = 0): MissionView => ({
  id,
  name: `Mission ${id}`,
  status,
  sprintName: 'Sprint 1',
  estimatedMinutes: null,
  steps: Array.from({ length: total }, (_, i) => ({ id: `${id}-s${i}`, command: `Step ${i}`, completedAt: i < done ? '2026-10-16T00:00:00Z' : null })),
  stepsDone: done,
});

const project = (id: string, missions: MissionView[]): ProjectView => ({ id, name: `Project ${id}`, priority: 'P2', missions });

describe('featuredMission', () => {
  it('prefers the first Running mission, then Approved, then Staged, in source order', () => {
    const p = project('a', [mission('1', 'Staged'), mission('2', 'Approved'), mission('3', 'Running'), mission('4', 'Running')]);
    expect(featuredMission(p)?.id).toBe('3');
    expect(featuredMission(project('b', [mission('1', 'Staged'), mission('2', 'Approved')]))?.id).toBe('2');
    expect(featuredMission(project('c', [mission('1', 'Completed'), mission('2', 'Staged')]))?.id).toBe('2');
  });

  it('returns null when nothing in the project is active', () => {
    expect(featuredMission(project('d', [mission('1', 'Completed'), mission('2', 'Failed'), mission('3', 'Skipped')]))).toBeNull();
    expect(featuredMission(null)).toBeNull();
  });
});

describe('statusCounts', () => {
  it('counts Completed explicitly, never as total minus active', () => {
    const counts = statusCounts([
      project('a', [mission('1', 'Staged'), mission('2', 'Running')]),
      project('b', [mission('3', 'Completed'), mission('4', 'Failed'), mission('5', 'Skipped')]),
    ]);
    expect(counts).toEqual({ Staged: 1, Approved: 0, Running: 1, Completed: 1, Failed: 1, Skipped: 1 });
  });
});

describe('upNext', () => {
  const projects = [
    project('a', [mission('1', 'Staged'), mission('2', 'Running')]),
    project('b', [mission('3', 'Completed'), mission('4', 'Failed')]),
  ];

  it('lists every other mission across projects, skipping the featured one', () => {
    expect(upNext(projects, '1', 'all').map((r) => r.mission.id)).toEqual(['2', '3', '4']);
    expect(upNext(projects, '1', 'all')[1].project.id).toBe('b');
  });

  it('filters active and completed without counting failed as completed', () => {
    expect(upNext(projects, '1', 'active').map((r) => r.mission.id)).toEqual(['2']);
    expect(upNext(projects, '1', 'completed').map((r) => r.mission.id)).toEqual(['3']);
  });
});

describe('weekDays', () => {
  it('returns Monday to Sunday of the current week and marks today', () => {
    const days = weekDays(new Date(2026, 9, 17, 9, 0)); // Saturday 17 October 2026, local time
    expect(days.map((d) => d.day)).toEqual([12, 13, 14, 15, 16, 17, 18]);
    expect(days.map((d) => d.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(days.filter((d) => d.isToday).map((d) => d.day)).toEqual([17]);
  });

  it('treats Sunday as the end of the week', () => {
    const days = weekDays(new Date(2026, 9, 18, 9, 0));
    expect(days[0].day).toBe(12);
    expect(days[6].isToday).toBe(true);
  });
});

describe('greeting', () => {
  it('follows the local hour', () => {
    expect(greeting(7)).toBe('Good morning');
    expect(greeting(13)).toBe('Good afternoon');
    expect(greeting(19)).toBe('Good evening');
    expect(greeting(2)).toBe('Good evening');
  });
});
