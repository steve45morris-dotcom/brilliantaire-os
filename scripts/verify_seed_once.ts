import { LyricWorkspace } from '../src/workspaces/icyflamze/Lyrics.js';
import { SongManager } from '../src/workspaces/icyflamze/Music.js';
import { GoalManager } from '../src/executive/GoalManager.js';

const lyrics1 = new LyricWorkspace();
const lyricCount1 = lyrics1.getLyrics().length;

const songs1 = new SongManager();
const songCount1 = songs1.getSongs().length;

const goals1 = new GoalManager();
const goalCount1 = goals1.getGoals().length;

// Instantiate brand new instances (simulating sequential process restart with existing DB rows)
const lyrics2 = new LyricWorkspace();
const lyricCount2 = lyrics2.getLyrics().length;

const songs2 = new SongManager();
const songCount2 = songs2.getSongs().length;

const goals2 = new GoalManager();
const goalCount2 = goals2.getGoals().length;

console.log(`Lyric Count Run 1: ${lyricCount1} | Run 2: ${lyricCount2}`);
console.log(`Song Count Run 1: ${songCount1} | Run 2: ${songCount2}`);
console.log(`Goal Count Run 1: ${goalCount1} | Run 2: ${goalCount2}`);

if (lyricCount1 === lyricCount2 && songCount1 === songCount2 && goalCount1 === goalCount2) {
  console.log('🎉 SEED-ONCE VERIFICATION SUCCESSFUL: Counts stayed identical with zero re-seeding duplicates!');
  process.exit(0);
} else {
  console.error('❌ SEED-ONCE VERIFICATION FAILED: Re-seeding occurred!');
  process.exit(1);
}
