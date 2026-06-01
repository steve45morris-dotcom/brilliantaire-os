import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import {
  LIVE_INPUT_DIR,
  MANUAL_INPUT_DIR,
  VIBEVOICE_LOG_DIR,
  TRANSCRIPT_PREFIX,
  MAX_TRANSCRIPT_LENGTH
} from '../config/vibevoice.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const LOCK_FILE = '/tmp/vibevoice-listener.lock';

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFormattedDateTime(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hour}${min}${sec}`;
}

function logMessage(msg: string) {
  const timestamp = new Date().toISOString();
  const logStr = `[${timestamp}] ${msg}`;
  console.log(logStr);

  try {
    if (!fs.existsSync(VIBEVOICE_LOG_DIR)) {
      fs.mkdirSync(VIBEVOICE_LOG_DIR, { recursive: true });
    }
    const logFile = path.join(VIBEVOICE_LOG_DIR, `vibevoice_listener_${getFormattedDate()}.log`);
    fs.appendFileSync(logFile, logStr + '\n');
  } catch (e) {
    console.error(`Failed to write to listener log: ${(e as Error).message}`);
  }
}

// Fallback pattern lookup matching python's whisper_daemon
const MOCK_PATTERNS: { [key: string]: string } = {
  'brief': 'show daily brief',
  'audit': 'run audit',
  'next': 'show next actions',
  'agents': 'show agents',
  'help': 'show campaign help',
  'compile': 'compile workspace',
  'dashboard': 'build dashboard',
  'export': 'export dashboard data',
  'status': 'check background status',
  'obsidian': 'scan obsidian',
  'write': 'stage write',
  'approve': 'approve write',
  'campaign': 'run campaign engine'
};

function getMockTranscript(filename: string): string {
  const lowerName = filename.toLowerCase();
  for (const [keyword, phrase] of Object.entries(MOCK_PATTERNS)) {
    if (lowerName.includes(keyword)) {
      return phrase;
    }
  }
  return 'show daily brief'; // Default fallback command
}

function checkInstanceLock(): boolean {
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf-8').trim(), 10);
      if (!isNaN(pid)) {
        // Check if process is still running (kill -0)
        process.kill(pid, 0);
        logMessage(`Daemon already running with PID ${pid}. Exiting.`);
        return false;
      }
    } catch (e) {
      // Process is dead or file is stale; we can overwrite
      logMessage(`Stale lock file found. Removing.`);
    }
  }
  fs.writeFileSync(LOCK_FILE, process.pid.toString(), 'utf-8');
  return true;
}

function transcribeAudio(audioPath: string): Promise<string> {
  return new Promise((resolve) => {
    const filename = path.basename(audioPath);
    const dir = path.dirname(audioPath);
    
    // 1. Check for text override sidecar (e.g. audioName.txt or audioName.wav.txt)
    const baseWav = filename;
    const txtSidecar1 = path.join(dir, `${baseWav}.txt`);
    const baseName = path.parse(filename).name;
    const txtSidecar2 = path.join(dir, `${baseName}.txt`);

    let sidecarFile = '';
    if (fs.existsSync(txtSidecar1)) {
      sidecarFile = txtSidecar1;
    } else if (fs.existsSync(txtSidecar2)) {
      sidecarFile = txtSidecar2;
    }

    if (sidecarFile) {
      logMessage(`Found text override sidecar: ${path.basename(sidecarFile)}`);
      try {
        const text = fs.readFileSync(sidecarFile, 'utf-8').trim();
        fs.unlinkSync(sidecarFile);
        return resolve(text);
      } catch (e) {
        logMessage(`Error reading sidecar file: ${(e as Error).message}`);
      }
    }

    // 2. Real execution attempt of whisper-cpp
    const cmd = `whisper-cpp -f "${audioPath}" -nt -otxt`;
    logMessage(`Running transcription: ${cmd}`);
    
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        logMessage(`whisper-cpp execution failed (not installed or error): ${err.message}. Triggering fallback.`);
        // Fallback: Check filename keyword map
        const fallbackText = getMockTranscript(filename);
        logMessage(`Fallback mapped "${filename}" -> "${fallbackText}"`);
        return resolve(fallbackText);
      }

      // Check if .txt was generated (whisper-cpp with -otxt creates <input_file>.txt)
      const expectedTxtFile = `${audioPath}.txt`;
      if (fs.existsSync(expectedTxtFile)) {
        try {
          const text = fs.readFileSync(expectedTxtFile, 'utf-8').trim();
          fs.unlinkSync(expectedTxtFile);
          logMessage(`Transcription completed successfully: "${text}"`);
          return resolve(text);
        } catch (e) {
          logMessage(`Error reading whisper output file: ${(e as Error).message}`);
        }
      }

      // Fallback if file doesn't exist but command succeeded
      const textFromStdout = stdout.trim() || getMockTranscript(filename);
      logMessage(`Transcription read from stdout/fallback: "${textFromStdout}"`);
      resolve(textFromStdout);
    });
  });
}

async function scanAndProcess() {
  if (!fs.existsSync(LIVE_INPUT_DIR)) {
    fs.mkdirSync(LIVE_INPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(MANUAL_INPUT_DIR)) {
    fs.mkdirSync(MANUAL_INPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(LIVE_INPUT_DIR);
  const audioFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ext === '.wav';
  });

  for (const file of audioFiles) {
    const audioPath = path.join(LIVE_INPUT_DIR, file);
    
    // Acquire file-level processing lock by renaming it
    const processingPath = path.join(LIVE_INPUT_DIR, `${file}.processing`);
    try {
      fs.renameSync(audioPath, processingPath);
    } catch (e) {
      // Could fail if another thread/process renamed it first
      continue;
    }

    logMessage(`Locked and processing: ${file}`);
    await announcePhrase(`Processing voice file: ${file}`);

    const text = await transcribeAudio(processingPath);
    
    if (text) {
      const dateTimeStr = getFormattedDateTime();
      const targetTxtFile = `${TRANSCRIPT_PREFIX}_${dateTimeStr}.txt`;
      const targetPath = path.join(MANUAL_INPUT_DIR, targetTxtFile);
      
      fs.writeFileSync(targetPath, text, 'utf-8');
      logMessage(`Ingested transcript written: voice_input/manual/${targetTxtFile} ("${text}")`);
      await announcePhrase(`Ingested command: ${text}`);
    }

    // Cleanup audio file
    try {
      if (fs.existsSync(processingPath)) {
        fs.unlinkSync(processingPath);
        logMessage(`Cleaned up processing file: ${file}.processing`);
      }
    } catch (e) {
      logMessage(`Failed to clean up processing file: ${(e as Error).message}`);
    }
  }
}

async function startDaemon() {
  if (!checkInstanceLock()) {
    process.exit(0);
  }

  logMessage('🎙️ VibeVoice Live Listener Daemon started.');
  await announceIntent('VibeVoice live listener daemon started.');

  // Clean up lock file on exit
  const cleanup = () => {
    logMessage('VibeVoice Live Listener Daemon shutting down.');
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  });

  // Loop execution every 2 seconds
  setInterval(async () => {
    try {
      await scanAndProcess();
    } catch (e) {
      logMessage(`Error in scan loop: ${(e as Error).message}`);
    }
  }, 2000);
}

startDaemon();
