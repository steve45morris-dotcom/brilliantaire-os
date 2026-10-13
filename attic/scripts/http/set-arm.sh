#!/bin/bash
# Set Active Arm (creative, tech, hybrid, security)
ARM=${1:-"creative"}
echo "--- Setting Arm to $ARM ---"
http POST localhost:8001/set_arm arm="$ARM"
