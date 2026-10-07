import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('dashboard Action Router wiring', () => {
  it('uses the browser-safe action request boundary for linked lyric saves', () => {
    const appPath = path.resolve(process.cwd(), 'dashboard/src/App.tsx');
    const lyricsTabPath = path.resolve(process.cwd(), 'dashboard/src/components/LyricsTab.tsx');
    
    const appSource = fs.readFileSync(appPath, 'utf8');
    const lyricsTabSource = fs.readFileSync(lyricsTabPath, 'utf8');

    expect(appSource).toContain("import { globalActionRouter } from './lib/browserActionRouter.js';");
    expect(lyricsTabSource).toContain("import { globalActionRouter } from '../lib/browserActionRouter.js';");
    expect(lyricsTabSource).toContain("globalActionRouter.routeAction('icyflamze:save-linked-lyric'");
    
    expect(appSource).not.toContain("../../src/ui/actions/ActionRouter.js");
    expect(appSource).not.toContain("../../src/kernel/live/LiveOperationsStore.js");
    expect(lyricsTabSource).not.toContain("../../src/ui/actions/ActionRouter.js");
    expect(lyricsTabSource).not.toContain("../../src/kernel/live/LiveOperationsStore.js");
  });
});
