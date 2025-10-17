"""
Coqui TTS Wrapper
A simpler, lightweight alternative for text-to-speech generation
"""

import time
from pathlib import Path
from typing import Optional, Literal

try:
    from TTS.api import TTS
except ImportError:
    print("Error: TTS package not found.")
    print("Please run: pip3 install TTS")
    raise


class CoquiTTS:
    """Wrapper class for Coqui TTS model"""
    
    # Available models
    MODELS = {
        "fast": "tts_models/en/ljspeech/tacotron2-DDC",
        "quality": "tts_models/en/vctk/vits",
        "multilingual": "tts_models/multilingual/multi-dataset/your_tts"
    }
    
    def __init__(
        self,
        model_type: Literal["fast", "quality", "multilingual"] = "fast",
        gpu: bool = False
    ):
        """
        Initialize the Coqui TTS model
        
        Args:
            model_type: The model preset to use
            gpu: Whether to use GPU acceleration
        """
        model_name = self.MODELS[model_type]
        print(f"Loading Coqui TTS model: {model_name}")
        self.tts = TTS(model_name, gpu=gpu)
        self.model_type = model_type
        print("Model loaded successfully!")
    
    def generate_speech(
        self,
        text: str,
        output_path: str,
        speaker: Optional[str] = None,
        language: Optional[str] = None,
        show_stats: bool = True
    ) -> dict:
        """
        Generate speech from text and save to file
        
        Args:
            text: The text to convert to speech
            output_path: Path where the audio file will be saved
            speaker: Speaker name (for multi-speaker models)
            language: Language code (for multilingual models)
            show_stats: Whether to print generation statistics
            
        Returns:
            Dictionary with generation statistics
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        start_time = time.monotonic()
        
        # Generate speech
        kwargs = {}
        if speaker and self.model_type in ["quality", "multilingual"]:
            kwargs["speaker"] = speaker
        if language and self.model_type == "multilingual":
            kwargs["language"] = language
        
        self.tts.tts_to_file(
            text=text,
            file_path=str(output_path),
            **kwargs
        )
        
        end_time = time.monotonic()
        generation_time = end_time - start_time
        
        stats = {
            "generation_time": generation_time,
            "output_path": str(output_path),
            "model_type": self.model_type
        }
        
        if show_stats:
            print(f"\n{'='*60}")
            print(f"Generation Statistics:")
            print(f"{'='*60}")
            print(f"Generation time:    {generation_time:.2f} seconds")
            print(f"Model type:         {self.model_type}")
            print(f"Output saved to:    {output_path}")
            print(f"{'='*60}\n")
        
        return stats
    
    def list_speakers(self):
        """List available speakers for multi-speaker models"""
        if hasattr(self.tts, 'speakers') and self.tts.speakers:
            return self.tts.speakers
        return None
    
    def list_languages(self):
        """List available languages for multilingual models"""
        if hasattr(self.tts, 'languages') and self.tts.languages:
            return self.tts.languages
        return None


def main():
    """Example usage"""
    # Initialize the TTS model
    print("Initializing Coqui TTS...")
    tts = CoquiTTS(model_type="fast")
    
    # Example text
    text = """Hello! Welcome to the speaking dax project. 
    This is a demonstration of text to speech using Coqui TTS."""
    
    # Generate speech
    tts.generate_speech(
        text=text,
        output_path="output/coqui_example.wav"
    )
    
    print("✅ Speech generation complete!")


if __name__ == "__main__":
    main()



