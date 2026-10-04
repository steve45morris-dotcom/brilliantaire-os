#!/usr/bin/env bash
set -euo pipefail

# IcyOS First Deployment Setup
# Run this from the IcyOS root: Knowledge Core/IcyOS/

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  IcyOS Deployment Setup${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

CHECKS_PASSED=0
CHECKS_FAILED=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" = "ok" ]; then
    echo -e "  ${GREEN}✓${NC} $label"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "  ${RED}✗${NC} $label — ${YELLOW}$result${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
}

# ── 1. Prerequisites ──
echo -e "${CYAN}1. Prerequisites${NC}"

if command -v node &>/dev/null; then
  check "Node.js $(node -v)" "ok"
else
  check "Node.js" "not found — install Node 20+"
fi

if command -v pnpm &>/dev/null; then
  check "pnpm $(pnpm -v)" "ok"
else
  check "pnpm" "not found — run: corepack enable && corepack prepare pnpm@10 --activate"
fi

if command -v supabase &>/dev/null; then
  check "Supabase CLI $(supabase --version 2>/dev/null | head -1)" "ok"
else
  check "Supabase CLI" "not found — run: npx supabase --version (or brew install supabase/tap/supabase)"
fi

if command -v vercel &>/dev/null; then
  check "Vercel CLI $(vercel --version 2>/dev/null | head -1)" "ok"
else
  check "Vercel CLI" "not found — run: pnpm add -g vercel"
fi

echo

# ── 2. Environment Variables ──
echo -e "${CYAN}2. Environment Variables${NC}"

ENV_FILE="apps/web/.env"
if [ -f "$ENV_FILE" ]; then
  check ".env file exists" "ok"

  check_var() {
    local var="$1"
    if grep -q "^${var}=" "$ENV_FILE" && ! grep -qE "^${var}=(your-|placeholder|sk_test_\.\.\.|price_\.\.\.|whsec_\.\.\.)" "$ENV_FILE"; then
      check "$var" "ok"
    else
      check "$var" "not set — edit $ENV_FILE"
    fi
  }

  check_var "NEXT_PUBLIC_SUPABASE_URL"
  check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  check_var "SUPABASE_SERVICE_ROLE_KEY"
  check_var "STRIPE_SECRET_KEY"
  check_var "STRIPE_WEBHOOK_SECRET"
  check_var "STRIPE_PRICE_STARTER"
  check_var "STRIPE_PRICE_PRO"
  check_var "STRIPE_PRICE_TEAM"
else
  check ".env file" "missing — run: cp apps/web/.env.example apps/web/.env"
fi

echo

# ── 3. Build ──
echo -e "${CYAN}3. Build Verification${NC}"

if [ -d "apps/web/.next" ]; then
  check "Next.js build output" "ok"
else
  check "Next.js build" "not built — run: pnpm build"
fi

if [ -f "pnpm-lock.yaml" ]; then
  check "Lockfile" "ok"
else
  check "Lockfile" "missing — run: pnpm install"
fi

echo

# ── 4. Summary ──
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
TOTAL=$((CHECKS_PASSED + CHECKS_FAILED))
if [ "$CHECKS_FAILED" -eq 0 ]; then
  echo -e "  ${GREEN}All $TOTAL checks passed — ready to deploy!${NC}"
  echo
  echo -e "  ${CYAN}Next steps:${NC}"
  echo "    1. supabase link --project-ref <your-ref>"
  echo "    2. supabase db push"
  echo "    3. vercel --prod"
  echo "    4. Set up Stripe webhook → https://<domain>/api/billing/webhook"
else
  echo -e "  ${GREEN}$CHECKS_PASSED passed${NC}, ${RED}$CHECKS_FAILED need attention${NC} (out of $TOTAL)"
  echo
  echo -e "  ${CYAN}Fix the items marked ✗ above, then re-run this script.${NC}"
fi
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
