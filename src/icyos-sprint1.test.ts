import { describe, it, expect } from "vitest";
import { generateDailyTimeline } from "./timeline-scheduler.js";

describe("IcyOS Sprint 1: Timeline Engine & Scheduling Tests", () => {
  it("should generate a realistic timeline from missions and respect buffers", () => {
    const mockMissions = [
      {
        id: "m-1",
        title: "Workout",
        duration: 45,
        priority: "medium",
        energyRequirement: "high",
        mode: "wellbeing"
      },
      {
        id: "m-2",
        title: "Code TDD Layer",
        duration: 120,
        priority: "high",
        energyRequirement: "high",
        mode: "deep work"
      }
    ];

    const result = generateDailyTimeline(mockMissions);
    expect(result.timeline.length).toBe(4); // 2 missions + 2 buffer blocks
    expect(result.timeline[0].title).toBe("Code TDD Layer");
    expect(result.timeline[0].startTime).toBe("09:00");
    expect(result.timeline[0].endTime).toBe("11:00");
    expect(result.timeline[1].title).toBe("Protected Buffer (15m)");
    expect(result.timeline[1].duration).toBe(15);
    
    // Mission 1 (Workout) starts after Mission 2 + buffer (11:00 + 15m = 11:15)
    expect(result.timeline[2].title).toBe("Workout");
    expect(result.timeline[2].startTime).toBe("11:15");
    expect(result.timeline[2].endTime).toBe("12:00");
    expect(result.timeline[3].title).toBe("Protected Buffer (15m)");
    
    expect(result.executionScore).toBe(100);
    expect(result.conflictsDetected).toBe(false);
  });

  it("should detect conflicts and lower execution score if timeline exceeds 18:00 limit", () => {
    const mockMissions = [
      {
        id: "m-1",
        title: "Super Heavy Coding Session",
        duration: 500, // 8 hours and 20 mins
        priority: "high",
        energyRequirement: "high",
        mode: "deep work"
      },
      {
        id: "m-2",
        title: "Another High Priority Task",
        duration: 60,
        priority: "high",
        energyRequirement: "medium",
        mode: "focus"
      }
    ];

    const result = generateDailyTimeline(mockMissions);
    expect(result.conflictsDetected).toBe(true);
    expect(result.executionScore).toBeLessThan(100);
  });

  it("should output zero score if there are no missions scheduled", () => {
    const result = generateDailyTimeline([]);
    expect(result.executionScore).toBe(0);
    expect(result.timeline.length).toBe(0);
  });
});
