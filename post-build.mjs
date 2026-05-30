import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(currentDir, "out");

function walkDir(dir, callback) {
  for (const fileName of fs.readdirSync(dir)) {
    const filePath = path.join(dir, fileName);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, callback);
      continue;
    }
    callback(filePath);
  }
}

console.log("Running post-build relative path patcher...");

if (!fs.existsSync(outDir)) {
  console.error("Error: 'out' directory not found. Run next build first.");
  process.exit(1);
}

let count = 0;

walkDir(outDir, (filePath) => {
  if (path.extname(filePath) !== ".html") {
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");

  content = content.replace(/href="\/_next\//g, 'href="./_next/');
  content = content.replace(/src="\/_next\//g, 'src="./_next/');
  content = content.replace(/href="\/favicon\.ico/g, 'href="./favicon.ico');

  content = content.replace(/src="\/globe\.svg"/g, 'src="./globe.svg"');
  content = content.replace(/src="\/file\.svg"/g, 'src="./file.svg"');
  content = content.replace(/src="\/window\.svg"/g, 'src="./window.svg"');
  content = content.replace(/src="\/next\.svg"/g, 'src="./next.svg"');
  content = content.replace(/src="\/vercel\.svg"/g, 'src="./vercel.svg"');

  content = content.replace(/href="\/dashboard"/g, 'href="dashboard.html"');
  content = content.replace(/href="\/"/g, 'href="index.html"');
  content = content.replace(/href="\/#/g, 'href="index.html#');

  content = content.replace(/"\/_next\//g, '"./_next/');
  content = content.replace(/'\/_next\//g, "'./_next/");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Patched paths in: ${path.relative(outDir, filePath)}`);
  count += 1;
});

console.log(`Successfully patched ${count} HTML files for file:// compatibility.`);
