export class IntelligenceLogger {
  public log(message: string): void {
    console.log(`[OIL Logger] ${message}`);
  }

  public warn(message: string): void {
    console.warn(`[OIL Warning] ${message}`);
  }

  public error(message: string): void {
    console.error(`[OIL Error] ${message}`);
  }
}

export const globalIntelligenceLogger = new IntelligenceLogger();
