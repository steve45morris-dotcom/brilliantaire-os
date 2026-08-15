#!/usr/bin/env python3
import os
import re
import json

# Define directory roots
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MARKDOWN_PATH = os.path.join(BASE_DIR, "brain", "00-command-center", "Command Center.md")
WEEKLY_JSON_PATH = os.path.join(BASE_DIR, "data", "weekly.json")
PROJECTS_JSON_PATH = os.path.join(BASE_DIR, "data", "projects.json")

def parse_outcomes(content):
    """Extract outcomes list under ## This Week's Three Outcomes"""
    outcomes = []
    # Find section
    match = re.search(r"## This Week's Three Outcomes\s*\n(.*?)(?=\n##|$)", content, re.DOTALL)
    if match:
        section_text = match.group(1)
        # Parse numbered list
        for line in section_text.splitlines():
            line = line.strip()
            # Match "1. Outcome Text"
            if re.match(r"^\d+\.\s+", line):
                outcome_text = re.sub(r"^\d+\.\s+", "", line)
                outcomes.append(outcome_text)
    return outcomes

def parse_lanes_table(content):
    """Extract active lanes from markdown table under ## Active Lanes"""
    lanes = []
    # Find section
    match = re.search(r"## Active Lanes\s*\n(.*?)(?=\n##|$)", content, re.DOTALL)
    if match:
        section_text = match.group(1)
        lines = [l.strip() for l in section_text.splitlines() if l.strip()]
        # Skip header and separator rows if present
        for line in lines:
            if "|" in line:
                # Split cells
                cells = [c.strip() for c in line.split("|")[1:-1]]
                # Verify it is not a header separator line (e.g. | --- |) and has 4 columns
                if cells and not all(c.startswith("-") for c in cells) and len(cells) >= 4:
                    if cells[0].lower() != "lane":  # Skip header row
                        lanes.append({
                            "lane": cells[0],
                            "focus": cells[1],
                            "next_move": cells[2],
                            "status": cells[3]
                        })
    return lanes

def map_status(status_str):
    """Map Obsidian status column to Next.js dashboard project status enum"""
    status = status_str.strip().lower()
    if "active" in status or "building" in status:
        return "building"
    elif "draft" in status:
        return "draft"
    elif "shipped" in status or "completed" in status:
        return "shipped"
    else:  # later, concept, etc
        return "concept"

def main():
    print("[*] Starting Obsidian Vault synchronization...")

    if not os.path.exists(MARKDOWN_PATH):
        print(f"[!] Target Command Center note not found at: {MARKDOWN_PATH}")
        return

    # 1. Read Markdown content
    with open(MARKDOWN_PATH, "r", encoding="utf-8") as f:
        md_content = f.read()

    parsed_outcomes = parse_outcomes(md_content)
    parsed_lanes = parse_lanes_table(md_content)

    print(f"[*] Parsed {len(parsed_outcomes)} outcomes and {len(parsed_lanes)} active lane records from Command Center.md")

    # 2. Synchronize weekly.json
    if parsed_outcomes and os.path.exists(WEEKLY_JSON_PATH):
        with open(WEEKLY_JSON_PATH, "r", encoding="utf-8") as f:
            weekly_data = json.load(f)
        
        # Check if outcomes changed
        if weekly_data.get("outcomes") != parsed_outcomes:
            print("[+] Outcomes updated in weekly.json")
            weekly_data["outcomes"] = parsed_outcomes
            # Reset completed indexes if outcomes list changes to prevent index errors
            weekly_data["completed_outcomes"] = []
            
            with open(WEEKLY_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(weekly_data, f, indent=2)
        else:
            print("[-] outcomes weekly.json already synchronized")
    else:
        print("[!] weekly.json file missing or no outcomes parsed.")

    # 3. Synchronize projects.json
    if parsed_lanes and os.path.exists(PROJECTS_JSON_PATH):
        with open(PROJECTS_JSON_PATH, "r", encoding="utf-8") as f:
            projects_data = json.load(f)

        project_list = projects_data.get("projects", [])
        updated_count = 0
        added_count = 0

        for lane_data in parsed_lanes:
            lane_name = lane_data["lane"]
            focus_name = lane_data["focus"]
            next_move = lane_data["next_move"]
            mapped_st = map_status(lane_data["status"])

            # Check if project with this lane exists
            matched_project = None
            for p in project_list:
                if p["lane"].lower() == lane_name.lower():
                    matched_project = p
                    break

            if matched_project:
                # Update existing project coordinates
                matched_project["name"] = focus_name
                matched_project["next_action"] = next_move
                matched_project["status"] = mapped_st
                updated_count += 1
            else:
                # Add a new project node
                proj_id = lane_name.lower().replace(" ", "-") + "-concept"
                new_proj = {
                  "id": proj_id,
                  "name": focus_name,
                  "lane": lane_name,
                  "status": mapped_st,
                  "priority": "medium",
                  "next_action": next_move,
                  "output": "Synchronized from Obsidian Center"
                }
                project_list.append(new_proj)
                added_count += 1

        projects_data["projects"] = project_list
        with open(PROJECTS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(projects_data, f, indent=2)

        print(f"[+] Projects sync completed: {updated_count} updated, {added_count} new nodes registered.")
    else:
        print("[!] projects.json file missing or no lanes parsed.")

if __name__ == "__main__":
    main()
