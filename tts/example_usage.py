"""
Example usage of Orpheus TTS for the speaking-dax project
"""

from orpheus_tts_wrapper import OrpheusTTS


def generate_sample_speech():
    """Generate sample speech files for testing"""
    
    # Initialize the TTS model
    print("Initializing Orpheus TTS...")
    tts = OrpheusTTS()
    
    # Example 1: Simple conversational speech
    print("\n1. Generating simple conversational speech...")
    tts.generate_speech(
        text="Hey there! Welcome to the speaking dax project. This is a demonstration of human-like text to speech.",
        output_path="output/sample_1.wav",
        voice="tara"
    )
    
    # Example 2: Speech with emotion
    print("\n2. Generating speech with emotional tags...")
    tts.generate_speech(
        text="<laugh> That's incredible! I can't believe how natural this sounds. <sigh> Technology these days is just amazing.",
        output_path="output/sample_2_emotion.wav",
        voice="leo"
    )
    
    # Example 3: Different voice
    print("\n3. Generating speech with different voice...")
    tts.generate_speech(
        text="The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
        output_path="output/sample_3_voice.wav",
        voice="dan"
    )
    
    # Example 4: For lip sync integration
    print("\n4. Generating speech for lip sync testing...")
    tts.generate_speech(
        text="Hello world! My name is Dax and I'm here to demonstrate synchronized lip movements with text to speech.",
        output_path="output/sample_for_lipsync.wav",
        voice="tara"
    )
    
    print("\n✅ All samples generated successfully!")
    print("You can now use these audio files with the Gentle lip sync library.")


def main():
    """Main entry point"""
    try:
        generate_sample_speech()
    except ImportError as e:
        print("\n❌ Error: Orpheus TTS is not installed.")
        print("Please run the setup script first:")
        print("  cd tts && bash setup.sh")
        print("\nOr install manually:")
        print("  pip install orpheus-speech")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise


if __name__ == "__main__":
    main()


