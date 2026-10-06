#!/usr/bin/env python3
import os
import sys
import time
import subprocess

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # this repository
SENTINEL_OS_ROOT = os.path.expanduser(os.environ.get("SENTINEL_OS_ROOT") or "~/sentinel-os")
INBOX_DIR = os.path.join(REPO_ROOT, "voice_queue", "inbox")
SCRIPT_PATH = os.path.join(REPO_ROOT, "scripts", "voice-queue.ts")
LOG_FILE = os.path.join(SENTINEL_OS_ROOT, "logs", "voice_dispatcher.log")

os.makedirs(INBOX_DIR, exist_ok=True)
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {msg}\n")
    print(f"[{timestamp}] {msg}")

log("Voice Dispatcher starting up...")

def check_and_dispatch():
    try:
        files = [f for f in os.listdir(INBOX_DIR) if f.endswith(".txt")]
        if len(files) > 0:
            log(f"Detected {len(files)} new files in voice queue inbox. Dispatching voice-queue...")
            # Run the typescript voice queue parser
            res = subprocess.run(
                ["npx", "tsx", SCRIPT_PATH],
                cwd=SENTINEL_OS_ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if res.returncode == 0:
                log("voice-queue execution completed successfully.")
            else:
                log(f"voice-queue execution returned error code {res.returncode}")
                log(f"Stderr: {res.stderr}")
    except Exception as e:
        log(f"Error checking voice queue: {e}")

def main():
    while True:
        check_and_dispatch()
        time.sleep(2)

if __name__ == "__main__":
    main()
