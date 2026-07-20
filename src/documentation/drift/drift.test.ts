import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DocumentationSourceMap } from './DocumentationSourceMap.js';
import { DriftDetector } from './DriftDetector.js';

function fixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-drift-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    scripts: { build: 'tsc', test: 'vitest run', 'live:only': 'node live.js' }
  }));
  fs.writeFileSync(path.join(root, 'src/routes.ts'), "export const routes = ['/home', '/live-only'];\n");
  fs.writeFileSync(path.join(root, 'src/NewPanel.ts'), 'export class NewPanel {}\n');
  fs.writeFileSync(path.join(root, 'docs/guide.md'), [
    '# Guide',
    'Routes: `/home`, `/missing`.',
    'Commands: `npm run build`, `npm run missing`.',
    'Component: `OldPanel`.',
    'Status: candidate.',
    'Tests: 120/120 passing.',
    'Preview: `file:///old/index.html`.',
    'Path: `src/Missing.ts`.',
    '[Broken](./absent.md)'
  ].join('\n'));
  return root;
}

describe('documentation drift detection', () => {
  it('detects documented and live route drift', () => {
    const root = fixture();
    const detector = new DriftDetector(new DocumentationSourceMap({
      root,
      documentationFiles: ['docs/guide.md'],
      routeFiles: ['src/routes.ts'],
      packageFile: 'package.json'
    }));

    const report = detector.detect();
    expect(report.items).toContainEqual(expect.objectContaining({ code: 'DOCUMENTED_ROUTE_MISSING', subject: '/missing' }));
    expect(report.items).toContainEqual(expect.objectContaining({ code: 'LIVE_ROUTE_UNDOCUMENTED', subject: '/live-only' }));
  });

  it('detects package command drift in both directions', () => {
    const root = fixture();
    const report = new DriftDetector(new DocumentationSourceMap({
      root,
      documentationFiles: ['docs/guide.md'],
      routeFiles: ['src/routes.ts'],
      packageFile: 'package.json'
    })).detect();

    expect(report.items).toContainEqual(expect.objectContaining({ code: 'DOCUMENTED_COMMAND_MISSING', subject: 'missing' }));
    expect(report.items).toContainEqual(expect.objectContaining({ code: 'LIVE_COMMAND_UNDOCUMENTED', subject: 'live:only' }));
  });

  it('detects broken links, outdated paths, stale counts, renamed symbols, statuses, and preview instructions', () => {
    const root = fixture();
    const report = new DriftDetector(new DocumentationSourceMap({
      root,
      documentationFiles: ['docs/guide.md'],
      routeFiles: ['src/routes.ts'],
      packageFile: 'package.json',
      expectedStatuses: { 'docs/guide.md': { candidate: 'experimental' } },
      expectedTestCount: 134,
      renamedSymbols: { OldPanel: 'NewPanel' }
    })).detect();

    const codes = report.items.map((item) => item.code);
    expect(codes).toEqual(expect.arrayContaining([
      'BROKEN_INTERNAL_LINK',
      'OUTDATED_FILE_PATH',
      'MISMATCHED_TEST_COUNT',
      'RENAMED_COMPONENT',
      'STALE_STATUS',
      'OBSOLETE_PREVIEW_INSTRUCTION'
    ]));
    expect(report.coverage.documentsScanned).toBe(1);
    expect(report.summary.total).toBe(report.items.length);
  });

  it('does not classify filesystem paths, valid file links, assets, or focused test counts as drift', () => {
    const root = fixture();
    fs.writeFileSync(path.join(root, 'docs/existing.md'), '# Existing\n');
    fs.appendFileSync(path.join(root, 'docs/guide.md'), [
      '',
      `Path: \`${root}/workspaces/icyflamze/\`.`,
      'Asset: `/assets/cover.png`.',
      `Valid: [Existing](file://${root}/docs/existing.md).`,
      'Focused tests: 5/5 passing.'
    ].join('\n'));
    const report = new DriftDetector(new DocumentationSourceMap({
      root,
      documentationFiles: ['docs/guide.md'],
      routeFiles: ['src/routes.ts'],
      packageFile: 'package.json',
      expectedTestCount: 134
    })).detect();

    expect(report.items).not.toContainEqual(expect.objectContaining({ subject: `${root}/workspaces/icyflamze/` }));
    expect(report.items).not.toContainEqual(expect.objectContaining({ subject: '/assets/cover.png' }));
    expect(report.items).not.toContainEqual(expect.objectContaining({ subject: `file://${root}/docs/existing.md` }));
    expect(report.items).not.toContainEqual(expect.objectContaining({ code: 'MISMATCHED_TEST_COUNT', actual: '5/5' }));
  });
});
