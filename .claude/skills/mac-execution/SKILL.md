---
name: mac-execution
description: How any work that needs commands on the Commander's Mac gets done, one checked step at a time. Use whenever a task needs Terminal on the Mac (git, the move, backups, installs, IcyOS launch steps), instead of improvising commands.
---

# Mac execution

Claude works in the cloud and can't touch the Mac. Anything on the Mac is run by
the Commander in Terminal, in steps Claude has prepared, tested and checked.
This is the procedure, every time. Agreed with the Commander on 10 October 2026.

## The rules

1. **The Commander runs it, in Terminal.** Not through another agent: an agent
   that changed a block (a different branch, extra files) is how a stray commit
   holding the unreleased pilot video was made on 9 October. If an agent on the
   Mac is used anyway, it runs each block exactly as written and changes nothing.
2. **`bash` first.** The Mac's default shell is zsh, which treats some lines
   differently. Every Terminal session for these steps starts by typing `bash`.
3. **One step at a time, each labelled.** Every step says what it is and its
   risk, on the sentinel-os scale:

   | Kind | Risk | What it means |
   |---|---|---|
   | CHECK | L0 | Only reads. Runs straight away. |
   | CHANGE | L1 | A small change that's easy to undo |
   | CHANGE | L2 | Settings, automation, anything that lasts across sessions |
   | CHANGE | L3 | Moves, deletes, migrations, data changes |
   | CHANGE | L4 | Credentials, payments, deploys, outside systems |

   Before each step Claude says what its output should look like. The
   Commander pastes the output back, and Claude reads it before giving the
   next step.
4. **Dry run first (GO gate).** A CHANGE step only shows what it would do. It
   acts when the Commander runs it again with `GO` on the end, after Claude has
   read the dry run. For L3 and L4 the dry run is never skipped.
5. **Gates stop.** A step that finds something wrong prints `STOPPED:` and the
   reason, and changes nothing after that point.
6. **Output comes back whole.** Every step saves its full output to
   `~/mac-steps/<date>-<pid>-<step>.log` and copies it to the clipboard, so the
   Commander pastes it without selecting anything, and nothing gets cut off.
7. **Scripts come with a checksum.** Claude gives a block that saves the script
   to `~/mac-steps/bin/` and prints its checksum. The script is run only if the
   checksum matches the one Claude gave. Downloaded files aren't used, because
   they don't reliably land in Downloads.
8. **Claude tests every script first,** in the cloud, on a copy set up like the
   Mac: the normal case, the failure case, the dry run, and running it twice.
9. **Saving never touches the Commander's files.** Saving or backing up works
   through a temporary copy, so the Commander's branch, staged files and working
   files stay exactly as they were.
10. **Backups come before anything that moves or deletes,** and the step checks
    the backup exists first.
11. **Pushing:** never to `main`. Before any push the script scans for keys and
    files over 2 MB, and stops if it finds either. Public repos
    (brilliantaire-os) get only what is meant to be public. Anything unreviewed
    goes to a private one (sentinel-os, brilliantaire-mac-backup).
12. **Keys never go into a step or a chat.** They go in through `pjkkey`.
13. **A verified step is ticked on the roadmap.** When Claude has checked a
    step's output and it's done, Claude ticks the matching item in
    `NEXT_ACTIONS.md` in its next pull request, or gives the voice phrase. If
    the Commander ticks something by voice on the Mac, the Commander says so, and Claude
    carries the tick into that pull request so the Mac and GitHub agree.

## Handing over a step

Short CHECK steps can be pasted directly. Everything else is a script built from
`template.sh` in this folder, handed over like this:

```bash
mkdir -p ~/mac-steps/bin
cat > ~/mac-steps/bin/<step>.sh <<'EOF_STEP'
...the script...
EOF_STEP
shasum -a 256 ~/mac-steps/bin/<step>.sh | cut -c1-16
```

Then `bash ~/mac-steps/bin/<step>.sh` for the dry run, and the same with `GO`
once Claude has read it.

## Writing a script (for Claude)

- Start from `template.sh`: it already has the log, the clipboard, the GO gate,
  `stop` and `act`. Put every change through `act` so the dry run shows it.
- macOS ships bash 3.2: no `set -u` with arrays, no newer bash features.
- No `!` in pasted text (history expansion can mangle it) and no `exit` in a
  pasted block (it would close Terminal). Both are fine inside a saved script.
- Check the thing itself, not an exit code: `git ls-remote` after a push,
  `git cat-file -e` for a file. In a pipeline the exit code is the last
  command's.
- Raw file names: `core.quotePath=false` (the template sets it), because some
  file names contain emoji.
- End with one clear line: `DONE`, `SAVED`, `PUSHED`, `DRY RUN finished` or
  `STOPPED: reason`.
