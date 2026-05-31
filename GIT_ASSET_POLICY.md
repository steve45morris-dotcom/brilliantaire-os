# 🛡️ Git Asset Policy: Brilliantaire OS

This document outlines the repository hygiene, size constraints, and file exclusions enforced to maintain system stability and prevent heavy tracking overhead or authentication-related timeouts during deployment.

---

## 🚫 Why Large & Unwanted Assets are Blocked
Large binaries, neural network models (ONNX, PyTorch), and audio caches (.wav, .mp3) degrade Git performance. Pushing massive changesets over standard HTTPS protocols triggers OS keychain credential prompts and connection timeouts in sandboxed agent environments.

---

## 📂 Forbidden Folders
The following directories must remain untracked and excluded from source control:
- `local_assets/` (Local model caches and staging folders)
- `outputs/narrator/tts_queue/models/` (Narrator models and checkpoints)
- `outputs/narrator/tts_queue/rendered_audio/` (Rendered voice synthesis output files)
- `node_modules/` & `dashboard/node_modules/` (Package dependencies)
- `dist/` & `build/` (TypeScript compiled target code)
- `.next/`, `.astro/` (Framework build artifacts)
- `.venv/`, `__pycache__/` (Python virtual environments and compiler caches)

---

## 🛑 Forbidden Extensions
Any file ending with the following extensions is strictly forbidden:
- **Audio/Video:** `.wav`, `.mp3`, `.mp4`, `.mov`
- **Archives:** `.tar.gz`, `.zip`, `.7z`
- **Models/Weights:** `.onnx`, `.bin`, `.pt`, `.pth`, `.ckpt`, `.safetensors`

---

## 🔐 Sensitive Secrets
No private environment credentials or service configuration secrets may be tracked:
- `.env`, `.env.local`, `.env.production`
- `service-account.json`
- `credentials.json`, `token.json`

---

## ⚖️ Maximum File Size Limit
Files tracked by Git must never exceed **25 MB**.

---

## 📦 Local Model & Generated Audio Management
All voice models, speech libraries, and synthesizers must reside strictly locally under git-ignored paths (e.g. `local_assets/` or the global cache). They should be fetched dynamically or installed at runtime through setup scripts (`npm run narrator-tts-models`), rather than committed into repository history.

---

## 🛠️ Recovery Rules (Accidental Tracking)
If forbidden assets are accidentally committed or staged:
1. **Do not use force push (`git push --force`)** as this disrupts the shared commit tree history.
2. Remove the file from the tracking index while keeping it on your local system:
   ```bash
   git rm --cached <filepath>
   ```
3. Verify your repository status:
   ```bash
   git status
   ```
4. Verify safety check sequence:
   ```bash
   npm run git-prepush-check
   ```

---

## 📈 Compliance Status
- **Current Status:** Compliant (Clean)
- **Phase R3 Complete:** Forbidden legacy audio files (`sentinel-os/public/sounds/*.wav`) untracked from git cache.
- **Pre-Push Safety Check:** Activated and verifying all commits.
