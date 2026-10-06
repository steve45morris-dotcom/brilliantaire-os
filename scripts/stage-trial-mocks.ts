import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REPO_ROOT } from '../config/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prodManifestPath = path.join(REPO_ROOT, 'config', 'episode_1_production_manifest.json');
const intakeOutDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'episode_1', 'render_intake');
const incomingDir = path.join(intakeOutDir, 'incoming');

const incomingFolders: Record<string, string> = {
  image: path.join(incomingDir, 'images'),
  video: path.join(incomingDir, 'videos'),
  audio: path.join(incomingDir, 'audio'),
  cover_art: path.join(incomingDir, 'cover_art'),
  caption: path.join(incomingDir, 'captions'),
  assembly: path.join(incomingDir, 'edit_projects')
};

const prodManifest = JSON.parse(fs.readFileSync(prodManifestPath, 'utf-8'));

function main() {
  console.log('Staging mock assets for trial baseline...');
  
  for (const asset of prodManifest.assets) {
    const folder = incomingFolders[asset.category];
    fs.mkdirSync(folder, { recursive: true });

    // Determine target name
    const ext = asset.allowed_extensions[0];
    const fileName = `${asset.prefix}_staged${ext}`;
    const filePath = path.join(folder, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`- Asset ${asset.id} already staged at ${filePath}`);
      continue;
    }

    // Build mock lineage based on dependencies (starting at v1)
    let parentLineageStr = '';
    if (asset.dependencies.length > 0) {
      parentLineageStr = asset.dependencies.map((d: string) => `${d} v1`).join(', ');
    }

    let content = `MOCK ASSET FOR SLOT ${asset.id} (${asset.role})\n`;
    content += `source: ${asset.tool}\n`;
    content += `generator: mock-generator-v1.0\n`;
    if (asset.dimensions) content += `dimensions: ${asset.dimensions}\n`;
    if (asset.duration) content += `duration: ${asset.duration}\n`;
    if (parentLineageStr) content += `Parent Lineage: ${parentLineageStr}\n`;

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Staged mock asset: ${filePath}`);
  }

  console.log('All mock assets successfully staged!');
}

main();
