import os
import time
import json
import shutil
import subprocess
import sys

PENDING_DIR = "system/intake/pending"
PROCESSED_DIR = "system/intake/processed"
FAILED_DIR = "system/intake/failed"
LOADER_SCRIPT = "scripts/load_skill.py"

def process_file(file_path):
    print(f"[*] Processing: {file_path}")
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        request = data.get("request")
        if not request:
            raise ValueError("Missing 'request' field in JSON")
            
        tools = data.get("tools", "")
        artifacts = data.get("artifacts", "")
        
        cmd = [
            "python3", LOADER_SCRIPT,
            "--request", request,
            "--tools", tools,
            "--artifacts", artifacts,
            "--json"
        ]
        
        print(f"[*] Executing: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"[+] Success: {request}")
            shutil.move(file_path, os.path.join(PROCESSED_DIR, os.path.basename(file_path)))
            # Log the output to a companion file in processed
            with open(os.path.join(PROCESSED_DIR, os.path.basename(file_path) + ".log"), "w") as log:
                log.write(result.stdout)
        else:
            print(f"[-] Loader failed: {result.stderr}")
            raise Exception(result.stderr)
            
    except Exception as e:
        print(f"[!] Error processing {file_path}: {e}")
        shutil.move(file_path, os.path.join(FAILED_DIR, os.path.basename(file_path)))
        with open(os.path.join(FAILED_DIR, os.path.basename(file_path) + ".error"), "w") as err:
            err.write(str(e))

def main():
    print(f"[*] Watching {PENDING_DIR} for new requests...")
    while True:
        files = [f for f in os.listdir(PENDING_DIR) if f.endswith(".json")]
        for f in files:
            process_file(os.path.join(PENDING_DIR, f))
        
        time.sleep(2)

if __name__ == "__main__":
    if not os.path.exists(LOADER_SCRIPT):
        print(f"Error: {LOADER_SCRIPT} not found.")
        sys.exit(1)
    main()
