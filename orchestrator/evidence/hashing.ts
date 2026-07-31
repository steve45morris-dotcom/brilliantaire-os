import fs from 'node:fs';
import crypto from 'node:crypto';

export function sha256File(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function sha256String(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}
