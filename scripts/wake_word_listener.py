#!/usr/bin/env python3
import os
import sys
import time
import subprocess

VOICE_INPUT_DIR = "/Users/alexanderanthony/voice_input"
TRIGGER_FILE = "/Users/alexanderanthony/voice_input/ignite.trigger"
LOG_FILE = "/Users/alexanderanthony/sentinel-os/logs/wake_word.log"
VOICE_BUFFER = "/Users/alexanderanthony/.agents/voice_buffer.txt"

os.makedirs(VOICE_INPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {msg}\n")
    print(f"[{timestamp}] {msg}")

def speak(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(VOICE_BUFFER, "a") as f:
        f.write(f"{timestamp} - {msg}\n")
    subprocess.run(["say", msg])

log("Wake-Word Listener daemon initializing...")

# Check for SpeechRecognition and PyAudio availability
HAS_SPEECH = False
try:
    import speech_recognition as sr
    HAS_SPEECH = True
    log("SpeechRecognition library successfully imported.")
except ImportError:
    log("SpeechRecognition not available. Running in file-trigger simulation mode.")

def listen_mic():
    if not HAS_SPEECH:
        return None
    try:
        r = sr.Recognizer()
        with sr.Microphone() as source:
            r.adjust_for_ambient_noise(source, duration=1)
            log("Microphone calibrated. Listening for wake-phrase...")
            audio = r.listen(source, timeout=5, phrase_time_limit=4)
            phrase = r.recognize_google(audio).lower()
            log(f"Heard: \"{phrase}\"")
            return phrase
    except Exception as e:
        # Expected on headless/sandbox boxes without mic hardware
        return None

def trigger_voice_recording():
    speak("Mainframe listening. State your command.")
    # Record a command by saving a wav or generating the mock transcription
    # In a headless/sandbox sandbox, we drop a text command directly
    time.sleep(3)
    speak("Command captured. Processing mesh query.")
    
    # Generate mock command file in voice_input directory
    cmd_path = os.path.join(VOICE_INPUT_DIR, f"command_{int(time.time())}.txt")
    with open(cmd_path, "w") as f:
        f.write("sentinel audit")
    log(f"Staged text command input sidecar: {os.path.basename(cmd_path)}")

def main():
    log("Wake-Word active. Trigger: 'am ready to ignite the lighter' or write to 'ignite.trigger'")
    while True:
        # 1. File trigger check (for testing/sandbox environments)
        if os.path.exists(TRIGGER_FILE):
            log(f"System trigger file {os.path.basename(TRIGGER_FILE)} detected.")
            try:
                os.remove(TRIGGER_FILE)
            except Exception as e:
                log(f"Failed to remove trigger file: {e}")
            trigger_voice_recording()
            
        # 2. Live mic check if library is available
        if HAS_SPEECH:
            phrase = listen_mic()
            if phrase and "ignite the lighter" in phrase:
                log("Wake-phrase matches: 'ignite the lighter'")
                trigger_voice_recording()
                
        time.sleep(2)

if __name__ == "__main__":
    main()
