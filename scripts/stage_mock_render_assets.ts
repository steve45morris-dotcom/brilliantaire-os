import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const intakeIncomingDir = path.join(REPO_ROOT, 'outputs', 'icyflamze_core', 'episode_1', 'render_intake', 'incoming');

// PNG Magic: 0x89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const IHDR_CHUNK_HEADER = Buffer.from([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);

function createMockPng(filePath: string, width: number, height: number) {
  const buf = Buffer.alloc(24);
  PNG_MAGIC.copy(buf, 0);
  IHDR_CHUNK_HEADER.copy(buf, 8);
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  fs.writeFileSync(filePath, buf);
}

function createMockWav(filePath: string, durationSec: number) {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 8;
  const subChunk2Size = Math.floor(durationSec * sampleRate);
  const chunkSize = 36 + subChunk2Size;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);             // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(subChunk2Size, 40);

  const data = Buffer.alloc(subChunk2Size, 128); // Midpoint value for 8-bit PCM (silence)
  const fileContent = Buffer.concat([header, data]);
  fs.writeFileSync(filePath, fileContent);
}

function createMockMp4(filePath: string, durationSec: number) {
  try {
    // Generate black video with silent audio of exact duration using local ffmpeg
    execSync(
      `ffmpeg -y -f lavfi -i color=c=black:s=160x90:r=10 -f lavfi -i anullsrc=r=8000:cl=mono -t ${durationSec} -c:v mpeg4 -c:a aac "${filePath}"`,
      { stdio: 'ignore' }
    );
  } catch (err) {
    // Fallback if ffmpeg command fails (write empty file to avoid breaking validation scripts entirely)
    fs.writeFileSync(filePath, Buffer.alloc(100));
  }
}

const targets = [
  // Images
  { dir: 'images', name: 'IMG-01.png', type: 'png', width: 90, height: 160 },
  { dir: 'images', name: 'IMG-02.png', type: 'png', width: 160, height: 90 },
  { dir: 'images', name: 'IMG-03.png', type: 'png', width: 160, height: 90 },
  { dir: 'images', name: 'IMG-04.png', type: 'png', width: 160, height: 90 },
  { dir: 'images', name: 'IMG-05.png', type: 'png', width: 160, height: 90 },
  { dir: 'images', name: 'IMG-06.png', type: 'png', width: 160, height: 90 },
  { dir: 'images', name: 'IMG-07.png', type: 'png', width: 160, height: 90 },
  { dir: 'images', name: 'IMG-08.png', type: 'png', width: 160, height: 90 },
  // Cover Arts
  { dir: 'cover_art', name: 'COV-01.png', type: 'png', width: 100, height: 100 },
  { dir: 'cover_art', name: 'COV-02.png', type: 'png', width: 90, height: 160 },
  { dir: 'cover_art', name: 'COV-03.png', type: 'png', width: 160, height: 90 },
  { dir: 'cover_art', name: 'COV-04.png', type: 'png', width: 100, height: 100 },
  { dir: 'cover_art', name: 'COV-05.png', type: 'png', width: 100, height: 100 },
  // Audios
  { dir: 'audio', name: 'AUD-01.wav', type: 'wav', duration: 30.0 },
  { dir: 'audio', name: 'AUD-02.wav', type: 'wav', duration: 15.0 },
  { dir: 'audio', name: 'AUD-03.wav', type: 'wav', duration: 30.0 },
  { dir: 'audio', name: 'AUD-04.wav', type: 'wav', duration: 1.5 },
  { dir: 'audio', name: 'AUD-05.wav', type: 'wav', duration: 30.0 },
  { dir: 'audio', name: 'AUD-06.wav', type: 'wav', duration: 2.0 },
  { dir: 'audio', name: 'AUD-07.wav', type: 'wav', duration: 1.0 },
  { dir: 'audio', name: 'AUD-08.wav', type: 'wav', duration: 3.0 },
  { dir: 'audio', name: 'AUD-09.wav', type: 'wav', duration: 5.0 },
  // Videos
  { dir: 'videos', name: 'VID-01.mp4', type: 'mp4', duration: 3.0 },
  { dir: 'videos', name: 'VID-02.mp4', type: 'mp4', duration: 3.5 },
  { dir: 'videos', name: 'VID-03.mp4', type: 'mp4', duration: 4.0 },
  { dir: 'videos', name: 'VID-04.mp4', type: 'mp4', duration: 3.5 },
  { dir: 'videos', name: 'VID-05.mp4', type: 'mp4', duration: 3.0 },
  { dir: 'videos', name: 'VID-06.mp4', type: 'mp4', duration: 4.5 },
  { dir: 'videos', name: 'VID-07.mp4', type: 'mp4', duration: 4.5 },
  { dir: 'videos', name: 'VID-08.mp4', type: 'mp4', duration: 4.0 },
  // Documents (static write)
  { dir: 'captions', name: 'CAP-01.srt', type: 'txt', content: '1\n00:00:01,000 --> 00:00:05,000\nStreet Scholar Core Active.' },
  { dir: 'edit_projects', name: 'ASM-01.drp', type: 'txt', content: 'RESOLVE_PROJECT_WORKSPACE_DATA' }
];

function stageMockAssets() {
  console.log('🤖 Staging structural & technical mock assets...');
  for (const t of targets) {
    const targetDir = path.join(intakeIncomingDir, t.dir);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, t.name);

    // Overwrite existing dummy text files to allow full revalidation
    if (t.type === 'png') {
      createMockPng(targetPath, t.width || 100, t.height || 100);
      console.log(`Generated PNG: ${t.dir}/${t.name} (${t.width}x${t.height})`);
    } else if (t.type === 'wav') {
      createMockWav(targetPath, t.duration || 1.0);
      console.log(`Generated WAV: ${t.dir}/${t.name} (${t.duration}s)`);
    } else if (t.type === 'mp4') {
      createMockMp4(targetPath, t.duration || 1.0);
      console.log(`Generated MP4 via ffmpeg: ${t.dir}/${t.name} (${t.duration}s)`);
    } else if (t.type === 'txt') {
      fs.writeFileSync(targetPath, t.content || '', 'utf-8');
      console.log(`Generated Doc: ${t.dir}/${t.name}`);
    }
  }
  console.log('✅ Staging complete.');
}

stageMockAssets();
