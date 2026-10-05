#!/usr/bin/env python3
import os
import sys
import subprocess
import json

def run_cmd(cmd, cwd=None):
    print(f"[AURA-RUNNER] Executing: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[AURA-RUNNER] Command Failed with code {res.returncode}")
        print(f"[AURA-RUNNER] Stderr: {res.stderr}")
        return False, res.stdout, res.stderr
    return True, res.stdout, res.stderr

def main():
    print("🌌 INITIATING AURA CLOSED-LOOP AUDIT PIPELINE...")
    
    # 1. Rebuild dashboard
    ok, stdout, stderr = run_cmd("npm run dashboard:build", cwd="/Users/alexanderanthony")
    if not ok:
        print("❌ [AURA-RUNNER] Step 1: BUILD FAILED.")
        sys.exit(1)
    print("✅ [AURA-RUNNER] Step 1: BUILD SUCCESSFUL.")
    
    # 2. Capture layout screenshot
    # Target our relocatable single-file build
    ok, stdout, stderr = run_cmd("python3 scripts/visual_eye.py dashboard/dist/index.html", cwd="/Users/alexanderanthony")
    if not ok:
        print("❌ [AURA-RUNNER] Step 2: EYE CAPTURE FAILED.")
        sys.exit(1)
    print("✅ [AURA-RUNNER] Step 2: EYE CAPTURE SUCCESSFUL.")
    
    # 3. Vision Critic Loop
    ok, stdout, stderr = run_cmd("python3 scripts/aura_critic.py sentinel_preview.png outputs/aura/critic_report.json", cwd="/Users/alexanderanthony")
    if not ok:
        print("❌ [AURA-RUNNER] Step 3: VISION AUDIT FAILED (Score below threshold or validation error).")
        # In a full agent loop, this report is used by SID to automatically patch styles in index.css
        sys.exit(1)
        
    print("✅ [AURA-RUNNER] Step 3: VISION AUDIT PASSED. UI meets premium standards.")
    sys.exit(0)

if __name__ == "__main__":
    main()
