import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function printNextActions() {
  const filePath = path.join(rootDir, 'NEXT_ACTIONS.md');
  if (!fs.existsSync(filePath)) {
    console.error("❌ NEXT_ACTIONS.md not found.");
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  console.log("=========================================");
  console.log("🎯 RANKED NEXT ACTIONS: Brilliantaire OS");
  console.log("=========================================");

  let currentCategory = '';
  const categories: Record<string, string[]> = {
    'Do Now': [],
    'Do Next': [],
    'Schedule': [],
    'Pause': [],
    'Archive': []
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      const categoryName = trimmed.replace('## ', '').trim();
      if (categoryName in categories) {
        currentCategory = categoryName;
      } else {
        currentCategory = '';
      }
      continue;
    }

    if (currentCategory && trimmed.startsWith('-')) {
      const task = trimmed.replace(/^-\s*\[[ xX]?\]\s*/, '').trim();
      if (task) {
        categories[currentCategory].push(task);
      }
    }
  }

  const emojiMap: Record<string, string> = {
    'Do Now': '⚡ Do Now',
    'Do Next': '⏭️ Do Next',
    'Schedule': '📅 Schedule',
    'Pause': '⏸️ Pause',
    'Archive': '📁 Archive'
  };

  for (const cat of Object.keys(categories)) {
    console.log(`\n${emojiMap[cat]}:`);
    if (categories[cat].length > 0) {
      categories[cat].forEach((task, idx) => {
        console.log(`  [${idx + 1}] ${task}`);
      });
    } else {
      console.log("  (No tasks in this category)");
    }
  }

  console.log("\n=========================================");
}

printNextActions();
