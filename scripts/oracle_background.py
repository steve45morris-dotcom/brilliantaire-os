import os
import sys
import time
import numpy as np
import sounddevice as sd
import queue
import threading

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../Backend Services/services/VibeVoice")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../Backend Services/orchestrators")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from supernova.modules.vibevoice import manager
from supernova.modules.vibe_bridge import process_vocal_command

# Configuration
SAMPLING_RATE = 24000
CHANNELS = 1
THRESHOLD = 0.01  # Audio level threshold to trigger transcription
SILENCE_DURATION = 1.0  # Seconds of silence to consider a segment finished
MAX_SEGMENT_DURATION = 10.0  # Max seconds before forcing transcription

audio_queue = queue.Queue()

def audio_callback(indata, frames, time_info, status):
    if status:
        print(status, file=sys.stderr)
    audio_queue.put(indata.copy())

def voice_bridge_announce(msg):
    try:
        import httpx
        with httpx.Client() as client:
            payload = {"payload": {"text": msg}}
            client.post("http://localhost:8001/registry/actions/vv_vocalize/execute", json=payload)
    except Exception:
        # Fallback to file buffer if API is down
        with open("/Users/alexanderanthony/.agents/voice_buffer.txt", "a") as f:
            f.write(f"{msg}\n")

def oracle_listener():
    print("[*] Background Oracle Listening...")
    voice_bridge_announce("Background Oracle Online. Standing by for wake-word.")
    
    current_segment = []
    last_active_time = time.time()
    recording_started = False
    
    with sd.InputStream(samplerate=SAMPLING_RATE, channels=CHANNELS, callback=audio_callback):
        while True:
            try:
                # Get audio data from queue
                chunk = audio_queue.get(timeout=0.1)
                
                # Check for activity
                volume_norm = np.linalg.norm(chunk) / np.sqrt(len(chunk))
                
                if volume_norm > THRESHOLD:
                    if not recording_started:
                        print("[*] Voice detected...")
                        recording_started = True
                    current_segment.append(chunk)
                    last_active_time = time.time()
                elif recording_started:
                    # Append silence chunk
                    current_segment.append(chunk)
                    
                    # Check for end of segment (silence or max duration)
                    if (time.time() - last_active_time > SILENCE_DURATION) or \
                       (len(current_segment) * chunk.size / SAMPLING_RATE > MAX_SEGMENT_DURATION):
                        
                        print("[*] Processing segment...")
                        full_audio = np.concatenate(current_segment).flatten()
                        
                        # Transcribe
                        try:
                            # Use manager with project hotwords
                            result = manager.transcribe(full_audio)
                            text = result.get("transcript", "").strip().lower()
                            
                            if text:
                                print(f"✦ Oracle Heard: {text}")
                                
                                # Wake-word: "Supernova" or "System"
                                if "supernova" in text or "system" in text:
                                    print("[!] Wake-word detected!")
                                    command = text.replace("supernova", "").replace("system", "").strip()
                                    if command:
                                        voice_bridge_announce(f"Command acknowledged: {command}")
                                        
                                        # Check if it's a creative command
                                        if any(w in command for w in ["record", "create", "start", "new song", "verse", "hook"]):
                                            # Dispatch to Supernova Core for analysis
                                            try:
                                                import httpx
                                                with httpx.Client() as client:
                                                    # Using the direct command endpoint for execution
                                                    # POST /execute is for complex commands, we'll use a simpler trigger or direct action call
                                                    # Actually, let's use the registry execution directly
                                                    payload = {"payload": {"text": command}}
                                                    client.post("http://localhost:8001/registry/actions/vv_process_voice_intent/execute", json=payload)
                                                    print(f"[*] Dispatched creative intent to Core.")
                                            except Exception as e:
                                                print(f"[!] Dispatch error: {e}")
                                                process_vocal_command(command)
                                        else:
                                            process_vocal_command(command)
                                    else:
                                        voice_bridge_announce("System active. State your command.")
                        except Exception as e:
                            print(f"[!] Transcription error: {e}")
                            
                        # Reset for next segment
                        current_segment = []
                        recording_started = False
                        
            except queue.Empty:
                continue

if __name__ == "__main__":
    try:
        oracle_listener()
    except KeyboardInterrupt:
        print("\n[*] Oracle shutting down.")
        voice_bridge_announce("Background Oracle Offline.")
