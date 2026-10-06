import os
import json
import argparse
from pathlib import Path

def generate_metadata(audio_dir, transcript, output_file, speaker_id=0):
    """
    Scaffold metadata for VibeVoice fine-tuning.
    Format: List of dicts with audio_path, text, and optional speaker info.
    """
    audio_path = Path(audio_dir).absolute()
    metadata = []
    
    for f in audio_path.glob("*.mp3"):
        metadata.append({
            "audio": str(f),
            "text": transcript,
            "speaker": speaker_id
        })
        
    with open(output_file, "w") as out:
        json.dump(metadata, out, indent=4)
    print(f"[+] Metadata generated: {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio_dir", required=True)
    parser.add_argument("--transcript", required=True)
    parser.add_argument("--output", default="data/finetuning/vibevoice_asr/metadata/train.json")
    args = parser.parse_args()
    
    generate_metadata(args.audio_dir, args.transcript, args.output)
