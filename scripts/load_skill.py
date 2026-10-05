import json
import os
import argparse
import re
import sys
from datetime import datetime
import subprocess

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def log_decision(log_file, decision):
    with open(log_file, 'a') as f:
        f.write(json.dumps(decision) + '\n')

def match_skill(request, router):
    # Sort routes by priority if available
    sorted_routes = sorted(router['routes'], key=lambda x: x.get('priority', 0), reverse=True)
    
    # First pass: look for exact match signals or input_patterns (more specific)
    for route in sorted_routes:
        # Check input_pattern first as it's typically more specific
        input_pattern = route.get('input_pattern')
        if input_pattern and re.search(input_pattern, request, re.IGNORECASE):
            return route.get('skill_id') or route.get('skill_name')
        
        # Check match_signals
        for signal in route.get('match_signals', []):
            if signal.lower() in request.lower():
                return route.get('skill_id') or route.get('skill_name')
    
    # Second pass: fallback to simple patterns (less specific)
    for route in sorted_routes:
        pattern = route.get('pattern')
        if pattern and re.search(pattern, request, re.IGNORECASE):
            return route.get('skill_id') or route.get('skill_name')
                
    return router['fallback_skill_id']

def check_env(skill, available_tools):
    required_tools = skill.get('tools_required', [])
    missing = [t for t in required_tools if t not in available_tools]
    return missing

def main():
    parser = argparse.ArgumentParser(description="Skill Loader for Gemini CLI")
    parser.add_argument("--request", required=True, help="User request string")
    parser.add_argument("--tools", default="", help="Comma-separated list of available tools")
    parser.add_argument("--artifacts", default="", help="Comma-separated list of available artifacts")
    parser.add_argument("--dry-run", action="store_true", help="Print details without invoking Gemini CLI")
    parser.add_argument("--json", action="store_true", help="Output result as JSON")

    args = parser.parse_args()

    registry_path = "system/registry/system_registry.json"
    router_path = "system/registry/execution_router.json"
    config_path = "system/registry/loader_config.json"

    registry = load_json(registry_path)
    router = load_json(router_path)
    config = load_json(config_path)

    available_tools = [t.strip() for t in args.tools.split(',') if t.strip()]
    
    skill_id = match_skill(args.request, router)
    selected_skill = next((s for s in registry['skills'] if s['id'] == skill_id), None)

    if not selected_skill:
        print(f"Error: Skill ID '{skill_id}' not found in registry.", file=sys.stderr)
        sys.exit(1)

    missing_tools = check_env(selected_skill, available_tools)
    
    decision = {
        "timestamp": datetime.utcnow().isoformat(),
        "request": args.request,
        "selected_skill_id": skill_id,
        "skill_path": selected_skill['path'],
        "missing_tools": missing_tools,
        "status": "ready" if not missing_tools else "missing_dependencies"
    }

    log_decision(config['log_file'], decision)

    if args.json:
        print(json.dumps(decision, indent=2))
        if args.dry_run:
            return

    skill_content = ""
    if os.path.exists(selected_skill['path']):
        with open(selected_skill['path'], 'r') as f:
            skill_content = f.read()
    else:
        print(f"Error: Skill file not found at {selected_skill['path']}", file=sys.stderr)
        sys.exit(1)

    if not args.json and not args.dry_run:
        print(f"Loading skill: {selected_skill['name']} ({skill_id})")
        if missing_tools:
            print(f"Warning: Missing required tools: {', '.join(missing_tools)}", file=sys.stderr)

    if args.dry_run:
        if not args.json:
            print(f"Dry Run: Selected skill {skill_id} at {selected_skill['path']}")
            print(f"Missing tools: {missing_tools}")
        return

    # Pass the skill and original request to Gemini CLI via stdin
    full_prompt = f"User Request: {args.request}\n\nSkill Instruction:\n{skill_content}"
    
    try:
        # Use gemini -p "" to read from stdin as per help docs
        process = subprocess.Popen([config['gemini_cli_command'], "-p", ""], stdin=subprocess.PIPE)
        process.communicate(input=full_prompt.encode())
    except FileNotFoundError:
        print(f"Error: {config['gemini_cli_command']} not found in PATH.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
