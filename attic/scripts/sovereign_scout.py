import json
import os
import subprocess
import sqlite3
from datetime import datetime, timedelta
import re

CONFIG_PATH = "system/scout_config.json"
SKILLS_INDEX_PATH = "skills_index.json"

def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def run_command(command, cwd=None):
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd)
    stdout, stderr = process.communicate()
    return stdout.decode(), stderr.decode(), process.returncode

def scout_repo(repo_url, config):
    print(f"[*] Scouting repository: {repo_url}")
    repo_name = repo_url.split('/')[-1]
    audit_path = os.path.join(config['audit_dir'], repo_name)
    
    if os.path.exists(audit_path):
        run_command(f"rm -rf {audit_path}")
    
    os.makedirs(config['audit_dir'], exist_ok=True)
    
    # Clone for analysis
    stdout, stderr, code = run_command(f"git clone --depth 1 {repo_url} {audit_path}")
    if code != 0:
        print(f"[!] Failed to clone {repo_url}: {stderr}")
        return None

    # Check for SKILL.md or llms-full.txt
    skills_found = []
    for root, dirs, files in os.walk(audit_path):
        if 'SKILL.md' in files or 'llms-full.txt' in files:
            skill_file = 'SKILL.md' if 'SKILL.md' in files else 'llms-full.txt'
            skills_found.append(os.path.join(root, skill_file))
            
    return skills_found

def sandbox_test(skill_path):
    print(f"[*] Sandboxing skill: {skill_path}")
    # Simple validation: check if it's readable and contains basic structure
    with open(skill_path, 'r') as f:
        content = f.read()
    
    if len(content) < 50:
        return False, "Skill content too short"
    
    # Check for required headers or YAML frontmatter
    if skill_path.endswith('SKILL.md'):
        has_headers = "# SKILL:" in content or "## purpose" in content.lower()
        has_frontmatter = content.startswith('---') and "name:" in content and "description:" in content
        
        if not (has_headers or has_frontmatter):
            return False, "Missing mandatory SKILL headers or YAML frontmatter"
            
    # Run 'Fast' test on Antigravity (Mocked for now)
    return True, "Passed basic validation"


def merge_skill(skill_path, config):
    skill_name = os.path.basename(os.path.dirname(skill_path))
    target_dir = os.path.join(config['skills_dir'], skill_name)
    
    if os.path.exists(target_dir):
        print(f"[*] Skill {skill_name} already exists. Merging/Updating.")
        # Logic to check versions would go here
        
    os.makedirs(target_dir, exist_ok=True)
    # Using 'cp' to keep it simple
    run_command(f"cp {skill_path} {target_dir}/SKILL.md")
    print(f"[+] Skill {skill_name} merged into {target_dir}")
    return target_dir

def log_discovery(repo_url, summary, config):
    conn = sqlite3.connect(config['db_path'])
    cursor = conn.cursor()
    
    last_updated = datetime.now().isoformat()
    full_name = repo_url.replace("https://github.com/", "")
    
    cursor.execute("""
        INSERT INTO repo_signals (full_name, name, html_url, summary, last_updated, decision_state)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
        ON CONFLICT(full_name) DO UPDATE SET
            summary = excluded.summary,
            last_updated = excluded.last_updated
    """, (full_name, full_name.split('/')[-1], repo_url, summary, last_updated))
    
    conn.commit()
    conn.close()
    print(f"[*] Logged discovery to supernova.db")

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--force-sandbox", action="store_true", help="Force sandbox test and merge for all skills in audit dir")
    args = parser.parse_args()
    
    config = load_config()
    
    if args.force_sandbox:
        print(f"[*] FORCING Batch Sandbox Test for all skills in {config['audit_dir']}...")
        skills_found = []
        for root, dirs, files in os.walk(config['audit_dir']):
            if 'SKILL.md' in files:
                skills_found.append(os.path.join(root, 'SKILL.md'))
        
        for skill in skills_found:
            success, msg = sandbox_test(skill)
            if success:
                merge_skill(skill, config)
                log_discovery("Batch Integration", f"Skill validated and merged: {skill}", config)
            else:
                print(f"[!] Sandbox failed for {skill}: {msg}")
    else:
        for repo in config['upstream_repos']:
            skills = scout_repo(repo, config)
            if skills:
                for skill in skills:
                    success, msg = sandbox_test(skill)
                    if success:
                        merge_skill(skill, config)
                        log_discovery(repo, f"New skill found and merged: {os.path.basename(os.path.dirname(skill))}", config)
                    else:
                        print(f"[!] Sandbox failed for {skill}: {msg}")
            else:
                print(f"[*] No new skills found in {repo}")

    # Re-run ingestion to update the index
    run_command("python3 ingest_skills.py")

if __name__ == "__main__":
    main()
