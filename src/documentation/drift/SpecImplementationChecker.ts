import path from 'node:path';
import type { DocumentationSourceMap } from './DocumentationSourceMap.js';
import type { DriftItem } from './DriftTypes.js';

export class SpecImplementationChecker {
  constructor(private readonly sources: DocumentationSourceMap) {}

  public check(): DriftItem[] {
    const items: DriftItem[] = [];
    const config = this.sources.config;
    for (const document of this.sources.documents()) {
      for (const match of document.content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const link = match[1];
        if (/^(?:https?:|#)/.test(link)) continue;
        const resolved = link.startsWith('file://')
          ? new URL(link).pathname
          : path.resolve(config.root, path.dirname(document.path), link);
        if (!this.sources.exists(path.relative(config.root, resolved))) items.push({
          code: 'BROKEN_INTERNAL_LINK', severity: 'medium', subject: link, document: document.path,
          message: `Internal link ${link} does not resolve.`
        });
      }

      for (const match of document.content.matchAll(/`((?:src|docs|dashboard|scripts|config)\/[a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)`/g)) {
        if (!this.sources.exists(match[1])) items.push({
          code: 'OUTDATED_FILE_PATH', severity: 'medium', subject: match[1], document: document.path,
          message: `Documented file path ${match[1]} does not exist.`
        });
      }

      for (const [oldName, newName] of Object.entries(config.renamedSymbols ?? {})) {
        if (document.content.includes(oldName)) items.push({
          code: 'RENAMED_COMPONENT', severity: 'medium', subject: oldName, document: document.path,
          message: `${oldName} was renamed to ${newName}.`, expected: newName, actual: oldName
        });
      }

      for (const [oldStatus, expectedStatus] of Object.entries(config.expectedStatuses?.[document.path] ?? {})) {
        if (document.content.toLowerCase().includes(oldStatus.toLowerCase())) items.push({
          code: 'STALE_STATUS', severity: 'medium', subject: oldStatus, document: document.path,
          message: `Status ${oldStatus} is stale.`, expected: expectedStatus, actual: oldStatus
        });
      }

      if (config.expectedTestCount !== undefined) {
        for (const match of document.content.matchAll(/^(?=[^\n]*(?:root tests|tests:))[^\n]*?(\d+)\/(\d+)\s+(?:tests?\s+)?passing/gim)) {
          if (/focused tests/i.test(match[0])) continue;
          if (Number(match[1]) !== config.expectedTestCount || Number(match[2]) !== config.expectedTestCount) items.push({
            code: 'MISMATCHED_TEST_COUNT', severity: 'low', subject: match[0], document: document.path,
            message: `Documented test count does not match the current expected count.`,
            expected: String(config.expectedTestCount), actual: `${match[1]}/${match[2]}`
          });
        }
      }

      for (const match of document.content.matchAll(/file:\/\/\/[^\s)`]+/g)) {
        if (/index\.html|preview/i.test(match[0])) items.push({
          code: 'OBSOLETE_PREVIEW_INSTRUCTION', severity: 'low', subject: match[0], document: document.path,
          message: 'Local file preview instruction is obsolete for a web-link workflow.'
        });
      }
    }
    return items;
  }
}
