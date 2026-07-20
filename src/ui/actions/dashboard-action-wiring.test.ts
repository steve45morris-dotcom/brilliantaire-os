import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('dashboard Action Router wiring', () => {
  it('imports and invokes the Action Router directly for linked lyric saves', () => {
    const appPath = path.resolve(process.cwd(), 'dashboard/src/App.tsx');
    const source = fs.readFileSync(appPath, 'utf8');

    expect(source).toContain("import { globalActionRouter } from '../../src/ui/actions/ActionRouter.js';");
    expect(source).toContain("globalActionRouter.routeAction('icyflamze:save-linked-lyric'");
    expect(source).not.toContain("window as any).globalActionRouter.routeAction('icyflamze:save-linked-lyric'");
  });
});
