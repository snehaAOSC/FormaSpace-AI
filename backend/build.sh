#!/usr/bin/env bash
# Exit on error
set -o errexit

python -m pip install --upgrade pip
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi
