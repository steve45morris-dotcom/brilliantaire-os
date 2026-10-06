import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

export interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number;
  isrc: string;
}

export class MusicToolkit {
  /**
   * Mock utility for auto metadata tagging of music assets
   */
  public static async tagTrack(filePath: string, metadata: TrackMetadata): Promise<boolean> {
    try {
      console.log(`🎵 Tagging track metadata for ${path.basename(filePath)}...`);
      // Simulate ID3/Flac tag writes
      console.log(`- Title: ${metadata.title}`);
      console.log(`- Artist: ${metadata.artist}`);
      console.log(`- ISRC: ${metadata.isrc}`);
      
      const tagLogPath = path.join(REPO_ROOT, 'outputs', 'music_tags_log.json');
      let logs: any[] = [];
      if (fs.existsSync(tagLogPath)) {
        logs = JSON.parse(fs.readFileSync(tagLogPath, 'utf-8'));
      }
      
      logs.push({
        filePath,
        metadata,
        timestamp: new Date().toISOString()
      });
      
      fs.writeFileSync(tagLogPath, JSON.stringify(logs, null, 2), 'utf-8');
      await announcePhrase(`Track metadata tagged for ${metadata.title}.`);
      return true;
    } catch (err) {
      console.error('Failed to tag track:', err);
      return false;
    }
  }

  /**
   * Artwork generation gate to verify dimensions, format, and layout
   */
  public static async verifyArtwork(artworkPath: string): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    try {
      console.log(`🖼️ Verifying artwork specifications for ${path.basename(artworkPath)}...`);
      if (!fs.existsSync(artworkPath)) {
        errors.push(`File does not exist: ${artworkPath}`);
        return { success: false, errors };
      }

      const stats = fs.statSync(artworkPath);
      // Mock dimensions verification (should be 3000x3000px for distribution)
      const ext = path.extname(artworkPath).toLowerCase();
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        errors.push(`Invalid format: ${ext}. Distribution requires PNG or JPG.`);
      }

      if (stats.size < 100 * 1024) {
        errors.push(`File size too small (${(stats.size/1024).toFixed(1)} KB). Image may be low resolution.`);
      }

      const passed = errors.length === 0;
      return { success: passed, errors };
    } catch (err) {
      errors.push(`Verification error: ${(err as Error).message}`);
      return { success: false, errors };
    }
  }

  /**
   * Start automatic music rollout schedule generation
   */
  public static async startMusicRollout(trackName: string): Promise<void> {
    console.log(`🚀 Starting automatic music rollout for track: ${trackName}...`);
    
    // Call campaign scheduler to bootstrap schedule
    try {
      execSync(`npx tsx scripts/campaign-scheduler.ts "create sporty"`, { stdio: 'inherit' });
      execSync(`npx tsx scripts/campaign-scheduler.ts "queue sporty"`, { stdio: 'inherit' });
    } catch (err) {
      console.error('Failed to automatically invoke campaign scheduler:', err);
    }
  }
}

// CLI adapter
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const action = args[0];
  const target = args[1];

  if (action === 'rollout') {
    MusicToolkit.startMusicRollout(target || 'New Track');
  }
}
