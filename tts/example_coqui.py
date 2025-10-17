"""
Example usage of Coqui TTS for the speaking-dax project
"""

from coqui_tts_wrapper import CoquiTTS


def generate_sample_speech():
    """Generate sample speech files for testing"""
    
    # Initialize the TTS model (fast model, no GPU needed)
    print("Initializing Coqui TTS...")
    tts = CoquiTTS(model_type="fast", gpu=False)
    
    # Example 1: Simple speech
    print("\n1. Generating simple speech...")
    tts.generate_speech(
        text="Hey there! Welcome to the speaking dax project. This is a demonstration of text to speech.",
        output_path="output/coqui_sample_1.wav"
    )
    
    # Example 2: Longer text
    print("\n2. Generating longer speech...")
    tts.generate_speech(
        text="The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
        output_path="output/coqui_sample_2.wav"
    )
    
    # Example 3: For lip sync integration
    print("\n3. Generating speech for lip sync testing...")
    tts.generate_speech(
        text="Hello world! My name is Dax and I'm here to demonstrate synchronized lip movements with text to speech.",
        output_path="output/coqui_for_lipsync.wav"
    )
    
    print("\n✅ All samples generated successfully!")
    print("You can now use these audio files with the Gentle lip sync library.")
    print("\nNext steps:")
    print("1. Process audio through Gentle: gentle/align.py")
    print("2. Convert phonemes to visemes: lip-sync-libraries/phoneme-to-viseme.js")
    print("3. Apply mouth shapes from: mouth-shapes-dax-transition/")


def main():
    """Main entry point"""
    try:
        generate_sample_speech()
    except ImportError:
        print("\n❌ Error: Coqui TTS is not installed.")
        print("Please run the setup script first:")
        print("  bash setup_coqui.sh")
        print("\nOr install manually:")
        print("  pip3 install TTS")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise


if __name__ == "__main__":
    main()



