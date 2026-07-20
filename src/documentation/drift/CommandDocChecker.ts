import type { DocumentationSourceMap } from './DocumentationSourceMap.js';
import type { DriftItem } from './DriftTypes.js';

export class CommandDocChecker {
  constructor(private readonly sources: DocumentationSourceMap) {}

  public check(): { items: DriftItem[]; commandCount: number } {
    const packageJson = JSON.parse(this.sources.read(this.sources.config.packageFile)) as { scripts?: Record<string, string> };
    const live = new Set(Object.keys(packageJson.scripts ?? {}));
    const documented = new Map<string, string>();
    for (const document of this.sources.documents()) {
      for (const match of document.content.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g)) documented.set(match[1], document.path);
      for (const command of live) {
        if (document.content.includes(`\`${command}\``)) documented.set(command, document.path);
      }
    }

    const items: DriftItem[] = [];
    for (const [command, document] of documented) {
      if (!live.has(command)) items.push({
        code: 'DOCUMENTED_COMMAND_MISSING', severity: 'high', subject: command, document,
        message: `Documented command npm run ${command} is missing from package.json.`
      });
    }
    for (const command of live) {
      if (!documented.has(command)) items.push({
        code: 'LIVE_COMMAND_UNDOCUMENTED', severity: 'low', subject: command, document: this.sources.config.packageFile,
        message: `Package command ${command} is not documented in the configured documentation set.`
      });
    }
    return { items, commandCount: live.size };
  }
}
