#!/bin/bash

# Wrapper script for easy MP3 to viseme conversion
# Usage: ./convert.sh input.mp3 [output.json] [dialog.txt]

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RHUBARB_PATH="$SCRIPT_DIR/Rhubarb-Lip-Sync-1.13.0-macOS/rhubarb"

# Export for the Node script to use
export RHUBARB_PATH

# Run the Node script with arguments
node "$SCRIPT_DIR/mp3-to-viseme.js" "$@"

