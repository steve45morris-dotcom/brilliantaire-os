#!/usr/bin/env python3
"""
System Duplicate Check Tool for Brilliantaire OS
Scans the filesystem for duplicate files, workflows, and projects.
Outputs a structured markdown report and provides cleanup recommendations.
"""

import os
import hashlib
import re
from pathlib import Path
from collections import defaultdict

# Setup directories to ignore entirely to prevent scanning system files or vendor dependencies
EXCLUDED_DIR_NAMES = {
    ".Trash", "Library", "node_modules", ".cache", ".npm", ".pnpm-store",
    ".cursor", ".codex", ".git", ".continue", ".nvm", ".pyenv", ".bun",
    "Applications", "Downloads", "Pictures", "Music", "Movies", "Documents",
    "Desktop", "Google Drive", "venv", "env", "__pycache__", "dist",
    "venv_stable", ".gemini", "node_modules"
}

# Subdirectories of workspace that should be scanned
TARGET_ROOT = Path("/Users/alexanderanthony")

def get_file_hash(filepath: Path) -> str:
    """Compute SHA-256 hash of a file's contents."""
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(8192):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception as e:
        return f"ERROR: {str(e)}"

def scan_files(root_dir: Path):
    """Traverse directories and group files by size and hash, and check for duplicates."""
    files_by_size = defaultdict(list)
    backup_files = []
    
    # Simple walk with exclusion rules
    for root, dirs, files in os.walk(root_dir):
        current_path = Path(root)
        
        # Modify dirs in-place to skip excluded directories and hidden directories
        # Note: we want to allow .agents/workflows and .agents/skills
        dirs[:] = [
            d for d in dirs 
            if d not in EXCLUDED_DIR_NAMES 
            and (not d.startswith('.') or d in {".agents", "workflows", "skills"})
        ]
        
        for file in files:
            file_path = current_path / file
            
            # Skip hidden files unless they are inside .agents/
            if file.startswith('.') and ".agents" not in file_path.parts:
                continue
                
            try:
                # Check file existence and symlinks
                if file_path.is_symlink() or not file_path.exists():
                    continue
                
                size = file_path.stat().st_size
                files_by_size[size].append(file_path)
                
                # Check for backup patterns: e.g., *_backup*, *.bak, *.tmp, *_1780073595.*, etc.
                is_backup = (
                    "_backup" in file.lower() or 
                    file.endswith(".bak") or 
                    file.endswith(".tmp") or
                    file.endswith(".backup") or
                    re.search(r'_\d{10}\.', file) or # Unix timestamps: _1780073595.md
                    re.search(r'\s\(\d+\)\.', file)  # Copy formats: File (1).md
                )
                if is_backup:
                    backup_files.append(file_path)
                    
            except Exception:
                continue
                
    # Now compute hashes for files sharing the same size (potential duplicates)
    exact_duplicates = defaultdict(list)
    for size, paths in files_by_size.items():
        if len(paths) > 1 and size > 0: # ignore empty files
            for p in paths:
                h = get_file_hash(p)
                if not h.startswith("ERROR"):
                    exact_duplicates[h].append(p)
                    
    # Filter out entries that only have 1 file (no duplicates)
    exact_duplicates = {h: paths for h, paths in exact_duplicates.items() if len(paths) > 1}
    
    # Find name collisions (files with identical names but different paths/contents)
    name_to_paths = defaultdict(list)
    for root, dirs, files in os.walk(root_dir):
        current_path = Path(root)
        dirs[:] = [
            d for d in dirs 
            if d not in EXCLUDED_DIR_NAMES 
            and (not d.startswith('.') or d in {".agents", "workflows", "skills"})
        ]
        for file in files:
            file_path = current_path / file
            if file.startswith('.') and ".agents" not in file_path.parts:
                continue
            if not file_path.is_symlink() and file_path.exists():
                name_to_paths[file].append(file_path)
                
    name_collisions = {name: paths for name, paths in name_to_paths.items() if len(paths) > 1}
    
    return exact_duplicates, backup_files, name_collisions

def parse_projects_md(projects_file: Path) -> list[str]:
    """Parse PROJECTS.md and return project names found in the markdown table."""
    project_names = []
    if not projects_file.exists():
        return project_names
    try:
        with open(projects_file, 'r', encoding='utf-8') as f:
            for line in f:
                # Find bold names in table row format: | **Name** | ...
                match = re.match(r'^\s*\|\s*\*\*([^*]+)\*\*\s*\|', line)
                if match:
                    project_names.append(match.group(1).strip())
    except Exception as e:
        print(f"Error parsing PROJECTS.md: {e}")
    return project_names

