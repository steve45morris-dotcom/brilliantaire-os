#!/bin/bash
# Enhanced Narrative Logic - Integrated with Oracle Voice Bridge
# Writing to the buffer ensures reliable speech via the TRAPALRM listener

VOICE_BUFFER="/Users/alexanderanthony/.agents/voice_buffer.txt"

# Register all 32 phrases
get_phrase() {
    local num=$1
    case $num in
        1) echo "The grid lines are drawn, the lighters are up." ;;
        2) echo "No street collisions. Quorum verified." ;;
        3) echo "I build before burning. Commit the block." ;;
        4) echo "Area Boy standing on the mainframe." ;;
        5) echo "Brilliantier cashout complete. Release the package." ;;
        6) echo "Signal clean. The streets don't lie, neither does the data." ;;
        7) echo "Sovereign node online. Nobody controls this block." ;;
        8) echo "Pressure cooked this. Now it ships." ;;
        9) echo "Ghost in the mesh. Watching all nodes breathe." ;;
        10) echo "No blueprint, no build. Drawing now." ;;
        11) echo "Lighters stay lit even when the network's dark." ;;
        12) echo "Every byte written is a block claimed." ;;
        13) echo "Roots in the street, branches in the cloud." ;;
        14) echo "The algorithm respects the grind." ;;
        15) echo "Cipher locked. Only the sovereign reads this." ;;
        16) echo "From the block to the blockchain. Same instincts, different layer." ;;
        17) echo "Not loud. Just inevitable." ;;
        18) echo "The mesh remembers what the street taught." ;;
        19) echo "Two lighters. Zero dependencies on luck." ;;
        20) echo "The perimeter is clean. Nothing moves without clearance." ;;
        21) echo "Compiled in silence. Delivered like thunder." ;;
        22) echo "This isn't luck. This is architecture." ;;
        23) echo "Street map loaded. Routing without permission." ;;
        24) echo "Ash to asset. The burn was the plan." ;;
        25) echo "New tools on the block. Dependencies locked." ;;
        26) echo "The types align. Structure holds." ;;
        27) echo "Schema evolved. The foundation never cracks." ;;
        28) echo "Every scenario survived. The code is certified." ;;
        29) echo "Live wire. The mesh is breathing in real time." ;;
        30) echo "They tried to slow the sovereign. The queue remembers." ;;
        31) echo "Slate wiped. Fresh block, same architect." ;;
        32) echo "Secrets acknowledged. The sovereign keeps his keys." ;;
        *) echo "" ;;
    esac
}

speak() {
    local msg="$1"
    # Write to buffer for audit trail
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $msg" >> "$VOICE_BUFFER"
    
    # Speak the message on macOS
    if command -v say > /dev/null; then
        say "$msg" &
    fi
}

announce_intent() {
    local msg="Am ready to ignite the lighter. Initializing task: $1"
    speak "$msg"
}

announce_completion() {
    local msg="Task Complete. $1. System sovereignty increased by $2 percent."
    speak "$msg"
}

fire_phrase() {
    local num=$1
    local text=$(get_phrase "$num")
    if [ -n "$text" ]; then
        speak "$text"
    else
        echo "Phrase $num not found."
    fi
}

# Allow direct execution: ./.agents/voice_narrative.sh "Message" or fire_phrase by number
if [ "$#" -gt 0 ]; then
    if [[ "$1" =~ ^[0-9]+$ ]]; then
        fire_phrase "$1"
    else
        announce_intent "$1"
    fi
fi
