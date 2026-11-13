#!/usr/bin/env python3
"""
File:        tools/generate-gemini-sentences.py
What it is:  Generates standalone, discrete sentence-by-sentence audio clips (dari to dari)
             using Gemini Live API (gemini-3.8-live) with voice 'Fenrir'.
Usage:       .venv/bin/python tools/generate-gemini-sentences.py [--lesson l03] [--all] [--force]
"""

import argparse
import asyncio
import json
import os
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LESSONS_DIR = ROOT / "content" / "lessons"
MANIFEST_JSON = ROOT / "assets" / "audio" / "manifest.json"
BN_STRINGS = ROOT / "src" / "i18n" / "strings" / "bn.json"
KEY_FILE = ROOT / "gemini-key"

if not KEY_FILE.exists():
    print(f"Error: {KEY_FILE} not found. Please place your API key in gemini-key.")
    sys.exit(1)

with open(KEY_FILE, "r", encoding="utf-8") as f:
    GEMINI_API_KEY = f.read().strip()

try:
    from google import genai
except ImportError:
    print("google-genai not found. Run with .venv/bin/python.")
    sys.exit(1)

with open(BN_STRINGS, "r", encoding="utf-8") as f:
    SPEECH_TABLE = json.load(f).get("speech", {})

def prepare_for_speech(text: str) -> str:
    """Apply phonetic substitutions (e.g. × -> বাই, ( -> ' ', ) -> ' ')."""
    out = text
    for symbol, spoken in SPEECH_TABLE.items():
        out = out.replace(symbol, spoken)
    return out.strip()

def pcm_to_mp3(pcm_data: bytes, out_mp3: Path):
    """Convert raw 24kHz 16-bit mono PCM bytes to standard MP3."""
    out_mp3.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = Path(tmp.name)
    try:
        with wave.open(str(tmp_wav), "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(24000)
            wav.writeframes(pcm_data)
            
        cmd = [
            "ffmpeg", "-y", "-i", str(tmp_wav),
            "-ar", "24000", "-b:a", "96k",
            str(out_mp3)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    finally:
        if tmp_wav.exists():
            tmp_wav.unlink()

def extract_sentences_from_lesson(lesson_path: Path):
    with open(lesson_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    lid = data["id"]
    intro = data.get("intro", {})
    pars = intro.get("paragraphs", []) if intro else []
    
    sentences = []
    for par in pars:
        pid = par["id"]
        bn_text = par.get("text", {}).get("bn", "")
        # Split on Dari '।'
        parts = [s.strip() for s in bn_text.split("।") if s.strip()]
        for i, raw_s in enumerate(parts):
            s_text = raw_s + "।"
            s_key = f"{lid}.intro.{pid}.s{i+1:02d}"
            spoken_text = prepare_for_speech(s_text)
            sentences.append({
                "key": s_key,
                "text": s_text,
                "spoken": spoken_text,
                "lesson": lid,
                "paragraph": pid,
            })
    return sentences

async def generate_sentence_clip(client, voice: str, text: str) -> bytes:
    config = {
        "response_modalities": ["AUDIO"],
        "speech_config": {
            "voice_config": {
                "prebuilt_voice_config": {
                    "voice_name": voice
                }
            }
        }
    }
    async with client.aio.live.connect(model="gemini-3.8-live", config=config) as session:
        prompt = (
            f"Read the following Bengali sentence clearly, warmly, and naturally, speaking only the "
            f"exact Bengali words without any introductory English remarks, preamble, or repetition: {text}"
        )
        content = [{"role": "user", "parts": [{"text": prompt}]}]
        await session.send_client_content(turns=content, turn_complete=True)
        chunks = []
        async for resp in session.receive():
            sc = resp.server_content
            if sc and sc.model_turn:
                for part in sc.model_turn.parts:
                    if part.inline_data:
                        chunks.append(part.inline_data.data)
            if sc and sc.turn_complete:
                break
        return b"".join(chunks)

def update_manifest(new_keys: list):
    with open(MANIFEST_JSON, "r", encoding="utf-8") as f:
        m = json.load(f)
    bn_set = set(m.get("bn", []))
    for k in new_keys:
        bn_set.add(k)
    m["bn"] = sorted(list(bn_set))
    with open(MANIFEST_JSON, "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, indent=2)
    print(f"Updated manifest.json with {len(new_keys)} keys (total bn clips: {len(m['bn'])}).")

async def main():
    parser = argparse.ArgumentParser(description="Generate discrete sentence audio clips with Gemini Live.")
    parser.add_argument("--lesson", default="l03", help="Lesson ID to generate (e.g. l03). Default: l03.")
    parser.add_argument("--all", action="store_true", help="Generate all lessons.")
    parser.add_argument("--voice", default="Fenrir", help="Gemini voice name (default: Fenrir).")
    parser.add_argument("--force", action="store_true", help="Overwrite existing audio files.")
    args = parser.parse_args()

    client = genai.Client(api_key=GEMINI_API_KEY, http_options={"api_version": "v1beta"})

    if args.all:
        lesson_files = sorted(LESSONS_DIR.glob("lesson-*.json"))
    else:
        num = args.lesson.replace("l", "")
        lesson_files = [LESSONS_DIR / f"lesson-{int(num):02d}.json"]

    all_sentences = []
    for lf in lesson_files:
        if lf.exists():
            all_sentences.extend(extract_sentences_from_lesson(lf))

    print(f"Collected {len(all_sentences)} sentence clips to process.")
    generated_keys = []

    for idx, item in enumerate(all_sentences, 1):
        key = item["key"]
        out_mp3 = ROOT / "assets" / "audio" / "bn" / "lessons" / f"{key}.mp3"

        if out_mp3.exists() and not args.force and out_mp3.stat().st_size > 1000:
            print(f"[{idx}/{len(all_sentences)}] Skipping existing {key}")
            generated_keys.append(key)
            continue

        print(f"[{idx}/{len(all_sentences)}] Synthesizing {key}: '{item['text']}'...")
        pcm = None
        retries = 3
        for attempt in range(1, retries + 1):
            try:
                pcm = await generate_sentence_clip(client, args.voice, item["spoken"])
                if pcm and len(pcm) > 1000:
                    break
            except Exception as e:
                print(f"  Attempt {attempt} failed: {e}")
                await asyncio.sleep(2 * attempt)

        if not pcm or len(pcm) < 1000:
            print(f"  FAILED to generate audio for {key} after {retries} attempts.")
            continue

        pcm_to_mp3(pcm, out_mp3)
        generated_keys.append(key)
        print(f"  Saved {out_mp3.name} ({len(pcm)} PCM bytes)")
        # Small delay between calls to be gentle on free-tier rate limits
        await asyncio.sleep(1.0)

    if generated_keys:
        update_manifest(generated_keys)

if __name__ == "__main__":
    asyncio.run(main())

