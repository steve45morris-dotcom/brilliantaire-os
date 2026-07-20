import type { DocumentationSourceMap } from './DocumentationSourceMap.js';
import type { DriftItem } from './DriftTypes.js';

const ROUTE_PATTERN = /["'`]((?:\/)[a-zA-Z0-9][a-zA-Z0-9_?=&/.-]*)["'`]/g;

function collectRoutes(content: string): Set<string> {
  return new Set(Array.from(content.matchAll(ROUTE_PATTERN), (match) => match[1]).filter((route) => {
    if (/^\/(?:Users|private|usr|var|tmp|assets)\//.test(route)) return false;
    if (/\.[a-zA-Z0-9]{2,5}$/.test(route)) return false;
    return true;
  }));
}

export class RouteDocChecker {
  constructor(private readonly sources: DocumentationSourceMap) {}

  public check(): DriftItem[] {
    const liveRoutes = new Set<string>();
    for (const file of this.sources.config.routeFiles) {
      if (this.sources.exists(file)) collectRoutes(this.sources.read(file)).forEach((route) => liveRoutes.add(route));
    }

    const documentedRoutes = new Map<string, string>();
    for (const document of this.sources.documents()) {
      collectRoutes(document.content).forEach((route) => documentedRoutes.set(route, document.path));
    }

    const items: DriftItem[] = [];
    for (const [route, document] of documentedRoutes) {
      if (!liveRoutes.has(route)) items.push({
        code: 'DOCUMENTED_ROUTE_MISSING', severity: 'high', subject: route, document,
        message: `Documented route ${route} does not exist in the configured route sources.`
      });
    }
    for (const route of liveRoutes) {
      if (!documentedRoutes.has(route)) items.push({
        code: 'LIVE_ROUTE_UNDOCUMENTED', severity: 'medium', subject: route, document: this.sources.config.routeFiles.join(', '),
        message: `Live route ${route} is not documented in the configured documentation set.`
      });
    }
    return items;
  }
}
