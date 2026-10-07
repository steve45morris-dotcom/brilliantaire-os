#!/bin/bash
# Check Supernova Core Health
echo "--- Core Health ---"
http GET localhost:8001/health/ready
echo -e "\n--- Sentinel Health ---"
http GET localhost:8000/health
