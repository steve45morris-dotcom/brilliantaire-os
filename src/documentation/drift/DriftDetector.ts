import { CommandDocChecker } from './CommandDocChecker.js';
import type { DocumentationSourceMap } from './DocumentationSourceMap.js';
import { RouteDocChecker } from './RouteDocChecker.js';
import { SpecImplementationChecker } from './SpecImplementationChecker.js';
import type { DriftReport } from './DriftTypes.js';

export class DriftDetector {
  constructor(private readonly sources: DocumentationSourceMap) {}

  public detect(): DriftReport {
    const commandResult = new CommandDocChecker(this.sources).check();
    const items = [
      ...new RouteDocChecker(this.sources).check(),
      ...commandResult.items,
      ...new SpecImplementationChecker(this.sources).check()
    ];
    return {
      generatedAt: new Date().toISOString(),
      items,
      summary: {
        total: items.length,
        high: items.filter((item) => item.severity === 'high').length,
        medium: items.filter((item) => item.severity === 'medium').length,
        low: items.filter((item) => item.severity === 'low').length
      },
      coverage: {
        documentsScanned: this.sources.documents().length,
        routeFilesScanned: this.sources.config.routeFiles.filter((file) => this.sources.exists(file)).length,
        packageCommandsScanned: commandResult.commandCount,
        checksRun: ['routes', 'commands', 'links', 'paths', 'statuses', 'renames', 'test-counts', 'preview-instructions']
      }
    };
  }
}
