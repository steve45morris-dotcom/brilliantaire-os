import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const PROMPTS_CONFIG_PATH = path.join(REPO_ROOT, 'config', 'prompts_config.json');

export interface PromptTemplate {
  id: string;
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  parameters: {
    model: string;
    temperature: number;
    maxTokens: number;
    safetySettings?: Record<string, any>;
    jsonSchema?: Record<string, any>;
  };
}

export interface CentralPromptsConfig {
  defaultProvider: 'openai' | 'gemini' | 'anthropic';
  templates: Record<string, PromptTemplate>;
}

export const DEFAULT_PROMPTS_CONFIG: CentralPromptsConfig = {
  defaultProvider: 'gemini',
  templates: {
    intent_extraction: {
      id: 'intent_extraction',
      version: '1.0.0',
      systemPrompt: 'You are ASTRA, the strategic intent routing engine for Icyflamze Creative OS. Parse the user request and extract vocal or CLI intents.',
      userPromptTemplate: 'Extract intents from this query: "{{query}}"',
      parameters: {
        model: 'gemini-1.5-pro',
        temperature: 0.2,
        maxTokens: 500,
        safetySettings: {
          harassment: 'block_medium_and_above',
          hateSpeech: 'block_medium_and_above',
        },
        jsonSchema: {
          type: 'object',
          properties: {
            intents: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['intents']
        }
      }
    },
    mission_planner: {
      id: 'mission_planner',
      version: '1.0.0',
      systemPrompt: 'You are ASTRA, Chief Strategist. Convert tasks and intent lists into structured execution plans (missions).',
      userPromptTemplate: 'Create a plan for: "{{missionName}}" with priority "{{priority}}"',
      parameters: {
        model: 'claude-3-5-sonnet',
        temperature: 0.5,
        maxTokens: 1000,
      }
    }
  }
};

export class PromptsConfigManager {
  private static instance: PromptsConfigManager;
  private config: CentralPromptsConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): PromptsConfigManager {
    if (!PromptsConfigManager.instance) {
      PromptsConfigManager.instance = new PromptsConfigManager();
    }
    return PromptsConfigManager.instance;
  }

  private loadConfig(): CentralPromptsConfig {
    if (fs.existsSync(PROMPTS_CONFIG_PATH)) {
      try {
        return JSON.parse(fs.readFileSync(PROMPTS_CONFIG_PATH, 'utf-8'));
      } catch (err) {
        console.error('⚠️ [PromptsConfig] Failed to parse config file, using default templates:', err);
      }
    } else {
      // Write the default file to ensure it's centralized
      const parentDir = path.dirname(PROMPTS_CONFIG_PATH);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(PROMPTS_CONFIG_PATH, JSON.stringify(DEFAULT_PROMPTS_CONFIG, null, 2), 'utf-8');
    }
    return DEFAULT_PROMPTS_CONFIG;
  }

  public getTemplate(id: string): PromptTemplate {
    const template = this.config.templates[id];
    if (!template) {
      throw new Error(`Prompt template with ID "${id}" was not found in prompts config`);
    }
    return template;
  }

  public getAllConfig(): CentralPromptsConfig {
    return this.config;
  }
}
