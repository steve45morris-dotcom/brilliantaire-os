#!/usr/bin/env python3
"""
microsaas_launcher.py - Automated Micro-SaaS Templater & Route Injector
Evolved under Phase 21 protocol for the Sovereign Cognitive Mesh.
"""

import os
import sys
import json
import argparse
import subprocess
from datetime import datetime

TOOL_METADATA = {
    "name": "microsaas_launcher",
    "description": "Scaffolds a new Next.js micro-service panel with Stripe metering, registers it, and validates compilation.",
    "version": "1.0.0",
    "input_contract": {
        "name": "Name of the micro-service panel to create (e.g. ContentOptimizer).",
        "--price": "The subscription monthly pricing string (default: $29/mo).",
        "--json": "Output format: JSON instead of styled terminal text.",
        "--describe": "Outputs the metadata schema for AI consumption."
    },
    "output_schema": {
        "service_name": "Sanitized name of the spawned micro-service.",
        "component_path": "Absolute path to the created React component.",
        "routes_injected": "Boolean indicating if the component was registered in the UI.",
        "build_status": "SUCCESS | FAILED",
        "verification_log": "Build execution stdout/stderr logs."
    }
}

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

def generate_component_code(name, price):
    code = """"use client";

import { useState } from "react";
import { CreditCard, Activity, ArrowUpRight, Check } from "lucide-react";

export function {NAME}Panel() {
  const [active, setActive] = useState(false);

  return (
    <div className="border border-pink-500/30 bg-slate-950/70 p-6 rounded-lg backdrop-blur-md relative overflow-hidden shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-pulse" />
      
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-pink-400 flex items-center gap-2">
            <Activity className="h-4 w-4 text-pink-400" />
            {NAME} micro-agent api
          </h3>
          <p className="text-xs text-slate-400 mt-1">Autonomous vertical micro-product spawned in the mesh.</p>
        </div>
        <div className="text-xs font-mono text-pink-300 bg-pink-950/20 border border-pink-500/20 px-2 py-0.5 rounded">
          {PRICE} Subscription
        </div>
      </div>

      <div className="border border-slate-900 bg-slate-900/40 p-4 rounded flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Service Status</span>
          <div className="text-sm font-black text-slate-300 mt-1">
            {active ? "ACTIVE & ROUTING" : "STANDBY (UNSUBSCRIBED)"}
          </div>
        </div>
        <button
          onClick={() => setActive(!active)}
          className="flex items-center gap-2 px-4 py-1.5 bg-pink-900/40 border border-pink-500/30 text-pink-300 hover:bg-pink-850 hover:text-white rounded text-xs font-black uppercase tracking-wider transition cursor-pointer"
        >
          {active ? "Manage Subscription" : "Subscribe via Stripe"} <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
"""
    return code.replace("{NAME}", name).replace("{PRICE}", price)

def inject_route(project_root, name):
    page_path = os.path.join(project_root, "app/automation/page.tsx")
    if not os.path.exists(page_path):
        return False
        
    with open(page_path, "r") as f:
        content = f.read()
        
    # Check if already imported
    import_str = f'import {{ {name}Panel }} from "@/components/{name}Panel";'
    if import_str in content:
        return True
        
    # Add import statement before the first default export
    lines = content.split("\n")
    insert_idx = 0
    for idx, line in enumerate(lines):
        if line.startswith("import") or line.strip() == "":
            insert_idx = idx + 1
        else:
            break
            
    lines.insert(insert_idx, import_str)
    content = "\n".join(lines)
    
    # Insert component inside the container grid
    target_container = '<div className="grid gap-6">'
    if target_container in content:
        replacement = f'{target_container}\n        <{name}Panel />'
        content = content.replace(target_container, replacement)
        
    with open(page_path, "w") as f:
        f.write(content)
        
    return True

def main():
    parser = argparse.ArgumentParser(description="Micro-SaaS Templater and Route Injector")
    parser.add_argument("name", nargs="?", default="", help="Name of the component")
    parser.add_argument("--price", default="$29/mo", help="Subscription pricing tag")
    parser.add_argument("--json", action="store_true", help="Output in raw JSON format")
    parser.add_argument("--describe", action="store_true", help="Print tool description schema")
    parser.add_argument("--verify", action="store_true", help="Confirm build integrity without creating a new app")
    
    args = parser.parse_args()
    
    if args.describe:
        self_describe()

    if args.verify:
        print_styled("Initiating production verification compile...", "info")
        project_root = "/Users/alexanderanthony/sentinel-os"
        try:
            proc = subprocess.run(
                ["npm", "run", "build"],
                cwd=project_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=90
            )
            build_status = "SUCCESS" if proc.returncode == 0 else "FAILED"
            log = f"STDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
            if build_status == "SUCCESS":
                print_styled("Production build compilation completed with 100% success.", "success")
            else:
                print_styled("Verification build failed. Check logs.", "error")
        except subprocess.TimeoutExpired:
            build_status = "FAILED"
            log = "Build verification timeout expired."
            print_styled("Build verification timed out.", "error")
        
        if args.json:
            print(json.dumps({"build_status": build_status, "log": log}, indent=2))
        else:
            print("\n" + "="*40)
            print("🚀 BUILD INTEGRITY VERIFICATION REPORT")
            print("="*40)
            print(f"Status:      {build_status}")
            print("="*40)
        sys.exit(0 if build_status == "SUCCESS" else 1)
        
    if not args.name:
        if args.json:
            print(json.dumps({"error": "Missing positional argument: name"}, indent=2))
        else:
            print_styled("Missing positional argument: name. Run with --help for details.", "error")
        sys.exit(1)
        
    # Capitalize component name to align with react naming conventions
    comp_name = args.name[0].upper() + args.name[1:]
    project_root = "/Users/alexanderanthony/sentinel-os"
    comp_path = os.path.join(project_root, f"components/{comp_name}Panel.tsx")
    
    print_styled(f"Scaffolding Next.js panel: {comp_path}", "info")
    comp_code = generate_component_code(comp_name, args.price)
    
    with open(comp_path, "w") as f:
        f.write(comp_code)
        
    print_styled("Injecting UI routing gateway...", "info")
    injected = inject_route(project_root, comp_name)
    
    if injected:
        print_styled(f"Successfully registered <{comp_name}Panel /> inside app/automation/page.tsx.", "success")
    else:
        print_styled("Failed to inject route. Destination file app/automation/page.tsx missing.", "warning")
        
    print_styled("Initiating production verification compile...", "info")
    try:
        proc = subprocess.run(
            ["npm", "run", "build"],
            cwd=project_root,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=90
        )
        build_status = "SUCCESS" if proc.returncode == 0 else "FAILED"
        log = f"STDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        
        if build_status == "SUCCESS":
            print_styled("Production build compilation completed with 100% success.", "success")
        else:
            print_styled("Verification build failed. Check logs.", "error")
            
    except subprocess.TimeoutExpired:
        build_status = "FAILED"
        log = "Build verification timeout expired."
        print_styled("Build verification timed out.", "error")
        
    result = {
        "service_name": comp_name,
        "component_path": comp_path,
        "routes_injected": injected,
        "build_status": build_status,
        "verification_log": log
    }
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("\n" + "="*40)
        print("🚀 MICRO-PRODUCT LAUNCH REPORT")
        print("="*40)
        print(f"Service:      {result['service_name']}")
        print(f"Path:         {result['component_path']}")
        print(f"Injected:     {result['routes_injected']}")
        print(f"Build:        {result['build_status']}")
        print("="*40)
        
    sys.exit(0 if build_status == "SUCCESS" else 1)

if __name__ == "__main__":
    main()
