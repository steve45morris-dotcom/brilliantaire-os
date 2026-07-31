export class OpenAIRedaction {
  private static sensitivePatterns: RegExp[] = [
    /sk-[a-zA-Z0-9]{32,}/g, // Generic API key style
    /[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g, // Long tokens
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // Credit Card
    /\b\d{3}-\d{2}-\d{4}\b/g // SSN
  ];

  public static redactText(text: string): string {
    if (!text) return text;
    let redacted = text;
    for (const pattern of this.sensitivePatterns) {
      redacted = redacted.replace(pattern, '[REDACTED_SENSITIVE_DATA]');
    }
    return redacted;
  }

  public static redactObject(obj: any): any {
    if (!obj) return obj;
    const str = JSON.stringify(obj);
    const redactedStr = this.redactText(str);
    return JSON.parse(redactedStr);
  }
}
