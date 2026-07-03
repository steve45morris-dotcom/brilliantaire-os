import { UUID } from '@icyos/shared';
import { generatePerformanceProfile, generateRecommendations, ExecutionDayData } from '@icyos/learning';
import { DecisionEngine } from '@icyos/decision';
import { AiRuntime, MockProvider } from '@icyos/ai';

export interface TimelineBlockData {
  id: string;
  title: string;
  mode: 'focus' | 'buffer' | 'break' | 'rest';
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: 'proposed' | 'approved' | 'active' | 'completed';
  confidence?: number;
}

export interface AdaptivePlanResponse {
  blocks: TimelineBlockData[];
  metadata: {
    recommended_time_window: string;
    confidence_score: number;
    reason: string;
    historical_pattern: string;
    buffer_recommendation: string;
  };
}

export class PlanningService {
  private decisionEngine = new DecisionEngine();
  private aiRuntime = new AiRuntime();

  constructor() {
    this.aiRuntime.registerProvider(new MockProvider());
  }

  async captureInboxInput(input: string): Promise<string> {
    const decision = this.decisionEngine.evaluate({
      category: 'inbox_parsing',
      input
    });

    if (decision.llm_required && decision.orchestration_request) {
      const response = await this.aiRuntime.execute({
        request_id: 'inbox-capture-ai-req',
        capability: 'fast',
        confidence_required: 0.8,
        latency_target: 0,
        cost_target: 10,
        fallback_policy: 'failover',
        payload: {
          input,
          prompt_template_id: decision.orchestration_request.prompt_template_id
        }
      });
      return response.text;
    }

    return `Captured: ${input}`;
  }

  async generateDailyPlan(userId: UUID): Promise<AdaptivePlanResponse> {
    // 1. Mock execution history of the user to feed into learning engine
    const mockHistory: ExecutionDayData[] = [
      {
        timelineEvents: [],
        focusSessionEvents: [],
        bufferUsageSeconds: 1200, // overrun 20 mins
        sessionDurationSeconds: 3600,
        completedCount: 2,
        totalCount: 5, // low completion rate: 40%
        reflectionScore: 3,
        mood: 'distracted',
        energy: 3,
        wins: ['scaffolded components'],
        blockers: ['unexpected meeting interruptions', 'unclear task boundaries'],
        lessons: ['block calendar slots', 'define strict scopes'],
      }
    ];

    // 2. Compute performance profile & recommendations
    const profile = generatePerformanceProfile(mockHistory);
    const recommendations = generateRecommendations(profile);

    // 3. Generate daily timeline blocks
    const baseDate = new Date();
    baseDate.setUTCHours(9, 0, 0, 0); // start at 09:00 UTC

    // Default timeline blocks
    const blocks: TimelineBlockData[] = [
      {
        id: 'block-1',
        title: 'Core Business Engineering Sprint',
        mode: 'focus',
        startTime: new Date(baseDate.getTime()).toISOString(),
        endTime: new Date(baseDate.getTime() + 90 * 60000).toISOString(), // 90 min
        status: 'proposed',
      },
      {
        id: 'block-2',
        title: 'Protected Buffer',
        mode: 'buffer',
        startTime: new Date(baseDate.getTime() + 90 * 60000).toISOString(),
        endTime: new Date(baseDate.getTime() + 120 * 60000).toISOString(), // 30 min buffer
        status: 'proposed',
      },
      {
        id: 'block-3',
        title: 'System Architecture Refactor',
        mode: 'focus',
        startTime: new Date(baseDate.getTime() + 120 * 60000).toISOString(),
        endTime: new Date(baseDate.getTime() + 210 * 60000).toISOString(), // 90 min
        status: 'proposed',
      }
    ];

    // 4. Build explainable metadata based on recommendations
    let reason = 'Daily plan generated using standard configuration.';
    let bufferRecommendation = 'Standard 15-minute buffers applied.';
    let confidenceScore = 0.95;
    let historicalPattern = 'Stable execution pattern detected.';

    if (recommendations.length > 0) {
      const timelineRec = recommendations.find(r => r.category === 'timeline');
      const bufferRec = recommendations.find(r => r.category === 'buffer');

      if (timelineRec) {
        reason = `Your completion rate was below 60% recently (${(profile.weeklyCompletionRate * 100).toFixed(0)}%). we reduced target sprints and suggested more buffer.`;
        confidenceScore = Math.min(confidenceScore, timelineRec.confidence);
      }
      if (bufferRec) {
        bufferRecommendation = `Expand Protected Buffer to 30 minutes due to overruns of ${(profile.averageOverrunSeconds / 60).toFixed(0)}m.`;
        confidenceScore = Math.min(confidenceScore, bufferRec.confidence);
      }
      
      historicalPattern = `High overrun rate (${(profile.averageOverrunSeconds / 60).toFixed(0)}m) and low completion rate (${(profile.weeklyCompletionRate * 100).toFixed(0)}%).`;
    }

    return {
      blocks,
      metadata: {
        recommended_time_window: '09:00 - 17:00 UTC',
        confidence_score: confidenceScore,
        reason,
        historical_pattern: historicalPattern,
        buffer_recommendation: bufferRecommendation,
      }
    };
  }
}
