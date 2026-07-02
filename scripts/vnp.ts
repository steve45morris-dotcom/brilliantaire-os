import { exec } from 'child_process';
import fs from 'fs';

const VNP_BRIDGE_PATH = '/Users/alexanderanthony/.agents/voice_narrative.sh';

export function announceIntent(message: string): Promise<void> {
  return new Promise((resolve) => {
    if (!fs.existsSync(VNP_BRIDGE_PATH)) {
      console.warn(`[VNP Warning] ${VNP_BRIDGE_PATH} not found. Skipping intent announcement.`);
      return resolve();
    }

    const cleanMsg = message.replace(/"/g, '\\"');
    const cmd = `source ${VNP_BRIDGE_PATH} && announce_intent "${cleanMsg}"`;
    exec(cmd, { shell: '/bin/zsh', timeout: 3000 }, (err) => {
      if (err) {
        console.warn(`[VNP Error] Failed to announce intent: ${err.message}`);
      }
      resolve();
    });
  });
}

export function announceCompletion(message: string, score: string = '10'): Promise<void> {
  return new Promise((resolve) => {
    if (!fs.existsSync(VNP_BRIDGE_PATH)) {
      console.warn(`[VNP Warning] ${VNP_BRIDGE_PATH} not found. Skipping completion announcement.`);
      return resolve();
    }

    const cleanMsg = message.replace(/"/g, '\\"');
    const cmd = `source ${VNP_BRIDGE_PATH} && announce_completion "${cleanMsg}" "${score}"`;
    exec(cmd, { shell: '/bin/zsh', timeout: 3000 }, (err) => {
      if (err) {
        console.warn(`[VNP Error] Failed to announce completion: ${err.message}`);
      }
      resolve();
    });
  });
}

export function announcePhrase(phrase: string): Promise<void> {
  return new Promise((resolve) => {
    if (!fs.existsSync(VNP_BRIDGE_PATH)) {
      console.warn(`[VNP Warning] ${VNP_BRIDGE_PATH} not found. Skipping phrase announcement.`);
      return resolve();
    }
    
    // Write to buffer for audit trail and speak on macOS
    const VOICE_BUFFER = "/Users/alexanderanthony/.agents/voice_buffer.txt";
    const cleanPhrase = phrase.replace(/"/g, '\\"');
    
    // We append to the voice buffer and speak the phrase
    const dateStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    try {
      fs.appendFileSync(VOICE_BUFFER, `${dateStr} - ${phrase}\n`);
    } catch (e) {
      console.warn(`[VNP Warning] Failed to write to voice buffer: ${(e as Error).message}`);
    }
    
    const cmd = `/Users/alexanderanthony/.agents/speak_serialized.sh "${cleanPhrase}" "P3"`;
    exec(cmd, { timeout: 3000 }, (err) => {
      if (err) {
        console.warn(`[VNP Error] Failed to speak phrase: ${err.message}`);
      }
      resolve();
    });
  });
}
