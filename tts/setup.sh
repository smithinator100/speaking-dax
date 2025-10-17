#!/bin/bash

# Setup script for Orpheus TTS
echo "Installing Orpheus TTS..."

# Install the orpheus-speech package
pip install orpheus-speech

# Note: If you encounter issues with vllm, you may need to downgrade:
# pip install vllm==0.7.3

echo "Orpheus TTS installation complete!"
echo "You can now use the text-to-speech functionality."


