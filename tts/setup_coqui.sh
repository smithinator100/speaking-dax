#!/bin/bash

# Setup script for Coqui TTS (simpler alternative to Orpheus)
echo "Installing Coqui TTS..."

# Install Coqui TTS
pip3 install TTS

echo "Coqui TTS installation complete!"
echo "You can now use the text-to-speech functionality."
echo ""
echo "To test it, run:"
echo "  python3 coqui_tts_wrapper.py"



