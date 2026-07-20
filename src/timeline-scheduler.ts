export interface TimelineBlock {
  type: "mission" | "buffer" | "break";
  title: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  duration: number; // minutes
  missionId?: string;
  energyRequirement?: string;
  priority?: string;
}

export function generateDailyTimeline(missions: any[], bufferScale?: Record<string, number>) {
  let currentHour = 9;
  let currentMinute = 0;
  
  const timeline: TimelineBlock[] = [];
  let conflicts = 0;
  let totalWorkMinutes = 0;

  // Sort by deadline if exists, then by priority (high > medium > low), then duration
  const sorted = [...missions].sort((a, b) => {
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    if (a.deadline && b.deadline) {
      return a.deadline.localeCompare(b.deadline);
    }
    const priorities: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return (priorities[b.priority] || 2) - (priorities[a.priority] || 2);
  });

  for (const m of sorted) {
    const duration = m.duration || 30;
    
    // Check if we exceed working hours (end at 18:00)
    let startMin = currentHour * 60 + currentMinute;
    let endMin = startMin + duration;

    const formatTime = (totalMin: number) => {
      const h = Math.floor(totalMin / 60);
      const min = totalMin % 60;
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    };

    const startTimeStr = formatTime(startMin);
    const endTimeStr = formatTime(endMin);

    if (endMin > 18 * 60) {
      conflicts++;
    }

    timeline.push({
      type: "mission",
      title: m.title,
      startTime: startTimeStr,
      endTime: endTimeStr,
      duration,
      missionId: m.id,
      energyRequirement: m.energyRequirement,
      priority: m.priority
    });

    totalWorkMinutes += duration;

    // Adaptively scale buffers based on task energy levels
    const energy = m.energyRequirement || "medium";
    const scale = bufferScale ? (bufferScale[energy] || 1.0) : 1.0;
    const bufferDuration = Math.round(15 * scale);

    startMin = endMin;
    endMin = startMin + bufferDuration;
    
    timeline.push({
      type: "buffer",
      title: `Protected Buffer (${bufferDuration}m)`,
      startTime: formatTime(startMin),
      endTime: formatTime(endMin),
      duration: bufferDuration
    });

    currentHour = Math.floor(endMin / 60);
    currentMinute = endMin % 60;
  }

  // Calculate Daily Execution Score
  let score = 100;
  if (conflicts > 0) {
    score -= conflicts * 15;
  }
  if (totalWorkMinutes > 480) { // Over 8 hours work
    score -= 20;
  }
  if (missions.length === 0) {
    score = 0;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    timeline,
    executionScore: score,
    conflictsDetected: conflicts > 0
  };
}