def check_workflows(root_dir: Path):
    """Scan and verify workflows in .agents/workflows and AlexanderOSVault/03 Workflows."""
    agents_workflows_dir = root_dir / ".agents" / "workflows"
    obsidian_workflows_dir = root_dir / "AlexanderOSVault" / "03 Workflows"
    local_workflows_dir = root_dir / "workflows"
    
    wf_files = []
    
    for d in [agents_workflows_dir, obsidian_workflows_dir, local_workflows_dir]:
        if d.exists() and d.is_dir():
            for f in d.iterdir():
                if f.is_file() and f.suffix == ".md":
                    wf_files.append(f)
                    
    # Group workflows by base filename to check if same workflow is in multiple dirs
    wf_by_name = defaultdict(list)
    for wf in wf_files:
        wf_by_name[wf.name].append(wf)
        
    wf_duplicates = {name: paths for name, paths in wf_by_name.items() if len(paths) > 1}
    return wf_files, wf_duplicates

def check_projects(root_dir: Path):
    """Scan and check projects in Projects/ and TreeGrooveProjects/ against PROJECTS.md."""
    projects_md = root_dir / "PROJECTS.md"
    registered_projects = parse_projects_md(projects_md)
    
    projects_dir = root_dir / "Projects"
    tg_projects_dir = root_dir / "TreeGrooveProjects"
    
    dir_projects = []
    for d in [projects_dir, tg_projects_dir]:
        if d.exists() and d.is_dir():
            for sub in d.iterdir():
                if sub.is_dir() and not sub.name.startswith('.'):
                    dir_projects.append((sub.name, sub))
                    
    # Check directory name collisions between Projects/ and TreeGrooveProjects/
    dir_collisions = defaultdict(list)
    for name, p in dir_projects:
        dir_collisions[name.lower()].append(p)
        
    dir_duplicates = {name: paths for name, paths in dir_collisions.items() if len(paths) > 1}
    
    # Cross-reference with PROJECTS.md
    unregistered_dirs = []
    registered_names_lower = {name.lower() for name in registered_projects}
    
    for name, p in dir_projects:
        # Check if the folder name matches registered projects
        if name.lower() not in registered_names_lower and name not in ["one-system"]:
            # Perform a fuzzy check (e.g. replacing dashes or underscores)
            normalized_name = name.lower().replace("-", " ").replace("_", " ")
            matched = False
            for reg in registered_projects:
                normalized_reg = reg.lower().replace("-", " ").replace("_", " ")
                if normalized_name in normalized_reg or normalized_reg in normalized_name:
                    matched = True
                    break
            if not matched:
                unregistered_dirs.append((name, p))
                
    return registered_projects, dir_duplicates, unregistered_dirs

