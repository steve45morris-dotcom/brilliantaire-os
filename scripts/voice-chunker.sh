#!/bin/bash
# voice-chunker.sh - Splits narration text into safe speech chunks

python3 -c '
import sys
import re

def chunk_text(text, max_len=350):
    if not text:
        return []
    # Split by line breaks first
    lines = text.split("\n")
    chunks = []
    
    # Split by sentence endings: . ? ! ; : followed by space
    sentence_end = re.compile(r"([.?!;:])\s+")
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        parts = []
        start = 0
        for match in sentence_end.finditer(line):
            end = match.end()
            parts.append(line[start:end].strip())
            start = end
        if start < len(line):
            parts.append(line[start:].strip())
            
        for part in parts:
            if not part:
                continue
            # If the part fits, keep it
            if len(part) <= max_len:
                chunks.append(part)
            else:
                # Need to split long sentence
                remaining = part
                while len(remaining) > max_len:
                    sub = remaining[:max_len]
                    # Comma split
                    split_idx = sub.rfind(",")
                    if split_idx != -1 and split_idx > 50:
                        chunk_part = remaining[:split_idx + 1].strip()
                        chunks.append(chunk_part)
                        remaining = remaining[split_idx + 1:].strip()
                    else:
                        # Space/word boundary split
                        split_idx = sub.rfind(" ")
                        if split_idx != -1 and split_idx > 50:
                            chunk_part = remaining[:split_idx].strip()
                            chunks.append(chunk_part)
                            remaining = remaining[split_idx:].strip()
                        else:
                            # Force split
                            chunk_part = remaining[:max_len].strip()
                            chunks.append(chunk_part)
                            remaining = remaining[max_len:].strip()
                if remaining:
                    chunks.append(remaining)
    return chunks

if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read()
    for chunk in chunk_text(text):
        print(chunk)
' "$@"
