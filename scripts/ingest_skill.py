import json
import os
import argparse
import re
import sys

def load_json(path):
    if not os.path.exists(path):
        return {"skills": []} if "registry" in path else {"routes": [], "fallback_skill_id": "manual-skill-review"}
    with open(path, 'r') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

def parse_skill_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Extract ID from filename or content
    skill_id = os.path.basename(os.path.dirname(file_path))
    if not skill_id or skill_id == "pending":
        # Try to find ID in content
        match = re.search(r"skill name\s*\n\s*(.*)", content, re.IGNORECASE)
        if match:
            skill_id = match.group(1).strip().lower().replace(" ", "-")
        else:
            skill_id = "unknown-skill-" + str(os.path.getmtime(file_path))

    # Extract Name
    name_match = re.search(r"# SKILL:\s*(.*)", content)
    name = name_match.group(1).strip() if name_match else skill_id.replace("-", " ").title()

    # Extract Purpose/Description
    desc_match = re.search(r"## purpose\s*\n\s*(.*)", content, re.IGNORECASE)
    description = desc_match.group(1).strip() if desc_match else "No description provided."

    return {
        "id": skill_id,
        "name": name,
        "path": file_path,
        "description": description,
        "tools_required": ["gemini"] # Default
    }

def main():
    parser = argparse.ArgumentParser(description="Ingest a new skill into the system.")
    parser.add_argument("--file", required=True, help="Path to the SKILL.md file")
    parser.add_argument("--jsonfix", help="Handle JSON errors")

    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: File {args.file} not found.")
        sys.exit(1)

    skill_data = parse_skill_file(args.file)
    
    # Move file to permanent location if in intake
    if "intake/pending" in args.file:
        permanent_dir = f".agents/skills/{skill_data['id']}"
        os.makedirs(permanent_dir, exist_ok=True)
        new_path = os.path.join(permanent_dir, "SKILL.md")
        os.rename(args.file, new_path)
        skill_data["path"] = new_path
        print(f"[*] Moved skill to {new_path}")

    # Update Registry
    registry_path = "system/registry/system_registry.json"
    registry = load_json(registry_path)
    
    # Check if exists
    if any(s["id"] == skill_data["id"] for s in registry["skills"]):
        print(f"[*] Skill {skill_data['id']} already exists in registry. Updating.")
        registry["skills"] = [s if s["id"] != skill_data["id"] else skill_data for s in registry["skills"]]
    else:
        registry["skills"].append(skill_data)
        print(f"[+] Added {skill_data['id']} to registry.")
    
    save_json(registry_path, registry)

    # Update Router
    router_path = "system/registry/execution_router.json"
    router = load_json(router_path)
    
    # Simple pattern generation based on ID
    pattern = skill_data["id"].replace("-", ".*|") + ".*"
    
    if not any(r["skill_id"] == skill_data["id"] for r in router["routes"]):
        router["routes"].append({
            "pattern": pattern,
            "skill_id": skill_data["id"]
        })
        print(f"[+] Added route for {skill_data['id']}.")
        save_json(router_path, router)

    print("[!] Ingestion complete.")

if __name__ == "__main__":
    main()
