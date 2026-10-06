#!/bin/bash
# voice-bus-audit.sh - Audit the project workspace for Voice Bus compliance v3
# Checks for direct say calls, unsafe backgrounding, child_process say executions,
# and verifies that emergency kill logic is safe and targeted.

VIOLATIONS=0
echo "=== 🕵️ Running Voice Bus Audit v3 ==="

# 1. Search for direct say calls in production scripts (excluding speak_serialized.sh)
echo "Checking for direct say calls..."
while read -r match; do
    # Filter out speak_serialized.sh itself, comments, and backup/ignore dirs
    if [[ "$match" == *"speak_serialized.sh"* ]] || [[ "$match" == *"# "* ]] || [[ "$match" == *" // "* ]]; then
        continue
    fi
    if [[ "$match" =~ \bsay\b ]]; then
        echo "  [VIOLATION] Direct say call found: $match"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
done < <(grep -rn "say" scripts src .agents system antigravity_systems --include="*.sh" --include="*.ts" --include="*.js" --include="*.py" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.agents/skill-support --exclude-dir=.agents/skills_backup_huge_1780058722 --exclude=voice-bus-audit.sh 2>/dev/null)

# 2. Search for unsafe background speech patterns (& disown or &) in voice calls
echo "Checking for unsafe background speech execution..."
while read -r match; do
    if [[ "$match" == *"speak_serialized.sh"* && ( "$match" == *"&"* || "$match" == *"disown"* ) ]]; then
        echo "  [VIOLATION] Unsafe background speech pattern found: $match"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
done < <(grep -rn "speak_serialized.sh" scripts src .agents system antigravity_systems --include="*.sh" --include="*.ts" --include="*.js" --include="*.py" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.agents/skill-support --exclude=voice-bus-audit.sh 2>/dev/null)

# 3. Search for child_process calls directly invoking say in TypeScript
echo "Checking for child_process say executions in TypeScript..."
while read -r match; do
    if [[ "$match" == *"child_process"* && "$match" == *"say"* ]]; then
        echo "  [VIOLATION] child_process say execution found in TypeScript: $match"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
done < <(grep -rn "say" scripts src .agents --include="*.ts" --exclude-dir=node_modules --exclude-dir=.git --exclude=voice-bus-audit.sh 2>/dev/null)

# 4. Check for unsafe kill commands in production speech scripts
echo "Checking for unsafe kill commands..."
# Production script is speak_serialized.sh. It is allowed to use targeted kill on PIDs.
# We scan for "kill " or "killall " in production directories.
while read -r match; do
    # Allow speak_serialized.sh to kill only specific PID variables like $ACTIVE_SAY_PID or $SAY_PID
    if [[ "$match" == *"speak_serialized.sh"* ]]; then
        if [[ "$match" =~ kill\ -[0-9]+\ \$[A-Za-z0-9_]+ || "$match" =~ kill\ \$[A-Za-z0-9_]+ ]]; then
            # Safe targeted variable kill
            continue
        fi
    fi
    # Ignore comments, test files, and cleanup scripts
    if [[ "$match" == *"# "* ]] || [[ "$match" == *"test"* ]] || [[ "$match" == *"cleanup"* ]]; then
        continue
    fi
    # If a generic kill or killall say is found, it is a violation
    if [[ "$match" =~ \bkillall\b || "$match" =~ \bkill\b ]]; then
        echo "  [VIOLATION] Unsafe or untargeted kill command found: $match"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
done < <(grep -rn -E "\b(kill|killall)\b" scripts src .agents system antigravity_systems --include="*.sh" --include="*.ts" --include="*.js" --include="*.py" --exclude-dir=node_modules --exclude-dir=.git --exclude=voice-bus-audit.sh 2>/dev/null)

echo "================================="
if [ "$VIOLATIONS" -eq 0 ]; then
    echo "🏆 AUDIT STATUS: PASS - Zero compliance violations found."
    exit 0
else
    echo "❌ AUDIT STATUS: FAIL - Found $VIOLATIONS voice safety compliance violations."
    exit 1
fi
