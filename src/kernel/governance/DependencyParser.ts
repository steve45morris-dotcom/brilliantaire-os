import fs from 'node:fs';
import path from 'node:path';

export interface DependencyNode {
  id: string;
  imports: string[];
  isOrphaned: boolean;
  isCircular: boolean;
}

export class DependencyParser {
  private baseDir: string;
  private fileGraph: Map<string, string[]> = new Map();

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  public analyzeDependencies(): Record<string, DependencyNode> {
    this.fileGraph.clear();
    this.scanDirectory(this.baseDir);

    const nodes: Record<string, DependencyNode> = {};
    const referencedFiles = new Set<string>();

    // Mark imports
    for (const [file, imports] of this.fileGraph.entries()) {
      imports.forEach(imp => referencedFiles.add(imp));
    }

    // Read .governance-ignore if exists
    let ignoreList: string[] = [];
    const ignorePath = path.resolve(this.baseDir, '../.governance-ignore');
    if (fs.existsSync(ignorePath)) {
      ignoreList = fs.readFileSync(ignorePath, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    }

    for (const file of this.fileGraph.keys()) {
      const relPath = path.relative(this.baseDir, file);
      const imports = this.fileGraph.get(file) || [];
      const relImports = imports.map(imp => path.relative(this.baseDir, imp));

      const fullRelPath = 'src/' + relPath;
      const isIgnored = ignoreList.some(pattern => {
        return fullRelPath.startsWith(pattern) || relPath.startsWith(pattern);
      });

      const isOrphaned = !referencedFiles.has(file) && 
        relPath !== 'index.ts' && 
        !relPath.includes('test') &&
        !relPath.startsWith('scripts/') &&
        !isIgnored;

      const isCircular = this.checkCircular(file);

      nodes[relPath] = {
        id: relPath,
        imports: relImports,
        isOrphaned,
        isCircular
      };
    }


    return nodes;
  }

  private scanDirectory(dir: string): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist' && !entry.name.startsWith('.')) {
          this.scanDirectory(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        this.parseImports(fullPath);
      }
    }
  }

  private parseImports(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports: string[] = [];
    
    // Simple regex matching for TypeScript local imports:
    // Matches: import ... from './somePath.js' or './somePath' or '../parent'
    const importRegex = /import\s+[\s\S]*?\s+from\s+['"](\.\.?\/[^'"]+)['"]/g;
    let match;
    const dir = path.dirname(filePath);

    while ((match = importRegex.exec(content)) !== null) {
      const importRef = match[1];
      // Normalize imported file extension/path
      let resolved = path.resolve(dir, importRef);
      if (resolved.endsWith('.js')) {
        resolved = resolved.substring(0, resolved.length - 3) + '.ts';
      }
      
      const candidates = [
        resolved,
        resolved + '.ts',
        resolved + '.tsx',
        path.join(resolved, 'index.ts')
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          imports.push(candidate);
          break;
        }
      }
    }

    this.fileGraph.set(filePath, imports);
  }

  private checkCircular(startFile: string): boolean {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (file: string): boolean => {
      if (stack.has(file)) return true;
      if (visited.has(file)) return false;

      visited.add(file);
      stack.add(file);

      const imports = this.fileGraph.get(file) || [];
      for (const imp of imports) {
        if (dfs(imp)) return true;
      }

      stack.delete(file);
      return false;
    };

    return dfs(startFile);
  }
}
