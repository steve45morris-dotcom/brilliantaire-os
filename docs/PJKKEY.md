# pjkkey: add an API key for P.J.K. safely

## Install (once per Mac)

Paste this into Terminal once:

```bash
grep -q 'pjkkey()' ~/.zshrc 2>/dev/null || cat >> ~/.zshrc <<'EOF'

# pjkkey: save an API key for P.J.K. without it showing on screen or in shell history.
# Usage: pjkkey STRIPE_SECRET_KEY   (then paste the key at the hidden prompt)
pjkkey() {
  local name="$1" val f="$HOME/sentinel-os/.env.local"
  case "$name" in ''|[!A-Z]*|*[!A-Z0-9_]*) echo "Usage: pjkkey KEY_NAME   e.g. pjkkey STRIPE_SECRET_KEY"; return 1;; esac
  read -rs "val?Paste $name, then press Return: "; echo
  [ -n "$val" ] || { echo "Nothing pasted; nothing changed."; return 1; }
  ( umask 077; touch "$f"; grep -v "^$name=" "$f" > "$f.tmp"; mv "$f.tmp" "$f"; printf '%s=%s\n' "$name" "$val" >> "$f" )
  chmod 600 "$f"; unset val
  echo "✅ $name saved to ~/sentinel-os/.env.local (only you can read it). Check: npm run pjk:doctor -- --online · Restart: npm run pjk"
}
EOF
source ~/.zshrc && echo "pjkkey is installed."
```

## Use it

```bash
pjkkey GITHUB_TOKEN
pjkkey STRIPE_SECRET_KEY
pjkkey GEMINI_API_KEY
```

- Paste the key at the prompt. Nothing shows while you paste.
- The key goes only into `~/sentinel-os/.env.local`. Only you can read that file, both git repos ignore it, and the key never appears in shell history.
- Running it again with the same name replaces the old value.
