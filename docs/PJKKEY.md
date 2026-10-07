# pjkkey: add an API key for P.J.K. safely

## Install or update (once per Mac)

Paste this into Terminal. Running it again installs the latest version, so it
is also how you update an older `pjkkey`:

```bash
cat > ~/.pjkkey.zsh <<'EOF'
# pjkkey: save an API key or passcode for P.J.K. without it showing on screen or in shell history.
# Usage: pjkkey STRIPE_SECRET_KEY   (then paste or type the value at the hidden prompt)
pjkkey() {
  local name="$1" val q f="$HOME/sentinel-os/.env.local"
  case "$name" in ''|[!A-Z]*|*[!A-Z0-9_]*) echo "Usage: pjkkey KEY_NAME   e.g. pjkkey STRIPE_SECRET_KEY"; return 1;; esac
  read -rs "val?Paste $name, then press Return: "; echo
  [ -n "$val" ] || { echo "Nothing pasted; nothing changed."; return 1; }
  # Saved in quotes with every $ escaped, so the value comes back exactly as pasted:
  # unquoted, a # starts a comment and a $ is read as a variable.
  if [[ "$val" != *"'"* ]]; then q="'"
  elif [[ "$val" != *'"'* && "$val" != *'\'* ]]; then q='"'
  else unset val; echo "That value has both kinds of quote mark (or a ' and a backslash), which .env.local can't hold. Nothing changed."; return 1
  fi
  ( umask 077; touch "$f"; grep -v "^$name=" "$f" > "$f.tmp"; mv "$f.tmp" "$f"; printf '%s=%s%s%s\n' "$name" "$q" "${val//\$/\\\$}" "$q" >> "$f" )
  chmod 600 "$f"; unset val
  echo "✅ $name saved to ~/sentinel-os/.env.local (only you can read it). Check: npm run pjk:doctor -- --online · Restart: npm run pjk"
}
EOF
grep -q 'source ~/.pjkkey.zsh' ~/.zshrc 2>/dev/null || printf '\n# pjkkey (brilliantaire-os docs/PJKKEY.md)\nsource ~/.pjkkey.zsh\n' >> ~/.zshrc
source ~/.pjkkey.zsh && echo "pjkkey is installed."
```

The function lives in `~/.pjkkey.zsh`, loaded at the end of `~/.zshrc`, so it
replaces an older `pjkkey()` that may still be written into `~/.zshrc` itself.

## Use it

```bash
pjkkey GITHUB_TOKEN
pjkkey STRIPE_SECRET_KEY
pjkkey GEMINI_API_KEY
pjkkey ANTHROPIC_API_KEY
pjkkey OPENAI_API_KEY
```

- Paste the key at the prompt. Nothing shows while you paste.
- The key goes only into `~/sentinel-os/.env.local`. Only you can read that file, both git repos ignore it, and the key never appears in shell history.
- Running it again with the same name replaces the old value.
- Any characters work, including `$`, `#` and spaces: the value is saved in quotes with `$` escaped, and comes back exactly as pasted. (Older versions saved it unquoted, which cut a value off at `#` or `$`. If a passcode or key saved that way doesn't work, update `pjkkey` with the snippet above, save it again, then run `npm run pjk`.)
- After changing a value, restart with `npm run pjk`: P.J.K. only reads `.env.local` when it starts.

## AI keys: Gemini, Claude and ChatGPT

P.J.K. can use three AI companies for its brain, eyes, voice and ears. One
key is enough; each extra key is a backup that takes over when the one before
it is down, out of credit or rejected. Add any or all of them:

| Key | Where to get it | What it adds |
|---|---|---|
| `GEMINI_API_KEY` | aistudio.google.com/apikey | Brain, eyes, voice, ears, Live voice chat and Google Search. First choice for everything. |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Claude as a second brain and set of eyes. |
| `OPENAI_API_KEY` | platform.openai.com/api-keys | ChatGPT as a third brain and set of eyes, plus a backup voice and backup ears. |

```bash
pjkkey GEMINI_API_KEY
pjkkey ANTHROPIC_API_KEY
pjkkey OPENAI_API_KEY
npm run pjk:doctor -- --online   # confirms each key is accepted, without printing it
npm run pjk                      # restart so P.J.K. picks the keys up
```

The order P.J.K. tries them in is Gemini, then Claude, then ChatGPT. To make
one of them the first choice, set `SENTINEL_CHAT_PROVIDER` in
`~/sentinel-os/.env.local` to `gemini`, `anthropic` or `openai`. The models
each one uses can be changed with `ANTHROPIC_DEFAULT_MODEL` and
`OPENAI_DEFAULT_MODEL` (see `.env.example` in sentinel-os).
