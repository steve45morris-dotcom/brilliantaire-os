#!/usr/bin/env python3
import os
import sys
import time
import glob
import json

VOICE_INPUT_DIR = "/Users/alexanderanthony/voice_input"
VOICE_QUEUE_INBOX = "/Users/alexanderanthony/voice_queue/inbox"
LOG_FILE = "/Users/alexanderanthony/sentinel-os/logs/whisper_daemon.log"

os.makedirs(VOICE_INPUT_DIR, exist_ok=True)
os.makedirs(VOICE_QUEUE_INBOX, exist_ok=True)
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {msg}\n")
    print(f"[{timestamp}] {msg}")

log("Whisper Daemon starting up...")

# Try loading local whisper safely
HAS_WHISPER = False
model = None
try:
    import whisper
    log("Loading local Whisper model...")
    model = whisper.load_model("base")
    HAS_WHISPER = True
    log("Whisper model loaded successfully.")
except Exception as e:
    log(f"Whisper not available or failed to load: {e}. Running with mock transcript fallback.")

# Heuristic mock lookup for testing/sandbox overrides
MOCK_PATTERNS = {
    "next": "next phase",
    "mesh": "mesh topology mapping",
    "topology": "mesh topology mapping",
    "audit": "sentinel audit",
    "confirm": "voice confirm",
    "deny": "voice deny",
    "ignite": "am ready to ignite the lighter"
}

def transcribe_audio(audio_path):
    filename = os.path.basename(audio_path)
    base, _ = os.path.splitext(filename)
    
    # 1. Check for manual text override sidecar (useful in sandbox/remote test)
    txt_override = os.path.join(VOICE_INPUT_DIR, f"{base}.txt")
    if os.path.exists(txt_override):
        log(f"Found text override sidecar for {filename}")
        with open(txt_override, "r") as f:
            text = f.read().strip()
        try:
            os.remove(txt_override)
        except Exception as e:
            log(f"Could not remove sidecar file: {e}")
        return text

    # 2. Real Whisper transcription if available
    if HAS_WHISPER and model is not None:
        try:
            log(f"Transcribing {filename} via Whisper...")
            result = model.transcribe(audio_path)
            text = result.get("text", "").strip()
            log(f"Whisper output: \"{text}\"")
            return text
        except Exception as e:
            log(f"Whisper transcription failed: {e}. Falling back to mocks.")
            
    # 3. Mock heuristic fallbacks based on filename keywords
    lower_base = base.lower()
    for keyword, phrase in MOCK_PATTERNS.items():
        if keyword in lower_base:
            log(f"Matched keyword '{keyword}' in file name. Mapping to phrase: \"{phrase}\"")
            return phrase
            
    log(f"No match for filename {filename}. Defaulting to generic query.")
    return "sentinel audit"

def main():
    while True:
        try:
            # Look for wav, mp3, m4a files
            audio_files = []
            for ext in ("*.wav", "*.mp3", "*.m4a"):
                audio_files.extend(glob.glob(os.path.join(VOICE_INPUT_DIR, ext)))
                
            for audio_path in audio_files:
                filename = os.path.basename(audio_path)
                log(f"Processing audio input: {filename}")
                
                # Perform transcription
                transcribed_text = transcribe_audio(audio_path)
                
                # Stage into inbox as .txt command file
                base, _ = os.path.splitext(filename)
                inbox_txt_path = os.path.join(VOICE_QUEUE_INBOX, f"{base}.txt")
                
                with open(inbox_txt_path, "w") as f:
                    f.write(transcribed_text)
                    
                log(f"Staged transcript into voice_queue/inbox: \"{transcribed_text}\" -> {os.path.basename(inbox_txt_path)}")
                
                # Remove original audio file to prevent loop processing
                try:
                    os.remove(audio_path)
                    log(f"Cleaned up input file {filename}")
                except Exception as e:
                    log(f"Failed to remove input file {filename}: {e}")
                    
        except Exception as e:
            log(f"Loop error: {e}")
            
        time.sleep(2)

if __name__ == "__main__":
    main()
