#!/usr/bin/env bash
# Claude Code cloud environment setup script.
#
# Installs the watch@claude-video plugin (https://github.com/bradautomates/claude-video)
# and everything it needs so /watch works in a fresh cloud session:
#   - ffmpeg / ffprobe   (frame extraction; already in the base image)
#   - yt-dlp             (video + caption download; Node enabled as its JS runtime)
#   - watch plugin       (marketplace + plugin install, user scope)
#   - youtube-agent      (11 /yt-* skills from Jakeschincariol/youtube-agent-skill)
#   - local WhisperX     (offline transcription fallback, CPU, "small" model)
#
# The watch engine is saved as "auto": when GEMINI_API_KEY is set in the environment
# (add it under the cloud environment's environment variables), /watch sends the video
# to Google's Gemini model, which also works for YouTube URLs that yt-dlp cannot fetch
# from the cloud container; without a key it uses the local frames + WhisperX pipeline.
#
# Paste the whole file into the environment's Setup script field (claude.ai/code ->
# environment menu in the session title bar -> Edit -> Setup script). The cloud runs it
# once as root before Claude Code launches, then snapshots the filesystem, so later
# sessions start with everything already on disk. Every step is idempotent; rerunning
# is safe. The script always exits 0: a failed step is logged and the session still
# starts, with /watch degraded to captions-only if WhisperX could not be set up.
#
# Two workarounds are baked in because the plugin's managed WhisperX installer does not
# finish unmodified in this environment:
#   1. WhisperX pulls the CUDA build of torchvision from PyPI, which cannot load against
#      the CPU torch the installer pins. We swap in the matching CPU torchvision wheel.
#   2. WhisperX fetches its Silero VAD model via torch.hub from github.com, and the cloud
#      proxy only allows the GitHub API and raw file hosts, not github.com pages. We install
#      the official silero-vad PyPI package instead, seed torch's hub cache with a tiny
#      hubconf shim that delegates to it, and pin the branch in WhisperX's loader call so
#      torch.hub reads the cache without a network probe.
#
# Set WATCH_SKIP_WHISPERX=1 to skip the WhisperX section (saves ~1.5 GB download and a few
# minutes). Captions are always tried first, so /watch still works for most YouTube videos.

set -uo pipefail
# The setup script may run in a non-login shell: make sure the claude CLI and uv tools resolve.
export PATH="/opt/node22/bin:$HOME/.local/bin:$PATH"

log() { printf '[cloud-setup] %s\n' "$*" >&2; }

WHISPERX_VERSION="3.8.6"   # must match WHISPERX_VERSION in the plugin's setup.py
TORCH_VERSION="2.8.0"
TORCHVISION_VERSION="0.23.0"
TORCH_CPU_INDEX="https://download.pytorch.org/whl/cpu"

SETUP_PY=""

# ---------------------------------------------------------------------------
# 1. Base binaries + plugin. Failure here leaves /watch unusable, so it is reported loudly.
# ---------------------------------------------------------------------------
install_base() {
  set -e
  if ! command -v uv >/dev/null; then
    log "installing uv"
    curl -LsSf https://astral.sh/uv/install.sh | sh
  fi

  if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
    log "installing ffmpeg"
    apt-get update -qq && apt-get install -y -qq ffmpeg
  fi

  if ! command -v yt-dlp >/dev/null; then
    log "installing yt-dlp"
    uv tool install yt-dlp
  fi

  # yt-dlp needs a JavaScript runtime for YouTube extraction and only enables deno by
  # default, which the base image lacks. Node is pre-installed, so enable it via yt-dlp's
  # user config (the plugin leaves existing yt-dlp configuration active).
  if ! grep -qs -- '--js-runtimes node' "$HOME/.config/yt-dlp/config"; then
    log "enabling node as yt-dlp's JavaScript runtime"
    mkdir -p "$HOME/.config/yt-dlp"
    printf -- '--js-runtimes node\n' >> "$HOME/.config/yt-dlp/config"
  fi

  if ! claude plugin marketplace list 2>/dev/null | grep -q 'claude-video'; then
    log "adding claude-video marketplace"
    claude plugin marketplace add bradautomates/claude-video
  fi

  if ! claude plugin list 2>/dev/null | grep -q 'watch@claude-video'; then
    log "installing watch@claude-video"
    claude plugin install watch@claude-video
  fi

  # YouTube agent skill pack (11 /yt-* skills, stdlib-only Python tools).
  if ! claude plugin marketplace list 2>/dev/null | grep -q 'youtube-agent-skill'; then
    log "adding youtube-agent-skill marketplace"
    claude plugin marketplace add Jakeschincariol/youtube-agent-skill
  fi

  if ! claude plugin list 2>/dev/null | grep -q 'youtube-agent@youtube-agent-skill'; then
    log "installing youtube-agent@youtube-agent-skill"
    claude plugin install youtube-agent@youtube-agent-skill
  fi
}

