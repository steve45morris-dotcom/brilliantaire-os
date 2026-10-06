#!/usr/bin/env python3
import os
import sys
import json
import re
import google.generativeai as genai
from PIL import Image

def get_api_key():
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key
    
    secrets_path = "/Users/alexanderanthony/.zsh_secrets"
    if os.path.exists(secrets_path):
        try:
            with open(secrets_path, "r") as f:
                for line in f:
                    if "GEMINI_API_KEY" in line:
                        parts = line.split("=")
                        if len(parts) > 1:
                            return parts[1].replace('"', '').replace("'", "").strip()
        except Exception:
            pass
            
    env_path = "/Users/alexanderanthony/.env"
    if os.path.exists(env_path):
        try:
            with open(env_path, "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY"):
                        parts = line.split("=")
                        if len(parts) > 1:
                            return parts[1].strip()
        except Exception:
            pass
            
    return None

def run_local_programmatic_audit(image_path, output_path):
    print("[AURA-CRITIC] FALLBACK: Running local programmatic design linter...")
    html_path = "/Users/alexanderanthony/dashboard/dist/index.html"
    
    has_emojis = False
    typography_valid = False
    glassmorphism_valid = False
    color_palette_valid = True
    critique_bullets = []
    
    if os.path.exists(html_path):
        try:
            with open(html_path, "r", encoding="utf-8") as f:
                html_content = f.read()
                
            # 1. Emoji Check (Emojis are strictly banned under Rule 2 of design-taste)
            emoji_pattern = re.compile(
                r"[\U0001F600-\U0001F64F]" # emoticons
                r"|[\U0001F300-\U0001F5FF]" # symbols & pictographs
                r"|[\U0001F680-\U0001F6FF]" # transport & map
                r"|[\U0001F1E0-\U0001F1FF]" # flags
                r"|[\u2600-\u27BF]" # miscellaneous
                r"|[\u2b50\u2b06\u2194\u2195\u25c0\u23f9\u23fa]" # extra symbols
            )
            # Remove script/style tags for content search
            clean_html = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', html_content)
            clean_html = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', '', clean_html)
            visible_text = re.sub(r'<[^>]*>', ' ', clean_html)
            
            matches = emoji_pattern.findall(visible_text)
            if len(matches) > 0:
                has_emojis = True
                critique_bullets.append(f"EMOJI BANNED: Layout contains active emoji characters: {set(matches)}.")
                
            # 2. Typography Check
            if "Outfit" in html_content:
                typography_valid = True
            else:
                critique_bullets.append("TYPOGRAPHY VIOLATION: Font family 'Outfit' is missing in script imports or style definitions.")
                
            # 3. Pure Black Check (Ensure we target CSS backgrounds, not SVG shapes or bundle JS strings)
            bg_black_pattern = re.compile(
                r"background(?:-color)?\s*:\s*(?:#000000|#000\b|black|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*1\s*\))",
                re.IGNORECASE
            )
            if bg_black_pattern.search(clean_html):
                color_palette_valid = False
                critique_bullets.append("COLOR PALETTE VIOLATION: Banned pure black (#000000) background detected in styles.")
                
            # 4. Glassmorphism Check
            if "backdrop-filter" in html_content or "backdrop-blur" in html_content or "rgba(" in html_content:
                glassmorphism_valid = True
            else:
                critique_bullets.append("GLASSMORPHISM VIOLATION: No active backdrop blur properties or glass variables declared.")
                
        except Exception as e:
            critique_bullets.append(f"COMPILER ERROR: Failed to parse built HTML: {e}")
    else:
        critique_bullets.append("CRITICAL ERROR: Compiled file dashboard/dist/index.html was not found.")
        
    score = 10.0 - (len(critique_bullets) * 1.5)
    score = max(1.0, min(10.0, score))
    
    report = {
        "design_score": score,
        "has_emojis": has_emojis,
        "typography_valid": typography_valid,
        "glassmorphism_valid": glassmorphism_valid,
        "color_palette_valid": color_palette_valid,
        "critique_bullets": critique_bullets,
        "patch_suggestions": [
            {
                "element": "index.css",
                "css_rules": "Strictly import Outfit & JetBrains Mono; remove emojis; enforce slate-based glass backgrounds."
            }
        ],
        "fallback_active": True,
        "status": "PASS" if score >= 7.0 and not has_emojis else "FAIL"
    }
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print(f"[AURA-CRITIC] Fallback report successfully written to: {output_path}")
    print("\n================ AURA LOCAL REPORT ================")
    print(json.dumps(report, indent=2))
    print("==================================================\n")
    
    if report["status"] == "FAIL":
        print("[AURA-CRITIC] Fallback Validation: FAIL.")
        sys.exit(1)
    else:
        print("[AURA-CRITIC] Fallback Validation: SUCCESS.")
        sys.exit(0)

