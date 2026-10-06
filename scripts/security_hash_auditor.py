#!/usr/bin/env python3
"""
security_hash_auditor.py - Cryptographic Hash Auditor & Obsidian Logger
Evolved under Phase 21 protocol for the Sovereign Cognitive Mesh.
"""

import os
import sys
import json
import hashlib
import argparse
from datetime import datetime

TOOL_METADATA = {
    "name": "security_hash_auditor",
    "description": "Scans system config files and databases for cryptographic drift, logging reports to the Obsidian vault.",
    "version": "1.0.0",
    "input_contract": {
        "--update-baseline": "Update the saved baseline json with the current computed hashes.",
        "--json": "Output format: JSON instead of styled terminal text.",
        "--describe": "Outputs the metadata schema for AI consumption."
    },
    "output_schema": {
        "timestamp": "ISO timestamp of the audit run.",
        "drift_detected": "Boolean indicating if any computed hash deviates from baseline.",
        "files_checked": "List of files verified with status: UNCHANGED | MODIFIED | NEW.",
        "report_path": "Absolute path to the logged Obsidian markdown note."
    }
}

TARGET_FILES = [
    "supernova.db",
    "Taskfile.yml",
    "config/paths.ts",
    "sentinel-os/eslint.config.mjs",
    ".agents/registry.json"
]

BASELINE_PATH = "/Users/alexanderanthony/outputs/security_audits/hash_baseline.json"
OBSIDIAN_VAULT_PATH = "/Users/alexanderanthony/AlexanderOSVault/05 Decisions"

def print_styled(message, category="info"):
    if "--json" in sys.argv:
        return
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    colors = {
        "info": "\033[94m[*] \033[0m",       # Blue
        "success": "\033[92m[+] \033[0m",    # Green
        "warning": "\033[93m[!] \033[0m",    # Yellow
        "error": "\033[91m[x] \033[0m"       # Red
    }
    prefix = colors.get(category, "")
    print(f"[{timestamp}] {prefix}{message}")

def self_describe():
    print(json.dumps(TOOL_METADATA, indent=2))
    sys.exit(0)

def compute_sha256(filepath):
    if not os.path.exists(filepath):
        return None
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(8192):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception:
        return None

def main():
    parser = argparse.ArgumentParser(description="Security Hash Auditor & Logger")
    parser.add_argument("--update-baseline", action="store_true", help="Update saved hash baseline")
    parser.add_argument("--json", action="store_true", help="Output in raw JSON format")
    parser.add_argument("--describe", action="store_true", help="Print tool description schema")
    
    args = parser.parse_args()
    
    if args.describe:
        self_describe()
        
    os.makedirs(os.path.dirname(BASELINE_PATH), exist_ok=True)
    os.makedirs(OBSIDIAN_VAULT_PATH, exist_ok=True)
    
    # Load existing baseline
    baseline = {}
    if os.path.exists(BASELINE_PATH):
        try:
            with open(BASELINE_PATH, 'r') as f:
                baseline = json.load(f)
        except Exception:
            print_styled("Corrupted baseline file. Initializing clean baseline.", "warning")
            
    current_hashes = {}
    files_checked = []
    drift_detected = False
    
    print_styled("Computing cryptographic hashes for system configuration targets...", "info")
    for f_rel in TARGET_FILES:
        f_abs = os.path.expanduser(f"~/ {f_rel}".replace(" ", ""))
        h = compute_sha256(f_abs)
        
        if h is None:
            files_checked.append({"file": f_rel, "status": "MISSING", "hash": None})
            continue
            
        current_hashes[f_rel] = h
        
        status = "UNCHANGED"
        if f_rel not in baseline:
            status = "NEW"
        elif baseline[f_rel] != h:
            status = "MODIFIED"
            drift_detected = True
            
        files_checked.append({"file": f_rel, "status": status, "hash": h[:12] + "..."})
        
    # Save baseline if requested
    if args.update_baseline or not baseline:
        with open(BASELINE_PATH, 'w') as f:
            json.dump(current_hashes, f, indent=2)
        print_styled(f"Cryptographic baseline updated successfully inside: {BASELINE_PATH}", "success")
        # Recalculate status for report since we just synced baseline
        for fc in files_checked:
            if fc["status"] == "NEW" or fc["status"] == "MODIFIED":
                fc["status"] = "UNCHANGED"
        drift_detected = False
        
    # Write report directly to the Obsidian Decisions directory
    now_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    report_filename = f"Security Hash Audit - {now_str}.md"
    report_path = os.path.join(OBSIDIAN_VAULT_PATH, report_filename)
    
    print_styled(f"Logging cryptographic integrity validation note to Obsidian: {report_path}", "info")
    
    md_content = f"""# 🔒 Cryptographic Security Audit Report
- **Date:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **Audit Mode:** ZK System Configuration Verification
- **Drift Detected:** {drift_detected}

## 📊 File Integrity Validation Results

| File Target | Hash Signature (Prefix) | Status |
| :--- | :--- | :---: |
"""
    for fc in files_checked:
        hash_val = fc["hash"] if fc["hash"] else "N/A"
        status_emoji = "✅" if fc["status"] in ("UNCHANGED", "NEW") else "❌"
        md_content += f"| `{fc['file']}` | `{hash_val}` | {status_emoji} **{fc['status']}** |\n"
        
    md_content += "\n## 🧬 System Summary\n"
    if drift_detected:
        md_content += "> [!CAUTION]\n> Cryptographic drift detected on database or config nodes. Verify configurations or update baseline using `python3 security_hash_auditor.py --update-baseline`.\n"
    else:
        md_content += "> [!NOTE]\n> Node validation complete. All checked configuration directories are aligned with the baseline ledger state.\n"
        
    with open(report_path, 'w') as f:
        f.write(md_content)
        
    result = {
        "timestamp": datetime.now().isoformat(),
        "drift_detected": drift_detected,
        "files_checked": files_checked,
        "report_path": report_path
    }
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("\n" + "="*40)
        print("🔒 SYSTEM INTEGRITY REPORT")
        print("="*40)
        print(f"Timestamp:    {result['timestamp']}")
        print(f"Drift:        {result['drift_detected']}")
        print(f"Obsidian Note: {result['report_path']}")
        print("-"*40)
        print("Target Status Summary:")
        for fc in files_checked:
            print(f"  - {fc['file']}: {fc['status']}")
        print("="*40)
        
    sys.exit(0 if not drift_detected else 2)

if __name__ == "__main__":
    main()
