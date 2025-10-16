#!/bin/bash

# Hybrid Pipeline Convenience Script
# Combines WhisperX auto-transcription with Gentle forced alignment

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if audio file is provided
if [ $# -eq 0 ]; then
    echo ""
    echo "🚀 Hybrid Pipeline: WhisperX → Gentle"
    echo "   Best accuracy + convenience for lip-sync viseme generation"
    echo ""
    echo "Usage: $0 <audio.mp3> [output.json] [options]"
    echo ""
    echo "Example:"
    echo "  $0 audio.mp3"
    echo "  $0 audio.mp3 output.json"
    echo "  $0 audio.mp3 output.json --whisper-model large-v2"
    echo ""
    echo "For more options, run:"
    echo "  node $SCRIPT_DIR/hybrid-to-viseme.js --help"
    echo ""
    exit 1
fi

# Run the Node.js script with all arguments
node "$SCRIPT_DIR/hybrid-to-viseme.js" "$@"

