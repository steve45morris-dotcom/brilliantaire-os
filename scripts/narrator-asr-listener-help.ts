import * as fs from 'fs';
import * as path from 'path';

function printHelp() {
  console.log('\n==================================================================');
  console.log('🎙️ Sentinel OS: Local ASR Command Listener (Phase N5D) Help Menu');
  console.log('==================================================================');
  console.log('This offline speech-to-text listener transcribes staged audio files');
  console.log('and registers proposed voice command packets into a manual gate.');
  console.log('Direct command execution is forbidden for security.');
  console.log('\n--- Supported Commands ---');
  console.log('  npm run narrator-asr-listener -- "status"');
  console.log('      Verify local Whisper backend detection, configurations, and directory status.');
  console.log('');
  console.log('  npm run narrator-asr-listener -- "scan-inputs"');
  console.log('      Scan outputs/narrator/asr/input_audio for new files.');
  console.log('');
  console.log('  npm run narrator-asr-listener -- "transcribe <AUDIO_FILE_PATH>"');
  console.log('      Transcribe a local audio file and output to the transcripts directory.');
  console.log('');
  console.log('  npm run narrator-asr-listener -- "stage-command <TRANSCRIPT_ID>"');
  console.log('      Generate a proposed command packet from a transcript ID.');
  console.log('');
  console.log('  npm run narrator-asr-listener -- "review <TRANSCRIPT_ID>"');
  console.log('      Print the transcript and proposed command details.');
  console.log('');
  console.log('  npm run narrator-asr-listener -- "reject <TRANSCRIPT_ID>"');
  console.log('      Reject a staged command packet and move it to outputs/narrator/asr/rejected.');
  console.log('');
  console.log('  npm run narrator-asr-listener -- "approve <TRANSCRIPT_ID>"');
  console.log('      Move the packet to outputs/narrator/asr/approved for manual execution.');
  console.log('      NOTE: This command does NOT execute the command payload.');
  console.log('');
  console.log('  npm run narrator-asr-listener -- "queue-status"');
  console.log('      Report statistics and active listings in staged, approved, and rejected queues.');
  console.log('\n--- Safety Policies ---');
  console.log('  1. Local-Only: Direct network API/cloud transcription is hard-blocked.');
  console.log('  2. Read-Only Input Scans: No directory modifications outside the target queue.');
  console.log('  3. No Auto-Execution: All transcribed CLI tasks are staged and require human approval.');
  console.log('  4. No Mic by Default: Live recording triggers must be explicitly enabled.');
  console.log('==================================================================\n');
}

printHelp();
