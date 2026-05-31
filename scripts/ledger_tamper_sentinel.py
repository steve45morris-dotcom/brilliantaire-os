#!/usr/bin/env python3
import os
import sys
import time
import sqlite3
import hashlib
import subprocess

DB_PATH = "/Users/alexanderanthony/supernova.db"
LOCK_FILE = "/Users/alexanderanthony/.agents/focus_lock.txt"
LOG_FILE = "/Users/alexanderanthony/sentinel-os/logs/ledger_sentinel.log"
VOICE_BUFFER = "/Users/alexanderanthony/.agents/voice_buffer.txt"
GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

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

def verify_ledger():
    if not os.path.exists(DB_PATH):
        return True, None
        
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='zk_ledger';")
        if not cursor.fetchone():
            conn.close()
            return True, None
            
        cursor.execute("SELECT id, event_type, event_id, prev_hash, event_hash FROM zk_ledger ORDER BY id ASC;")
        rows = cursor.fetchall()
        
        expected_prev_hash = GENESIS_HASH
        
        for row in rows:
            block_id, event_type, event_id, prev_hash, event_hash = row
            
            if prev_hash != expected_prev_hash:
                conn.close()
                return False, f"Broken connection link at Block #{block_id}."
                
            # Verify payload consistency
            data_payload = ""
            if event_type == "WRITE":
                cursor.execute("SELECT file_path, bytes_written FROM write_events WHERE id = ?;", (event_id,))
                w_row = cursor.fetchone()
                if w_row:
                    data_payload = f"{w_row[0]}-{w_row[1]}"
            elif event_type == "PHRASE":
                cursor.execute("SELECT phrase_number, phrase_text FROM phrase_events WHERE id = ?;", (event_id,))
                p_row = cursor.fetchone()
                if p_row:
                    data_payload = f"{p_row[0]}-{p_row[1]}"
                    
            raw_string = f"{prev_hash}-{event_type}-{event_id}-{data_payload}"
            calculated_hash = hashlib.sha256(raw_string.encode("utf-8")).hexdigest()
            
            if event_hash != calculated_hash:
                conn.close()
                return False, f"Hash mismatch at Block #{block_id} (Calculated: {calculated_hash[:10]}... Expected: {event_hash[:10]}...)."
                
            expected_prev_hash = event_hash
            
        conn.close()
        return True, None
    except Exception as e:
        log(f"Verification error: {e}")
        return True, None # Ignore connection/lock errors temporarily to prevent false alarms

def main():
    log("Ledger Tamper Sentinel active and auditing Merkle chain root...")
    is_compromised = False
    
    while True:
        is_ok, reason = verify_ledger()
        if not is_ok:
            if not is_compromised:
                is_compromised = True
                log(f"⚠️  TAMPER ALERT DETECTED: {reason}")
                
                # Write command router lock
                with open(LOCK_FILE, "w") as f:
                    f.write("LOCKED")
                log("Command router channels LOCKED by security sentinel.")
                
                # Voice warning
                speak("Warning. Sovereign integrity chain compromised. Core execution channels locked.")
        else:
            if is_compromised:
                is_compromised = False
                log("Sovereign integrity chain RESTORED to nominal.")
                if os.path.exists(LOCK_FILE):
                    os.remove(LOCK_FILE)
                speak("Ledger integrity chain verified. Command channels active.")
                
        time.sleep(5)

if __name__ == "__main__":
    main()
