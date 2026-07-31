import fs from 'node:fs';
import path from 'node:path';
import type { DocumentationSourceMapConfig } from './DriftTypes.js';

export class DocumentationSourceMap {
  constructor(public readonly config: DocumentationSourceMapConfig) {}

  public resolve(relativePath: string): string {
    return path.resolve(this.config.root, relativePath);
  }

  public read(relativePath: string): string {
    return fs.readFileSync(this.resolve(relativePath), 'utf8');
  }

  public exists(relativePath: string): boolean {
    return fs.existsSync(this.resolve(relativePath));
  }

  public documents(): Array<{ path: string; content: string }> {
    return this.config.documentationFiles
      .filter((file) => this.exists(file))
      .map((file) => ({ path: file, content: this.read(file) }));
  }
}