def run_vision_audit(image_path, output_path):
    print(f"[AURA-CRITIC] Ingesting preview screenshot: {image_path}")
    
    api_key = get_api_key()
    if not api_key:
        print("[AURA-CRITIC] WARNING: GEMINI_API_KEY not found. Defaulting to local linter...")
        run_local_programmatic_audit(image_path, output_path)
        return
        
    genai.configure(api_key=api_key)
    
    if not os.path.exists(image_path):
        print(f"[AURA-CRITIC] ERROR: Screenshot file {image_path} does not exist.")
        sys.exit(1)
        
    try:
        img = Image.open(image_path)
    except Exception as e:
        print(f"[AURA-CRITIC] ERROR: Failed to load image: {e}")
        sys.exit(1)
        
    generation_config = {
        "temperature": 0.2,
        "top_p": 0.95,
        "max_output_tokens": 2048,
        "response_mime_type": "application/json"
    }
    
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config
    )
    
    prompt = """
You are AURA (Automated UI/UX Review Architect), an elite design auditor specializing in modern high-fidelity frontends.
Evaluate the attached screenshot of the dashboard rendering against these visual design standards:
1. Typography: Outfit font for title tags and headings, JetBrains Mono for numbers. Font weights and leading must align perfectly.
2. Neutral Dark Aesthetics: Slate/zinc neutral backdrops, no solid pitch black, saturation of accents < 80%.
3. Banned elements: Banned AI-clichés (purple glowing grids, generic card layouts). Emojis are BANNED.
4. Spacing discipline: Bento grid padding, alignments, lack of vertical crowding.
5. Glassmorphism edge refraction: Verify the borders and inner shadows look realistic.

You must respond exclusively with a valid JSON object of this structure:
{
  "design_score": <float, 1.0 to 10.0 representing visual appeal>,
  "has_emojis": <boolean, true if any emoji symbols are rendered on the page>,
  "typography_valid": <boolean>,
  "glassmorphism_valid": <boolean>,
  "color_palette_valid": <boolean>,
  "critique_bullets": [
    "<bullet 1 containing specific layout/style criticisms>",
    "<bullet 2...>"
  ],
  "patch_suggestions": [
    {
      "element": "<CSS selector or file component target>",
      "css_rules": "<exact CSS declarations to solve the critique bullet, e.g. padding: 24px; border: 1px solid rgba(255,255,255,0.08);>"
    }
  ]
}
"""
    
    try:
        print("[AURA-CRITIC] Querying Gemini model for UI/UX audit...")
        response = model.generate_content([prompt, img])
        response_text = response.text.strip()
        parsed_report = json.loads(response_text)
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(parsed_report, f, indent=2)
            
        print(f"[AURA-CRITIC] Audit report successfully written to: {output_path}")
        print("\n================ AURA CRITIC REPORT ================")
        print(json.dumps(parsed_report, indent=2))
        print("==================================================\n")
        
        if parsed_report.get("design_score", 0.0) < 7.0 or parsed_report.get("has_emojis", False):
            print("[AURA-CRITIC] Validation: FAIL. Score below threshold or contains banned emojis.")
            sys.exit(1)
        else:
            print("[AURA-CRITIC] Validation: SUCCESS. UI meets premium creative standards.")
            sys.exit(0)
            
    except Exception as e:
        print(f"[AURA-CRITIC] WARNING: Gemini API call failed ({e}). Falling back to local linter...")
        run_local_programmatic_audit(image_path, output_path)

if __name__ == "__main__":
    img_in = sys.argv[1] if len(sys.argv) > 1 else "/Users/alexanderanthony/sentinel_preview.png"
    report_out = sys.argv[2] if len(sys.argv) > 2 else "/Users/alexanderanthony/outputs/aura/critic_report.json"
    run_vision_audit(img_in, report_out)