def main():
    print("🔍 Beginning system duplicate scan...")
    exact_duplicates, backup_files, name_collisions = scan_files(TARGET_ROOT)
    wf_files, wf_duplicates = check_workflows(TARGET_ROOT)
    registered_projects, dir_duplicates, unregistered_dirs = check_projects(TARGET_ROOT)
    
    report_content = []
    report_content.append("# 🔍 System Audit: Duplicate Detection Report")
    report_content.append(f"Generated at: {Path().cwd()}\n")
    
    # 1. Exact Duplicate Files Section
    report_content.append("## 📁 1. Exact Duplicate Files (Identical Content Hash)")
    report_content.append("These files have identical SHA-256 content hashes and can be safely deduped/merged.\n")
    if exact_duplicates:
        report_content.append("| Hash | Duplicated Files |")
        report_content.append("|---|---|")
        for h, paths in sorted(exact_duplicates.items(), key=lambda x: len(x[1]), reverse=True):
            # Format path list as clickable links
            path_links = "<br>".join([f"[{p.relative_to(TARGET_ROOT)}](file://{p})" for p in paths])
            report_content.append(f"| `{h[:12]}` | {path_links} |")
    else:
        report_content.append("✅ No exact content duplicates found.\n")
    report_content.append("\n")
    
    # 2. Backup / Temporary Files Section
    report_content.append("## ⏳ 2. Temporary / Backup Files")
    report_content.append("Files matching backup patterns, copies, or Unix timestamps (e.g. `_1780073595.md`). These are candidate files for archiving or deletion.\n")
    if backup_files:
        report_content.append("| File Name | Path |")
        report_content.append("|---|---|")
        for p in sorted(backup_files):
            report_content.append(f"| `{p.name}` | [{p.relative_to(TARGET_ROOT)}](file://{p}) |")
    else:
        report_content.append("✅ No temporary or backup files detected.\n")
    report_content.append("\n")
    
    # 3. Name Collisions Section
    report_content.append("## 💥 3. Name Collisions (Identical Filename, Different Contents)")
    report_content.append("Files that share the same filename but differ in location and content. Please verify if these represent branch divergences or distinct resources.\n")
    # Filter out known common files (like README.md, package.json, tsconfig.json, docker-compose.yml) from collisions to reduce noise
    noise_files = {"package.json", "tsconfig.json", "README.md", "docker-compose.yml", ".gitignore", "Taskfile.yml", ".DS_Store"}
    filtered_collisions = {k: v for k, v in name_collisions.items() if k not in noise_files}
    
    if filtered_collisions:
        report_content.append("| File Name | Locations |")
        report_content.append("|---|---|")
        for name, paths in sorted(filtered_collisions.items()):
            path_links = "<br>".join([f"[{p.relative_to(TARGET_ROOT)}](file://{p})" for p in paths])
            report_content.append(f"| `{name}` | {path_links} |")
    else:
        report_content.append("✅ No unexpected filename collisions found.\n")
    report_content.append("\n")
    
    # 4. Workflows Audit Section
    report_content.append("## 🤖 4. Workflow Integrity Audit")
    report_content.append("Verification of workflow definitions across `.agents/workflows` and Obsidian vaults.\n")
    
    if wf_duplicates:
        report_content.append("### ⚠️ Overlapping Workflow Files")
        report_content.append("The same workflow name exists in multiple locations:\n")
        report_content.append("| Workflow | Locations |")
        report_content.append("|---|---|")
        for name, paths in wf_duplicates.items():
            path_links = "<br>".join([f"[{p.relative_to(TARGET_ROOT)}](file://{p})" for p in paths])
            report_content.append(f"| `{name}` | {path_links} |")
    else:
        report_content.append("✅ No overlapping workflow files across directories.")
        
    report_content.append(f"\nTotal workflows scanned: {len(wf_files)}\n")
    report_content.append("\n")
    
    # 5. Projects Matrix Audit Section
    report_content.append("## 📂 5. Project Matrix Audit")
    report_content.append("Verification of code project directories vs `PROJECTS.md` configuration matrix.\n")
    
    if dir_duplicates:
        report_content.append("### ⚠️ Duplicated Project Folders")
        report_content.append("Project directories with matching names across `Projects/` and `TreeGrooveProjects/`:\n")
        report_content.append("| Project Folder | Paths |")
        report_content.append("|---|---|")
        for name, paths in dir_duplicates.items():
            path_links = "<br>".join([f"[{p.relative_to(TARGET_ROOT)}](file://{p})" for p in paths])
            report_content.append(f"| `{name}` | {path_links} |")
    else:
        report_content.append("✅ No duplicate project folders found across directories.\n")
        
    if unregistered_dirs:
        report_content.append("### 🧭 Unregistered Project Folders")
        report_content.append("Local project folders not documented in `PROJECTS.md`:\n")
        report_content.append("| Folder Name | Path |")
        report_content.append("|---|---|")
        for name, p in unregistered_dirs:
            report_content.append(f"| `{name}` | [{p.relative_to(TARGET_ROOT)}](file://{p}) |")
    else:
        report_content.append("✅ All active local project folders are properly registered in `PROJECTS.md`.\n")
        
    report_content.append("\n")
    
    # 6. Actionable Recommendations
    report_content.append("## 🛠️ Actionable Recommendations")
    report_content.append("1. **Remove Timestamped Duplicates in Obsidian Briefs**:")
    report_content.append("   - The generator has left duplicate copies of daily briefs, next-actions, decisions, and projects files in `AlexanderOSVault/brilliantaire-briefs/` with unix timestamp suffixes (e.g., `*_1780073595.md`).")
    report_content.append("   - These should be cleaned up or archived to prevent search pollution and double-counting in scripts.")
    report_content.append("2. **De-duplicate Exact Files**:")
    report_content.append("   - Clean up exact copy duplicates if they are not needed for backup or isolation.")
    report_content.append("3. **Register or Archive Unregistered Directories**:")
    report_content.append("   - Decide whether to archive or register folders like those identified under Unregistered Project Folders.")
    
    report_str = "\n".join(report_content)
    
    # Write report locally
    reports_output_dir = TARGET_ROOT / "reports"
    reports_output_dir.mkdir(exist_ok=True)
    report_file_path = reports_output_dir / "duplicate_audit_report.md"
    with open(report_file_path, "w", encoding="utf-8") as f:
        f.write(report_str)
        
    print(f"\n🎉 System Duplicate Audit Complete! Report saved to {report_file_path}")
    print("\n--- Summary of Findings ---")
    print(f"- Exact content duplicate groups: {len(exact_duplicates)}")
    print(f"- Backup/Timestamped files: {len(backup_files)}")
    print(f"- Workflow overlaps: {len(wf_duplicates)}")
    print(f"- Project folder collisions: {len(dir_duplicates)}")
    print(f"- Unregistered project folders: {len(unregistered_dirs)}")

if __name__ == "__main__":
    main()
