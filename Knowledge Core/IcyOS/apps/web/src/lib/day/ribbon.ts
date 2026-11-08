import type { PlanBlock } from './types';

export interface RibbonSegment {
  block: PlanBlock;
  /** Left edge and width, as percentages of the plan's span. */
  left: number;
  width: number;
}

export interface PlanSummary {
  missions: number;
  focusMinutes: number;
  spanMinutes: number;
  /** Where `now` sits across the span, 0–100, or null when outside it. */
  nowAt: number | null;
  /** Index of the block running at `now`, or -1. */
  current: number;
}

const minutes = (b: PlanBlock) => Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60_000);

/** Lays the blocks out across the day, proportionally, for the ribbon. */
export function ribbonOf(blocks: PlanBlock[]): RibbonSegment[] {
  if (!blocks.length) return [];
  const start = Date.parse(blocks[0].start);
  const span = Date.parse(blocks[blocks.length - 1].end) - start;
  if (span <= 0) return [];
  return blocks.map((block) => ({
    block,
    left: ((Date.parse(block.start) - start) / span) * 100,
    width: ((Date.parse(block.end) - Date.parse(block.start)) / span) * 100,
  }));
}

export function summarise(blocks: PlanBlock[], now: number): PlanSummary {
  const missionBlocks = blocks.filter((b) => b.kind === 'mission');
  const start = blocks.length ? Date.parse(blocks[0].start) : 0;
  const end = blocks.length ? Date.parse(blocks[blocks.length - 1].end) : 0;
  return {
    missions: missionBlocks.length,
    focusMinutes: missionBlocks.reduce((n, b) => n + minutes(b), 0),
    spanMinutes: blocks.length ? Math.round((end - start) / 60_000) : 0,
    nowAt: blocks.length && now >= start && now < end ? ((now - start) / (end - start)) * 100 : null,
    current: blocks.findIndex((b) => Date.parse(b.start) <= now && now < Date.parse(b.end)),
  };
}
