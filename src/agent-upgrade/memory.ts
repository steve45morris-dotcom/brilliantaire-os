import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MemorySchema } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const MEMORY_DIR = path.join(REPO_ROOT, 'memory');

export function initMemoryDirectories() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

export class SharedMemoryManager {
  constructor() {
    initMemoryDirectories();
    this.ensureFile('decisions.json', []);
    this.ensureFile('project_context.json', { name: 'The One System Agent Upgrade Stack', phase: 1 });
    this.ensureFile('outcomes.json', []);
    this.ensureFile('lessons_learned.json', [
      'Strict verification gates prevent structural failures.',
      'Background task loops must utilize dedicated process timers rather than command delays.'
    ]);
    this.ensureFile('workflow_history.json', []);
    this.ensureFile('study_conclusions.json', []);
    this.ensureFile('agent_notes.json', {
      'planner-agent': 'Focusing on planning templates.',
      'executor-agent': 'Sandboxing command runs.',
      'verifier-agent': 'Verifying checklist metrics.'
    });
    this.ensureFile('user_preferences.json', { theme: 'Supernova Cyberpunk', mode: 'autonomous' });
    this.ensureFile('active_goals.json', ['Complete modular implementation of Agent Upgrade Stack']);
    this.ensureFile('blocked_items.json', []);
  }

  private ensureFile(filename: string, defaultContent: any) {
    const filePath = path.join(MEMORY_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
    }
  }

  private readFile<T>(filename: string): T {
    const filePath = path.join(MEMORY_DIR, filename);
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {
      console.error(`[Memory Error] Failed to read ${filename}: ${(e as Error).message}`);
    }
    return [] as unknown as T;
  }

  private writeFile(filename: string, data: any) {
    const filePath = path.join(MEMORY_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Decisions
  getDecisions() {
    return this.readFile<any[]>('decisions.json');
  }

  addDecision(title: string, context: string, decision: string) {
    const items = this.getDecisions();
    items.push({
      id: `dec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title,
      context,
      decision
    });
    this.writeFile('decisions.json', items);
  }

  // Project Context
  getProjectContext() {
    return this.readFile<Record<string, any>>('project_context.json');
  }

  updateProjectContext(update: Record<string, any>) {
    const current = this.getProjectContext();
    const merged = { ...current, ...update };
    this.writeFile('project_context.json', merged);
  }

  // Lessons
  getLessonsLearned() {
    return this.readFile<string[]>('lessons_learned.json');
  }

  addLessonLearned(lesson: string) {
    const lessons = this.getLessonsLearned();
    if (!lessons.includes(lesson)) {
      lessons.push(lesson);
      this.writeFile('lessons_learned.json', lessons);
    }
  }

  // Workflow History
  getWorkflowHistory() {
    return this.readFile<any[]>('workflow_history.json');
  }

  logWorkflowRun(workflowId: string, workflowName: string, status: string) {
    const history = this.getWorkflowHistory();
    history.push({
      id: workflowId,
      workflowName,
      status,
      timestamp: new Date().toISOString()
    });
    this.writeFile('workflow_history.json', history);
  }

  // Agent Notes
  getAgentNotes() {
    return this.readFile<Record<string, string>>('agent_notes.json');
  }

  updateAgentNote(agent: string, note: string) {
    const notes = this.getAgentNotes();
    notes[agent] = note;
    this.writeFile('agent_notes.json', notes);
  }

  // User Preferences
  getUserPreferences() {
    return this.readFile<Record<string, any>>('user_preferences.json');
  }

  // Active Goals
  getActiveGoals() {
    return this.readFile<string[]>('active_goals.json');
  }

  addActiveGoal(goal: string) {
    const goals = this.getActiveGoals();
    if (!goals.includes(goal)) {
      goals.push(goal);
      this.writeFile('active_goals.json', goals);
    }
  }

  removeActiveGoal(goal: string) {
    const goals = this.getActiveGoals();
    const index = goals.indexOf(goal);
    if (index !== -1) {
      goals.splice(index, 1);
      this.writeFile('active_goals.json', goals);
    }
  }

  // Blocked Items
  getBlockedItems() {
    return this.readFile<string[]>('blocked_items.json');
  }

  addBlockedItem(item: string) {
    const items = this.getBlockedItems();
    if (!items.includes(item)) {
      items.push(item);
      this.writeFile('blocked_items.json', items);
    }
  }

  removeBlockedItem(item: string) {
    const items = this.getBlockedItems();
    const index = items.indexOf(item);
    if (index !== -1) {
      items.splice(index, 1);
      this.writeFile('blocked_items.json', items);
    }
  }

  // Outpaced outcome log retrieval
  getOutcomes() {
    return this.readFile<any[]>('outcomes.json');
  }

  logOutcome(outcome: any) {
    const outcomes = this.getOutcomes();
    outcomes.push(outcome);
    this.writeFile('outcomes.json', outcomes);
  }

  // Study Conclusions
  getStudyConclusions() {
    return this.readFile<any[]>('study_conclusions.json');
  }

  logStudyConclusion(conclusion: any) {
    const conclusions = this.getStudyConclusions();
    conclusions.push(conclusion);
    this.writeFile('study_conclusions.json', conclusions);
  }

  // Full representation
  getFullMemory(): MemorySchema {
    return {
      decisions: this.getDecisions(),
      projectContext: this.getProjectContext(),
      outcomes: this.getOutcomes(),
      lessonsLearned: this.getLessonsLearned(),
      workflowHistory: this.getWorkflowHistory(),
      agentNotes: this.getAgentNotes(),
      userPreferences: this.getUserPreferences(),
      activeGoals: this.getActiveGoals(),
      blockedItems: this.getBlockedItems()
    };
  }
}

export const globalSharedMemoryManager = new SharedMemoryManager();
