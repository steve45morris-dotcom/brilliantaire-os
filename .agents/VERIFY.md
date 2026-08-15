# Verification Procedure (VERIFY.md)

This document provides automated and manual steps to verify that the project-local Antigravity skill installation is correct, safe, and discoverable.

## 🔎 File Structure Verification

Verify that the following file structure is present:
- [x] `.agents/README.md`
- [x] `.agents/SKILLS_MANIFEST.md`
- [x] `.agents/VERIFY.md`
- [x] `.agents/skills/` (containing precisely 10 folders)

---

## ⚡ Skill Validation Checks

1. **Safety Scan (Inspect Executable Code)**: Ensure that no unexpected executable binaries or scripts exist in the skill directory:
   ```sh
   find /Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills -type f \( -name "*.sh" -o -name "*.py" -o -name "*.js" \) ! -path "*api-design-principles/assets/rest-api-template.py"
   ```
   *Expectation:* No files should be returned (ensures zero-dependency safety).

2. **File Completeness**: Check that every skill folder has a valid `SKILL.md`:
   ```sh
   for d in /Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/.agents/skills/*; do
     if [ ! -f "$d/SKILL.md" ]; then
       echo "[-] Failure: Missing SKILL.md in $d"
     fi
   done
   ```
   *Expectation:* No error messages printed.

---

## 🤖 Antigravity CLI Smoke Test

To verify that the Antigravity CLI can discover and parse the local skills in your environment:

1. **Smoke Test Command**:
   ```sh
   agy --add-dir "/Users/alexanderanthony/codex-workspace/projects/brilliantaire-os" --print "Read AGENTS.md and list the installed repo-local skills."
   ```

2. **Interactive Run**:
   ```sh
   agy --add-dir "/Users/alexanderanthony/codex-workspace/projects/brilliantaire-os" -i --prompt "Read AGENTS.md, inspect .agents/skills, then help me work on this repo."
   ```

---

## 💻 Local Project Commands

To preview the repository's frontend locally:
- **Local Preview Server**:
  ```sh
  python3 scripts/serve.py
  ```
- **Local Web URLs**:
  - Landing Page: `http://127.0.0.1:8791/landing/`
  - Private Dashboard: `http://127.0.0.1:8791/dashboard/`
- **Direct Link Previews**:
  - Landing URL: `file:///Users/alexanderanthony/codex-workspace/projects/brilliantaire-os/landing/index.html`

---

## 🚨 Troubleshooting: What to do if Validation Fails

1. **Skills Not Found**: Ensure that the target directory is correctly added via `--add-dir` when running `agy`. Local skill directories override global ones.
2. **Missing Python Modules**: If `scripts/serve.py` fails with missing modules, ensure you are running it with the correct Python interpreter or local virtual environment.
3. **Unexpected Files**: If the safety scan returns new script files, inspect their contents before continuing work.
