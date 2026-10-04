import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('dashboard Action Router wiring', () => {
  it('App.tsx renders the dashboard layout with telemetry components', () => {
    const appPath = path.resolve(process.cwd(), 'dashboard/src/App.tsx');
    const source = fs.readFileSync(appPath, 'utf8');

    expect(source).toContain("import { SystemStatusCard }");
    expect(source).toContain("import { CommandActivityCard }");
    expect(source).toContain("import { VoiceActivityCard }");
    expect(source).toContain("<SystemStatusCard");
  });
});
