#!/usr/bin/env bash
# Template for a Mac step (see SKILL.md). Copy it, fill in the four header
# values and the body, test it in the cloud, then hand it over with a checksum.
#
#   bash ~/mac-steps/bin/<step>.sh        dry run: shows what it would do
#   bash ~/mac-steps/bin/<step>.sh GO     does it (CHANGE steps only)
#
# Every run saves its full output to ~/mac-steps/<date>-<pid>-<step>.log and copies
# it to the clipboard, so the Commander only has to paste it back.

STEP="example-step"          # short name, used in the log file name
KIND="CHANGE"                # CHECK (only reads) or CHANGE
RISK="L1"                    # L0 read-only ... L4 credentials, payments, deploy
UNDO="nothing to undo"       # how to reverse it, in one line

LOGDIR="$HOME/mac-steps"
mkdir -p "$LOGDIR"
LOG="$LOGDIR/$(date +%Y-%m-%d_%H%M%S)-$$-$STEP.log"
MODE="dry"
[ "$KIND" = "CHECK" ] && MODE="go"
[ "${1:-}" = "GO" ] && MODE="go"

stop() { echo; echo "STOPPED: $*"; exit 1; }
say()  { echo; echo "== $*"; }
# act runs a command for real only after GO; in a dry run it prints it.
act()  { if [ "$MODE" = "go" ]; then "$@"; else echo "   would run: $*"; fi; }

main() {
  echo "STEP $STEP | $KIND | risk $RISK | mode: $MODE"
  echo "undo: $UNDO"
  export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.quotePath GIT_CONFIG_VALUE_0=false

  say "1. Checks"
  # Read-only checks go here. Anything wrong: stop "reason".

  say "2. Changes"
  # Every change goes through act, so the dry run shows it and GO does it.
  act echo "example change"

  echo
  if [ "$MODE" = "go" ]; then echo "DONE"; else echo "DRY RUN finished. Nothing changed. To do it: bash $0 GO"; fi
}

main "$@" 2>&1 | tee "$LOG"
status="${PIPESTATUS[0]}"
if command -v pbcopy >/dev/null 2>&1; then
  pbcopy < "$LOG" && echo "(the output above is on your clipboard: paste it to Claude)"
fi
echo "(saved to $LOG)"
exit "$status"