find_setup_py() {
  local skill_dir
  skill_dir="$(ls -d "$HOME"/.claude/plugins/cache/claude-video/watch/*/skills/watch 2>/dev/null | sort -V | tail -1)"
  [ -n "$skill_dir" ] || return 1
  SETUP_PY="$skill_dir/scripts/setup.py"
  log "plugin skill dir: $skill_dir"
}

# ---------------------------------------------------------------------------
# 2. Local WhisperX (optional). Failure here falls back to captions-only.
# ---------------------------------------------------------------------------
install_whisperx() {
  set -e
  local venv="$HOME/.cache/watch/whisperx-venv"
  local vpy="$venv/bin/python"
  local sentinel="$venv/.deps-ok"
  local hub_dir="$HOME/.cache/torch/hub/snakers4_silero-vad_master"

  if python3 "$SETUP_PY" --json 2>/dev/null | grep -q '"whisperx_ready": true'; then
    return 0
  fi

  # Build the venv the same way the plugin's installer does, then apply the workarounds.
  # The installer wipes any venv lacking its sentinel, so we create the sentinel ourselves
  # and let the installer only do the model warm-up and config write.
  if [ ! -f "$sentinel" ]; then
    log "creating WhisperX venv at $venv"
    rm -rf "$venv"
    uv venv "$venv" --python 3.12
    uv pip install --python "$vpy" "torch==$TORCH_VERSION" "torchaudio==$TORCH_VERSION" --index-url "$TORCH_CPU_INDEX"
    uv pip install --python "$vpy" "whisperx==$WHISPERX_VERSION"
    # Workaround 1: CPU torchvision matching the pinned CPU torch.
    uv pip install --python "$vpy" --reinstall "torchvision==$TORCHVISION_VERSION" --index-url "$TORCH_CPU_INDEX"
    # Workaround 2a: official Silero VAD package from PyPI (ships the model files).
    uv pip install --python "$vpy" --no-deps silero-vad
    printf '%s\n' "$WHISPERX_VERSION" > "$sentinel"
  fi

  # Workaround 2b: pin the branch so torch.hub skips its github.com probe and uses the cache.
  local silero_py
  silero_py="$(ls "$venv"/lib/python3.*/site-packages/whisperx/vads/silero.py)"
  sed -i "s|repo_or_dir='snakers4/silero-vad',|repo_or_dir='snakers4/silero-vad:master',|" "$silero_py"

  # Workaround 2c: hubconf shim in the torch hub cache that delegates to the PyPI package.
  mkdir -p "$hub_dir"
  cat > "$hub_dir/hubconf.py" <<'PYEOF'
# Local torch.hub shim for snakers4/silero-vad.
# The cloud proxy refuses github.com page URLs, so torch.hub cannot fetch the repo.
# The official silero-vad PyPI package ships the same model and utilities; this
# entrypoint mirrors the upstream hubconf and delegates to it.
dependencies = ['torch', 'torchaudio']

from silero_vad import (load_silero_vad, get_speech_timestamps, save_audio,
                        read_audio, VADIterator, collect_chunks)


def silero_vad(onnx=False, force_onnx_cpu=False):
    """Silero Voice Activity Detector (served from the silero-vad PyPI package)."""
    model = load_silero_vad(onnx=onnx)
    utils = (get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks)
    return model, utils
PYEOF

  # Let the plugin's installer warm the model caches and write its config.
  log "warming WhisperX (downloads the ~464 MB small model)"
  python3 "$SETUP_PY" --engine auto --backend whisperx --detail balanced
}

configure_captions_only() {
  log "configuring base watch without a local transcription backend"
  python3 "$SETUP_PY" --engine auto --backend none --detail balanced || true
}

# ---------------------------------------------------------------------------
# Main. Never exits non-zero: a failing setup script would block every new session.
# ---------------------------------------------------------------------------
# Each phase runs in its own subshell with errexit on, and the subshell is NOT placed
# in an if-condition: bash suppresses errexit inside an if test, even in a subshell.
(install_base); base_rc=$?
if [ "$base_rc" -ne 0 ]; then
  log "ERROR: base install failed (exit $base_rc); /watch will not work in this session"
  exit 0
fi

if ! find_setup_py; then
  log "ERROR: watch plugin files not found after install; /watch will not work in this session"
  exit 0
fi

if [ "${WATCH_SKIP_WHISPERX:-0}" = "1" ]; then
  log "WATCH_SKIP_WHISPERX=1: skipping local WhisperX"
  configure_captions_only
else
  (install_whisperx); whisperx_rc=$?
  if [ "$whisperx_rc" -ne 0 ]; then
    log "WARNING: local WhisperX setup failed (exit $whisperx_rc); /watch will run captions-only"
    configure_captions_only
  fi
fi

if python3 "$SETUP_PY" --check; then
  log "done: /watch is ready"
else
  log "WARNING: the watch plugin preflight did not pass; invoke the watch skill to see what is missing"
fi
exit 0
