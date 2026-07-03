export class SecurityGuard {
  static sanitizeOutput(input: string): string {
    let sanitized = input;
    sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{32,}/g, '[REDACTED_OPENAI_KEY]');
    sanitized = sanitized.replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, '[REDACTED_GEMINI_KEY]');
    sanitized = sanitized.replace(/ant-api-[a-zA-Z0-9_-]{40,}/g, '[REDACTED_ANTHROPIC_KEY]');
    return sanitized;
  }

  static validateEnvironment(): Record<string, boolean> {
    return {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      ollama: true
    };
  }
}
