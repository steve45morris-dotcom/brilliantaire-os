#!/bin/bash
# Trigger Repository Discovery
QUERY=${1:-"topic:automated-content-creation"}
echo "--- Triggering Discovery for Query: $QUERY ---"
http POST localhost:8001/discover query="$QUERY"
