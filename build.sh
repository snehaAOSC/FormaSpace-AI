#!/usr/bin/env bash
# Exit on error
set -o errexit

python -m pip install --upgrade pip
if [ -f backend/requirements.txt ]; then
    pip install -r backend/requirements.txt
elif [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi
