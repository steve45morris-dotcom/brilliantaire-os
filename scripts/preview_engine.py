#!/usr/bin/env python3
"""
preview_engine.py - Unified Preview & Media Verification Engine
Authority: Architect-Core / Commander
Governance: COMPLETION_AND_LEVERAGE.md (repository root)

Provides automated, multi-modal preview generation, Playwright UI validation,
image metadata inspection, ffmpeg video keyframing/contact sheets, and
HTML5 cyberpunk media player synthesis for UI, images, videos, audios, and tasks.
"""

import os
import sys
import json
import time
import shutil
import argparse
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = WORKSPACE_ROOT / "outputs" / "previews"
SCRIPTS_DIR = WORKSPACE_ROOT / "scripts"
OPEN_PREVIEW_SCRIPT = SCRIPTS_DIR / "open_preview.sh"


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def run_cmd(cmd: List[str], timeout: float = 30.0) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


# ─────────────────────────────────────────────────────────────────────────────
# 1. UI / WEB PREVIEW HANDLER (Playwright)
# ─────────────────────────────────────────────────────────────────────────────

def preview_ui(target_html: str, out_dir: Optional[str] = None, artifact_dir: Optional[str] = None, port: int = 8888) -> Dict[str, Any]:
    """
    Validates an HTML/UI target headlessly via Playwright:
    - Captures high-res full-page desktop screenshot.
    - Inspects for console errors and failed network resource requests.
    - Copies assets to preview and artifact directories.
    - Formats markdown embeds and relocatable launch commands.
    """
    html_path = Path(target_html).resolve()
    if not html_path.exists():
        raise FileNotFoundError(f"Target HTML file does not exist: {html_path}")

    dest_dir = ensure_dir(Path(out_dir) if out_dir else OUTPUTS_DIR)
    ts = int(time.time())
    screenshot_name = f"ui_preview_{html_path.stem}_{ts}.png"
    screenshot_path = dest_dir / screenshot_name

    # Check for CORS / module risks
    content = html_path.read_text(errors="ignore")
    has_modules = '<script type="module"' in content or "type='module'" in content
    has_root_assets = 'src="/' in content or 'href="/' in content

    console_errors: List[str] = []
    failed_requests: List[str] = []

    # Run Playwright validation and screenshot capture
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()

            page.on("pageerror", lambda err: console_errors.append(str(err)))
            page.on("requestfailed", lambda req: failed_requests.append(f"{req.url} ({req.failure})"))

            # Determine optimal URL (prefer localhost:8888 if preview server is active in workspace to bypass CORS)
            target_url = f"file://{html_path}"
            try:
                import socket
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(0.5)
                    if s.connect_ex(("localhost", port)) == 0 and str(html_path).startswith(str(WORKSPACE_ROOT)):
                        rel_path = html_path.relative_to(WORKSPACE_ROOT)
                        target_url = f"http://localhost:{port}/{rel_path}"
            except Exception:
                pass

            try:
                page.goto(target_url, wait_until="load", timeout=8000)
            except Exception as nav_err:
                # If external CDN assets timed out, continue so we still capture the rendered DOM
                console_errors.append(f"Network navigation notice: {nav_err}")

            page.wait_for_timeout(800)

            # Full-page screenshot capture
            page.screenshot(path=str(screenshot_path), full_page=True)
            browser.close()
    except Exception as e:
        console_errors.append(f"Playwright screenshot capture fallback triggered: {e}")

    # Copy to active artifact dir if provided
    artifact_screenshot_link = str(screenshot_path)
    if artifact_dir:
        art_path = Path(artifact_dir)
        if art_path.exists():
            art_dest = art_path / screenshot_name
            try:
                shutil.copyfile(screenshot_path, art_dest)
                artifact_screenshot_link = str(art_dest)
            except Exception:
                pass

    rel_cmd = f"./scripts/open_preview.sh {html_path}"
    direct_file = f"file://{html_path}"

    result = {
        "status": "PASS" if not console_errors and not failed_requests else "WARNING",
        "type": "ui",
        "target": str(html_path),
        "screenshot_path": str(screenshot_path),
        "artifact_screenshot_path": artifact_screenshot_link,
        "direct_file_link": direct_file,
        "open_preview_cmd": rel_cmd,
        "console_errors": console_errors,
        "failed_requests": failed_requests,
        "has_modules": has_modules,
        "has_root_assets": has_root_assets,
        "markdown_embed": (
            f"### 🖥️ UI / Visual Preview: {html_path.name}\n"
            f"![UI Preview]({artifact_screenshot_link})\n\n"
            f"- **Direct File Link:** [{html_path.name}]({direct_file})\n"
            f"- **Launch Command:** `{rel_cmd}`\n"
            f"- **Rendering Health:** `{'Nominal (0 errors)' if not console_errors else f'{len(console_errors)} console errors'}`\n"
        )
    }
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 2. IMAGE PREVIEW HANDLER
# ─────────────────────────────────────────────────────────────────────────────

def preview_image(target_image: str, caption: Optional[str] = None, out_dir: Optional[str] = None, artifact_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Inspects image properties, prepares direct links and in-chat markdown embed.
    """
    img_path = Path(target_image).resolve()
    if not img_path.exists():
        raise FileNotFoundError(f"Target image file does not exist: {img_path}")

    dest_dir = ensure_dir(Path(out_dir) if out_dir else OUTPUTS_DIR)
    cap = caption or img_path.stem.replace("_", " ").title()

    # Image metadata via sips on macOS
    width, height = "Unknown", "Unknown"
    sips_res = run_cmd(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(img_path)])
    if sips_res.returncode == 0:
        for line in sips_res.stdout.splitlines():
            if "pixelWidth:" in line:
                width = line.split(":")[-1].strip()
            elif "pixelHeight:" in line:
                height = line.split(":")[-1].strip()

    file_size_kb = round(img_path.stat().st_size / 1024.0, 1)

    # Copy to artifact dir if provided
    artifact_img_link = str(img_path)
    if artifact_dir:
        art_path = Path(artifact_dir)
        if art_path.exists():
            art_dest = art_path / img_path.name
            try:
                shutil.copyfile(img_path, art_dest)
                artifact_img_link = str(art_dest)
            except Exception:
                pass

    rel_cmd = f"./scripts/open_preview.sh {img_path}"
    direct_file = f"file://{img_path}"

    result = {
        "status": "PASS",
        "type": "image",
        "target": str(img_path),
        "caption": cap,
        "width": width,
        "height": height,
        "size_kb": file_size_kb,
        "direct_file_link": direct_file,
        "open_preview_cmd": rel_cmd,
        "markdown_embed": (
            f"### 🖼️ Image Preview: {cap}\n"
            f"![{cap}]({artifact_img_link})\n\n"
            f"- **Resolution:** `{width} × {height}` | **Size:** `{file_size_kb} KB`\n"
            f"- **Direct File Link:** [{img_path.name}]({direct_file})\n"
            f"- **Launch Command:** `{rel_cmd}`\n"
        )
    }
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 3. VIDEO PREVIEW HANDLER (Keyframing & HTML5 Stepper)
# ─────────────────────────────────────────────────────────────────────────────

def preview_video(target_video: str, caption: Optional[str] = None, out_dir: Optional[str] = None, artifact_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Extracts video metadata via ffprobe, keyframes at intervals via ffmpeg,
    generates a filmstrip contact sheet and an interactive HTML5 video player.
    """
    vid_path = Path(target_video).resolve()
    if not vid_path.exists():
        raise FileNotFoundError(f"Target video file does not exist: {vid_path}")

    dest_dir = ensure_dir(Path(out_dir) if out_dir else OUTPUTS_DIR)
    cap = caption or vid_path.stem.replace("_", " ").title()
    ts = int(time.time())

    # ffprobe duration and resolution
    duration = 0.0
    width, height = "1920", "1080"
    probe_res = run_cmd([
        "ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height",
        "-of", "json", str(vid_path)
    ])
    if probe_res.returncode == 0:
        try:
            pdata = json.loads(probe_res.stdout)
            duration = float(pdata.get("format", {}).get("duration", 0.0))
            streams = pdata.get("streams", [])
            if streams:
                width = streams[0].get("width", 1920)
                height = streams[0].get("height", 1080)
        except Exception:
            pass

    # Extract 4 keyframe thumbnails across the timeline
    timestamps = [0.0, max(0.1, duration * 0.33), max(0.2, duration * 0.66), max(0.3, duration * 0.95)]
    frame_files: List[Path] = []
    for i, t in enumerate(timestamps):
        frame_file = dest_dir / f"frame_{vid_path.stem}_{ts}_{i}.jpg"
        run_cmd([
            "ffmpeg", "-y", "-ss", f"{t:.2f}", "-i", str(vid_path),
            "-frames:v", "1", "-q:v", "2", str(frame_file)
        ])
        if frame_file.exists():
            frame_files.append(frame_file)

    # Assemble horizontal filmstrip contact sheet using ffmpeg tile
    filmstrip_file = dest_dir / f"filmstrip_{vid_path.stem}_{ts}.jpg"
    if len(frame_files) >= 2:
        # Concatenate horizontally
        inputs = []
        filter_inputs = ""
        for idx, f in enumerate(frame_files):
            inputs.extend(["-i", str(f)])
            filter_inputs += f"[{idx}:v]"
        filter_complex = f"{filter_inputs}hstack=inputs={len(frame_files)}[outv]"
        run_cmd(["ffmpeg", "-y"] + inputs + ["-filter_complex", filter_complex, "-map", "[outv]", str(filmstrip_file)])

    # Generate Cyberpunk HTML5 Video Player Wrapper
    player_html_file = dest_dir / f"video_player_{vid_path.stem}_{ts}.html"
    player_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Preview: {cap}</title>
<style>
  :root {{ --bg: #090a0f; --card: #131722; --accent: #00f3ff; --neon: #ff0055; --text: #e2e8f0; }}
  body {{ margin: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }}
  .container {{ background: var(--card); border: 1px solid rgba(0,243,255,0.3); border-radius: 12px; box-shadow: 0 0 30px rgba(0,243,255,0.15); max-width: 960px; width: 100%; padding: 24px; box-sizing: border-box; }}
  h2 {{ margin: 0 0 16px 0; color: var(--accent); letter-spacing: 0.05em; font-size: 1.4rem; }}
  video {{ width: 100%; border-radius: 8px; background: #000; outline: none; border: 1px solid rgba(255,255,255,0.1); }}
  .controls {{ display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; align-items: center; justify-content: space-between; }}
  .btn-group {{ display: flex; gap: 8px; }}
  button {{ background: rgba(0,243,255,0.1); border: 1px solid var(--accent); color: var(--accent); padding: 8px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s all; }}
  button:hover {{ background: var(--accent); color: #000; box-shadow: 0 0 12px var(--accent); }}
  .meta {{ font-size: 0.85rem; color: #94a3b8; margin-top: 12px; display: flex; gap: 16px; }}
  .badge {{ background: rgba(255,0,85,0.2); color: var(--neon); border: 1px solid var(--neon); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }}
</style>
</head>
<body>
<div class="container">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <h2>{cap}</h2>
    <span class="badge">SUPERNOVA VIDEO PREVIEW</span>
  </div>
  <video id="v" controls preload="metadata" loop>
    <source src="file://{vid_path}" type="video/mp4">
    Your browser does not support HTML5 video.
  </video>
  <div class="controls">
    <div class="btn-group">
      <button onclick="step(-0.04)">◄ Frame</button>
      <button onclick="togglePlay()">Play / Pause</button>
      <button onclick="step(0.04)">Frame ►</button>
    </div>
    <div class="btn-group">
      <button onclick="setSpeed(0.5)">0.5x</button>
      <button onclick="setSpeed(1.0)">1.0x</button>
      <button onclick="setSpeed(2.0)">2.0x</button>
    </div>
  </div>
  <div class="meta">
    <span>Resolution: <strong>{width} × {height}</strong></span>
    <span>Duration: <strong>{duration:.2f}s</strong></span>
    <span>File: <strong>{vid_path.name}</strong></span>
  </div>
</div>
<script>
  const v = document.getElementById('v');
  function togglePlay() {{ v.paused ? v.play() : v.pause(); }}
  function step(sec) {{ v.currentTime += sec; }}
  function setSpeed(s) {{ v.playbackRate = s; }}
</script>
</body>
</html>"""
    player_html_file.write_text(player_content)

    # Copy video to artifact dir if provided
    artifact_vid_link = str(vid_path)
    if artifact_dir:
        art_path = Path(artifact_dir)
        if art_path.exists():
            art_dest = art_path / vid_path.name
            try:
                shutil.copyfile(vid_path, art_dest)
                artifact_vid_link = str(art_dest)
            except Exception:
                pass

    rel_cmd = f"./scripts/open_preview.sh {player_html_file}"
    direct_file = f"file://{vid_path}"

    filmstrip_embed = f"![Keyframes Contact Sheet]({filmstrip_file})\n" if filmstrip_file.exists() else ""

    result = {
        "status": "PASS",
        "type": "video",
        "target": str(vid_path),
        "caption": cap,
        "duration_sec": duration,
        "width": width,
        "height": height,
        "player_html": str(player_html_file),
        "filmstrip_path": str(filmstrip_file) if filmstrip_file.exists() else None,
        "direct_file_link": direct_file,
        "open_preview_cmd": rel_cmd,
        "markdown_embed": (
            f"### 🎬 Video Preview: {cap}\n"
            f"![{cap}]({artifact_vid_link})\n\n"
            f"{filmstrip_embed}"
            f"- **Resolution:** `{width} × {height}` | **Duration:** `{duration:.2f}s`\n"
            f"- **Direct File Link:** [{vid_path.name}]({direct_file})\n"
            f"- **Interactive Frame Stepper:** `{rel_cmd}`\n"
        )
    }
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 4. AUDIO PREVIEW HANDLER (HTML5 Cyberpunk Player & afplay)
# ─────────────────────────────────────────────────────────────────────────────

def preview_audio(target_audio: str, transcript: Optional[str] = None, out_dir: Optional[str] = None, artifact_dir: Optional[str] = None, auto_play: bool = False) -> Dict[str, Any]:
    """
    Inspects audio attributes, creates a sleek dark-mode HTML5 audio player
    card with interactive scrub/playback controls, and provides instant afplay command.
    """
    aud_path = Path(target_audio).resolve()
    if not aud_path.exists():
        raise FileNotFoundError(f"Target audio file does not exist: {aud_path}")

    dest_dir = ensure_dir(Path(out_dir) if out_dir else OUTPUTS_DIR)
    ts = int(time.time())

    # Read audio metadata via wave if WAV, else fallback
    duration = 0.0
    channels = 1
    sample_rate = 16000
    try:
        with wave.open(str(aud_path), "rb") as wf:
            channels = wf.getnchannels()
            sample_rate = wf.getframerate()
            duration = wf.getnframes() / float(sample_rate)
    except Exception:
        # Fallback via afinfo on macOS
        af_res = run_cmd(["afinfo", str(aud_path)])
        if af_res.returncode == 0:
            for line in af_res.stdout.splitlines():
                if "estimated duration:" in line:
                    duration = float(line.split(":")[-1].replace("sec", "").strip())
                elif "data format:" in line and "Hz" in line:
                    parts = line.split(",")
                    for p in parts:
                        if "Hz" in p:
                            sample_rate = p.strip()

    # Generate Cyberpunk HTML5 Audio Player Card
    player_html_file = dest_dir / f"audio_player_{aud_path.stem}_{ts}.html"
    transcript_html = f"""<div class="transcript-box"><strong>Spoken Transcript:</strong><p>"{transcript}"</p></div>""" if transcript else ""

    player_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Audio Audition: {aud_path.stem}</title>
<style>
  :root {{ --bg: #090a0f; --card: #131722; --accent: #00f3ff; --neon: #ff0055; --text: #e2e8f0; }}
  body {{ margin: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }}
  .card {{ background: var(--card); border: 1px solid rgba(0,243,255,0.3); border-radius: 12px; box-shadow: 0 0 30px rgba(0,243,255,0.15); max-width: 650px; width: 100%; padding: 24px; box-sizing: border-box; }}
  h2 {{ margin: 0 0 16px 0; color: var(--accent); font-size: 1.3rem; letter-spacing: 0.05em; }}
  audio {{ width: 100%; margin-top: 12px; outline: none; border-radius: 6px; }}
  .transcript-box {{ margin-top: 16px; background: rgba(0,0,0,0.4); border-left: 3px solid var(--accent); padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 0.95rem; color: #f8fafc; font-style: italic; }}
  .meta {{ margin-top: 16px; font-size: 0.85rem; color: #94a3b8; display: flex; gap: 16px; }}
  .badge {{ background: rgba(0,243,255,0.15); color: var(--accent); border: 1px solid var(--accent); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }}
  .btn-audition {{ margin-top: 16px; background: rgba(0,243,255,0.1); border: 1px solid var(--accent); color: var(--accent); padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; transition: 0.2s all; }}
  .btn-audition:hover {{ background: var(--accent); color: #000; box-shadow: 0 0 12px var(--accent); }}
</style>
</head>
<body>
<div class="card">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <h2>Audio Audition: {aud_path.name}</h2>
    <span class="badge">VOICE BUS / TTS</span>
  </div>
  {transcript_html}
  <audio id="player" controls autoplay>
    <source src="file://{aud_path}" type="audio/wav">
    Your browser does not support audio element.
  </audio>
  <div class="meta">
    <span>Channels: <strong>{channels}</strong></span>
    <span>Rate: <strong>{sample_rate} Hz</strong></span>
    <span>Duration: <strong>{duration:.2f}s</strong></span>
  </div>
</div>
</body>
</html>"""
    player_html_file.write_text(player_content)

    afplay_cmd = f"afplay {aud_path}"
    if auto_play:
        subprocess.Popen(["afplay", str(aud_path)])

    rel_cmd = f"./scripts/open_preview.sh {player_html_file}"
    direct_file = f"file://{aud_path}"

    result = {
        "status": "PASS",
        "type": "audio",
        "target": str(aud_path),
        "transcript": transcript,
        "duration_sec": duration,
        "sample_rate": sample_rate,
        "channels": channels,
        "player_html": str(player_html_file),
        "direct_file_link": direct_file,
        "afplay_cmd": afplay_cmd,
        "open_preview_cmd": rel_cmd,
        "markdown_embed": (
            f"### 🎙️ Audio Audition: {aud_path.name}\n"
            f"- **Transcript:** *\"{transcript if transcript else 'No transcript attached'}\"*\n"
            f"- **Sample Rate:** `{sample_rate} Hz` | **Channels:** `{channels}` | **Duration:** `{duration:.2f}s`\n"
            f"- **Direct Audio Link:** [{aud_path.name}]({direct_file})\n"
            f"- **1-Click Audition (Terminal):** `{afplay_cmd}`\n"
            f"- **Cyberpunk Waveform Player:** `{rel_cmd}`\n"
        )
    }
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 5. CLI INTERFACE
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Preview Engine - Unified Media Verification and Preview Operator")
    subparsers = parser.add_subparsers(dest="subcommand", help="Media type to preview")

    # UI Subparser
    p_ui = subparsers.add_parser("ui", help="Preview and validate HTML/Web UI via Playwright")
    p_ui.add_argument("target", help="Path to HTML file")
    p_ui.add_argument("--out-dir", default=None, help="Output directory for screenshots")
    p_ui.add_argument("--artifact-dir", default=None, help="Conversation artifact directory to copy assets into")
    p_ui.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    # Image Subparser
    p_img = subparsers.add_parser("image", help="Preview image asset")
    p_img.add_argument("target", help="Path to image file")
    p_img.add_argument("--caption", default=None, help="Caption for markdown embed")
    p_img.add_argument("--out-dir", default=None, help="Output directory")
    p_img.add_argument("--artifact-dir", default=None, help="Conversation artifact directory")
    p_img.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    # Video Subparser
    p_vid = subparsers.add_parser("video", help="Preview video, extract keyframes, generate frame stepper")
    p_vid.add_argument("target", help="Path to video file")
    p_vid.add_argument("--caption", default=None, help="Caption for markdown embed")
    p_vid.add_argument("--out-dir", default=None, help="Output directory")
    p_vid.add_argument("--artifact-dir", default=None, help="Conversation artifact directory")
    p_vid.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    # Audio Subparser
    p_aud = subparsers.add_parser("audio", help="Preview audio, generate cyberpunk player, provide afplay command")
    p_aud.add_argument("target", help="Path to audio file")
    p_aud.add_argument("--transcript", default=None, help="Transcript text")
    p_aud.add_argument("--play", action="store_true", help="Automatically trigger audio playback")
    p_aud.add_argument("--out-dir", default=None, help="Output directory")
    p_aud.add_argument("--artifact-dir", default=None, help="Conversation artifact directory")
    p_aud.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    args = parser.parse_args()

    if not args.subcommand:
        parser.print_help()
        sys.exit(1)

    try:
        if args.subcommand == "ui":
            res = preview_ui(args.target, out_dir=args.out_dir, artifact_dir=args.artifact_dir)
        elif args.subcommand == "image":
            res = preview_image(args.target, caption=args.caption, out_dir=args.out_dir, artifact_dir=args.artifact_dir)
        elif args.subcommand == "video":
            res = preview_video(args.target, caption=args.caption, out_dir=args.out_dir, artifact_dir=args.artifact_dir)
        elif args.subcommand == "audio":
            res = preview_audio(args.target, transcript=args.transcript, out_dir=args.out_dir, artifact_dir=args.artifact_dir, auto_play=args.play)
        else:
            parser.print_help()
            sys.exit(1)

        if getattr(args, "json", False):
            print(json.dumps(res, indent=2))
        else:
            print(res["markdown_embed"])
            print(f"[OK] Preview generated successfully: {res.get('open_preview_cmd', '')}")

    except Exception as e:
        print(f"[ERROR] Failed to generate preview: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
