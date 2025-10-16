#!/usr/bin/env python3
"""
WhisperX Audio to Phoneme Alignment Script
Transcribes audio and provides phoneme-level alignment for viseme generation
"""

import argparse
import json
import sys
import os

try:
    import whisperx
    import torch
except ImportError as e:
    print(f"Error: Missing required package: {e}", file=sys.stderr)
    print("Please install WhisperX:", file=sys.stderr)
    print("  pip install whisperx", file=sys.stderr)
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description='Run WhisperX for phoneme alignment')
    parser.add_argument('audio_file', help='Path to audio file')
    parser.add_argument('--output', required=True, help='Output JSON file path')
    parser.add_argument('--model', default='base', help='Whisper model size')
    parser.add_argument('--language', default=None, help='Language code (auto-detect if not specified)')
    parser.add_argument('--device', default='cpu', help='Device: cpu or cuda')
    parser.add_argument('--batch-size', type=int, default=16, help='Batch size')
    parser.add_argument('--compute-type', default='float32', help='Compute type')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        print(f"Loading WhisperX model: {args.model}", file=sys.stderr)
    
    # Load audio
    audio = whisperx.load_audio(args.audio_file)
    
    # Load Whisper model
    model = whisperx.load_model(
        args.model,
        args.device,
        compute_type=args.compute_type,
        language=args.language
    )
    
    if args.verbose:
        print("Transcribing audio...", file=sys.stderr)
    
    # Transcribe
    result = model.transcribe(audio, batch_size=args.batch_size)
    
    if args.verbose:
        print(f"Detected language: {result.get('language', 'unknown')}", file=sys.stderr)
        print("Aligning phonemes...", file=sys.stderr)
    
    # Load alignment model
    model_a, metadata = whisperx.load_align_model(
        language_code=result["language"],
        device=args.device
    )
    
    # Align characters (WhisperX provides character-level, not phoneme-level alignment)
    result_aligned = whisperx.align(
        result["segments"],
        model_a,
        metadata,
        audio,
        args.device,
        return_char_alignments=True  # Enable character timing data
    )
    
    # Prepare output data
    output_data = {
        'language': result.get('language', 'unknown'),
        'segments': result_aligned.get('segments', []),
        'word_segments': result_aligned.get('word_segments', []),
        'text': ' '.join([seg.get('text', '') for seg in result_aligned.get('segments', [])]).strip()
    }
    
    # Write to output file
    with open(args.output, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    if args.verbose:
        print(f"Results saved to: {args.output}", file=sys.stderr)


if __name__ == '__main__':
    main()
