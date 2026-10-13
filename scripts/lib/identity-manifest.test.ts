// The identity manifest and the IP bible must name the same reference photo.
//
// config/icyflamze-identity-manifest.json is what render intake v2 prints at
// identity sign-off ("compare against <reference_asset>"), so it has to name
// the file the Season 1 IP bible makes canonical. On 2026-09-15 the bible
// corrected its anchor: the .jpeg it had named was an MP3 with the wrong
// extension, and the real photo is the .png beside it. The manifest kept the
// .jpeg for three more weeks because nothing tied the two files together.
// This test does: the bible's `--cref` input path and its sha256 are read
// from the document and compared with the manifest, both directions.

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'config/icyflamze-identity-manifest.json'), 'utf-8'));
const bible = fs.readFileSync(path.join(root, manifest.canonical_source), 'utf-8');

describe('identity manifest agrees with the IP bible', () => {
  it('names the IP bible as its canonical source', () => {
    expect(manifest.canonical_source).toMatch(/ip_bible\/documents\/icyflamze_core_season_1_ip_bible_.*\.md$/);
  });

  it('names the file the bible gives as the --cref input, with its sha256', () => {
    const anchor = bible.match(/The `--cref` input for every character frame:\s*`([^`]+)`[\s\S]*?sha256 `([0-9a-f]{64})`/);
    expect(anchor, 'the bible no longer states its --cref input and sha256 where this test looks').not.toBeNull();
    const [, biblePath, bibleSha] = anchor!;
    expect(manifest.reference_asset).toBe(biblePath);
    expect(manifest.reference_sha256).toBe(bibleSha);
  });

  it('does not name the MP3 that once carried the .jpeg extension', () => {
    expect(manifest.reference_asset).not.toMatch(/\.jpeg$/);
    expect(manifest.reference_sha256).not.toBe('7594b33211f8754724e2a211474de9157824bac63f100bbf0506e03600646abb');
  });
});
