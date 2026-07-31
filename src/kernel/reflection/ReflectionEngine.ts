import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { globalEventBus } from '../events/EventBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_DIR = '/Users/alexanderanthony/memory';
const LESSONS_PATH = path.join(MEMORY_DIR, 'lessons_learned.json');
const DECISIONS_PATH = path.join(MEMORY_DIR, 'decisions.json');
const OUTCOMES_PATH = path.join(MEMORY_DIR, 'outcomes.json');
const VNP_BRIDGE_PATH = '/Users/alexanderanthony/.agents/voice_narrative.sh';

export interface InsightMatch {
  type: 'lesson' | 'decision';
  content: string;
  source: string;
  timestamp: string;
}

export class ReflectionEngine {
  private static instance: ReflectionEngine;

  private constructor() {
    // Register reflection listeners or bootstrap
  }

  public static getInstance(): ReflectionEngine {
    if (!ReflectionEngine.instance) {
      ReflectionEngine.instance = new ReflectionEngine();
    }
    return ReflectionEngine.instance;
  }

  private announcePhrase(phrase: string): Promise<void> {
    return new Promise((resolve) => {
      if (!fs.existsSync(VNP_BRIDGE_PATH)) {
        console.warn(`[VNP Warning] ${VNP_BRIDGE_PATH} not found. Skipping phrase announcement.`);
        return resolve();
      }

      // Write to buffer for audit trail and speak on macOS
      const VOICE_BUFFER = "/Users/alexanderanthony/.agents/voice_buffer.txt";
      const cleanPhrase = phrase.replace(/"/g, '\\"');
      
      const dateStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
      try {
        fs.appendFileSync(VOICE_BUFFER, `${dateStr} - ${phrase}\n`);
      } catch (e) {
        console.warn(`[VNP Warning] Failed to write to voice buffer: ${(e as Error).message}`);
      }
      
      const cmd = `/Users/alexanderanthony/.agents/speak_serialized.sh "${cleanPhrase}" "P3"`;
      exec(cmd, { timeout: 8000 }, (err) => {
        if (err) {
          console.warn(`[VNP Error] Failed to speak phrase: ${err.message}`);
        }
        resolve();
      });
    });
  }

  /**
   * Scans a task log or execution output to extract structured insights.
   */
  public reflectOnLog(sourceName: string, logText: string): InsightMatch[] {
    const matches: InsightMatch[] = [];
    const timestamp = new Date().toISOString();

    // Regex to match [LESSON] or [DECISION] tags
    const lessonRegex = /(?:\[LESSON\]|LESSON Learned:)\s*([^\n\r]+)/gi;
    const decisionRegex = /(?:\[DECISION\]|DECISION:)\s*([^\n\r]+)/gi;

    let match;
    while ((match = lessonRegex.exec(logText)) !== null) {
      matches.push({
        type: 'lesson',
        content: match[1].trim(),
        source: sourceName,
        timestamp
      });
    }

    while ((match = decisionRegex.exec(logText)) !== null) {
      matches.push({
        type: 'decision',
        content: match[1].trim(),
        source: sourceName,
        timestamp
      });
    }

    // Persist matches if any
    if (matches.length > 0) {
      this.persistInsights(matches);
      globalEventBus.publish('InsightsReflected', { source: sourceName, count: matches.length });
    }

    return matches;
  }

  /**
   * Persists extracted insights to local JSON stores
   */
  private persistInsights(insights: InsightMatch[]): void {
    try {
      if (!fs.existsSync(MEMORY_DIR)) {
        fs.mkdirSync(MEMORY_DIR, { recursive: true });
      }

      // Read lessons
      let lessons: string[] = [];
      if (fs.existsSync(LESSONS_PATH)) {
        try {
          lessons = JSON.parse(fs.readFileSync(LESSONS_PATH, 'utf-8'));
        } catch {
          lessons = [];
        }
      }

      // Read decisions
      let decisions: string[] = [];
      if (fs.existsSync(DECISIONS_PATH)) {
        try {
          decisions = JSON.parse(fs.readFileSync(DECISIONS_PATH, 'utf-8'));
        } catch {
          decisions = [];
        }
      }

      let updated = false;

      for (const item of insights) {
        if (item.type === 'lesson') {
          if (!lessons.includes(item.content)) {
            lessons.push(item.content);
            updated = true;
          }
        } else if (item.type === 'decision') {
          if (!decisions.includes(item.content)) {
            decisions.push(item.content);
            updated = true;
          }
        }
      }

      if (updated) {
        fs.writeFileSync(LESSONS_PATH, JSON.stringify(lessons, null, 2), 'utf-8');
        fs.writeFileSync(DECISIONS_PATH, JSON.stringify(decisions, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error(`[ReflectionEngine] Failed to persist insights: ${(err as Error).message}`);
    }
  }

  /**
   * Generates a voice-narrator reflection brief and queues it via Piper VNP
   */
  public async playVoiceReflectionBrief(): Promise<void> {
    try {
      let lessons: string[] = [];
      if (fs.existsSync(LESSONS_PATH)) {
        lessons = JSON.parse(fs.readFileSync(LESSONS_PATH, 'utf-8'));
      }

      const recentLessons = lessons.slice(-2);
      if (recentLessons.length === 0) {
        await this.announcePhrase("Sovereign Grid Reflection: No new lessons registered in memory.");
        return;
      }

      const briefText = `Sovereign Grid Reflection. Key lesson learned: ${recentLessons.join(". And: ")}`;
      await this.announcePhrase(briefText);
    } catch (err) {
      console.error(`[ReflectionEngine] Voice brief failed: ${(err as Error).message}`);
    }
  }
}
