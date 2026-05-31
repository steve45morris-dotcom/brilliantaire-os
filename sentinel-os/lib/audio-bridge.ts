import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

let daemonProcess: ChildProcess | null = null;
const PYTHON_PATH = "/Users/alexanderanthony/venv_stable/bin/python";
const DAEMON_SCRIPT = "/Users/alexanderanthony/scripts/whisper_daemon.py";

export function startAudioBridge(): boolean {
  if (daemonProcess) {
    console.log("Audio bridge is already running.");
    return false;
  }

  // Ensure directories exist
  const voiceInput = "/Users/alexanderanthony/voice_input";
  const voiceInbox = "/Users/alexanderanthony/voice_queue/inbox";
  [voiceInput, voiceInbox].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  try {
    daemonProcess = spawn(PYTHON_PATH, [DAEMON_SCRIPT], {
      detached: true,
      stdio: "ignore"
    });
    daemonProcess.unref();
    console.log("Audio bridge daemon started successfully.");
    return true;
  } catch (err) {
    console.error("Failed to start audio bridge daemon:", err);
    return false;
  }
}

export function stopAudioBridge(): boolean {
  if (!daemonProcess) {
    console.log("Audio bridge is not running.");
    return false;
  }

  const killed = daemonProcess.kill("SIGTERM");
  if (killed) {
    daemonProcess = null;
    console.log("Audio bridge daemon stopped.");
  }
  return killed;
}

export function isAudioBridgeActive(): boolean {
  return daemonProcess !== null && !daemonProcess.killed;
}
