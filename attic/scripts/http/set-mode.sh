#!/bin/bash
# Set System Mode (GM or FM)
MODE=${1:-"GM"}
echo "--- Setting Mode to $MODE ---"
http POST localhost:8001/set_mode mode="$MODE"
