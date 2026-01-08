#!/usr/bin/env python3
"""
Translate en.json to es.json using DeepL API (high quality) or Google Translate (fallback).

This is part of the profession compilation pipeline:
1. professions.raw.json (source of truth)
2. compile-professions.mjs → extracts translations to en.json
3. translate-es.py → translates en.json to es.json
4. compile-professions.mjs → uses translations for final output

Usage:
  # With DeepL (recommended - set DEEPL_API_KEY env var)
  DEEPL_API_KEY=your-key npm run translate:es

  # With Google Translate (fallback)
  npm run translate:es -- --google

Options:
  --force    Overwrite existing es.json translations
  --keys     Only translate specific keys (comma-separated prefix, e.g. "p011,p012")
  --batch    Batch size for translation (default: 50)
  --dry-run  Show what would be translated without writing
  --google   Use Google Translate instead of DeepL
"""

import json
import os
import sys
import argparse
import time
from pathlib import Path
from tqdm import tqdm

# Setup paths
SCRIPT_DIR = Path(__file__).parent.resolve()
CONTENT_DIR = SCRIPT_DIR.parent / "content" / "translations"
EN_JSON = CONTENT_DIR / "en.json"
ES_JSON = CONTENT_DIR / "es.json"

def setup_deepl():
    """Initialize DeepL translator."""
    import deepl
    api_key = os.environ.get("DEEPL_API_KEY")
    if not api_key:
        print("❌ DEEPL_API_KEY environment variable not set")
        print("   Get a free API key at: https://www.deepl.com/pro-api")
        print("   Then run: DEEPL_API_KEY=your-key python3 scripts/translate-es.py")
        sys.exit(1)

    translator = deepl.Translator(api_key)
    # Check usage
    usage = translator.get_usage()
    if usage.character.limit:
        remaining = usage.character.limit - usage.character.count
        print(f"   DeepL usage: {usage.character.count:,}/{usage.character.limit:,} chars ({remaining:,} remaining)")
    return translator

def setup_google():
    """Initialize Google Translator."""
    from deep_translator import GoogleTranslator
    return GoogleTranslator(source='en', target='es')

def translate_with_deepl(translator, texts):
    """Translate texts using DeepL."""
    if not texts:
        return []

    results = []
    for text in texts:
        if not text or not text.strip():
            results.append(text)
            continue

        # Don't translate URLs or very short strings
        if text.startswith("http") or len(text) < 3:
            results.append(text)
            continue

        try:
            result = translator.translate_text(text, target_lang="ES")
            translated = result.text
            # Capitalize first letter if original was capitalized
            if text[0].isupper() and translated and translated[0].islower():
                translated = translated[0].upper() + translated[1:]
            results.append(translated)
        except Exception as e:
            print(f"\n⚠️  Error translating '{text[:50]}...': {e}")
            results.append(text)

    return results

def translate_with_google(translator, texts):
    """Translate texts using Google Translate."""
    if not texts:
        return []

    results = []
    for text in texts:
        if not text or not text.strip():
            results.append(text)
            continue

        if text.startswith("http") or len(text) < 3:
            results.append(text)
            continue

        try:
            result = translator.translate(text)
            if text[0].isupper() and result and result[0].islower():
                result = result[0].upper() + result[1:]
            results.append(result)
        except Exception as e:
            print(f"\n⚠️  Error translating '{text[:50]}...': {e}")
            results.append(text)

    return results

def should_translate_key(key):
    """Determine if a key should be translated."""
    if ".tool." in key:
        return False
    if ".source." in key and (".url" in key or ".title" in key or ".publisher" in key or ".year" in key):
        return False
    return True

def main():
    parser = argparse.ArgumentParser(description="Translate en.json to es.json")
    parser.add_argument("--force", action="store_true", help="Overwrite existing translations")
    parser.add_argument("--keys", type=str, help="Only translate keys matching prefixes (comma-separated)")
    parser.add_argument("--batch", type=int, default=50, help="Batch size for translation")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be translated without writing")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between batches (seconds)")
    parser.add_argument("--google", action="store_true", help="Use Google Translate instead of DeepL")
    args = parser.parse_args()

    service = "Google Translate" if args.google else "DeepL"
    print(f"🌐 {service}: English → Spanish")
    print("=" * 50)

    # Load English source
    print(f"\n📖 Loading {EN_JSON}...")
    with open(EN_JSON, "r", encoding="utf-8") as f:
        en_data = json.load(f)
    print(f"   Found {len(en_data)} keys")

    # Load existing Spanish translations
    es_data = {}
    if ES_JSON.exists() and not args.force:
        print(f"📖 Loading existing {ES_JSON}...")
        with open(ES_JSON, "r", encoding="utf-8") as f:
            es_data = json.load(f)
        print(f"   Found {len(es_data)} existing translations")

    # Filter keys to translate
    keys_to_translate = []
    for key in en_data.keys():
        if not should_translate_key(key):
            continue

        # Skip if already translated (unless force)
        if not args.force and key in es_data and es_data[key] != en_data[key]:
            continue

        # Filter by prefix if specified
        if args.keys:
            prefixes = [p.strip() for p in args.keys.split(",")]
            if not any(key.startswith(prefix) for prefix in prefixes):
                continue

        keys_to_translate.append(key)

    print(f"\n🔄 Keys to translate: {len(keys_to_translate)}")

    if not keys_to_translate:
        print("✅ Nothing to translate!")
        return

    # Estimate characters
    total_chars = sum(len(en_data[k]) for k in keys_to_translate)
    print(f"   Total characters: {total_chars:,}")

    if args.dry_run:
        print("\n🔍 Dry run - would translate these keys:")
        for key in keys_to_translate[:20]:
            print(f"   - {key}: {en_data[key][:60]}..." if len(en_data[key]) > 60 else f"   - {key}: {en_data[key]}")
        if len(keys_to_translate) > 20:
            print(f"   ... and {len(keys_to_translate) - 20} more")
        return

    # Setup translator
    print(f"\n⚙️  Setting up {service}...")
    if args.google:
        translator = setup_google()
        translate_fn = translate_with_google
    else:
        translator = setup_deepl()
        translate_fn = translate_with_deepl
    print(f"   ✓ {service} ready")

    # Translate in batches
    print(f"\n🚀 Translating in batches of {args.batch}...")
    translated_count = 0
    errors = []

    for i in tqdm(range(0, len(keys_to_translate), args.batch), desc="Batches"):
        batch_keys = keys_to_translate[i:i + args.batch]
        batch_texts = [en_data[key] for key in batch_keys]

        try:
            translated_texts = translate_fn(translator, batch_texts)

            for key, translated in zip(batch_keys, translated_texts):
                es_data[key] = translated
                translated_count += 1
        except Exception as e:
            errors.append((batch_keys[0], str(e)))
            for key in batch_keys:
                if key not in es_data:
                    es_data[key] = en_data[key]

        # Rate limiting
        if i + args.batch < len(keys_to_translate):
            time.sleep(args.delay)

    # Ensure all keys exist in es.json
    for key, value in en_data.items():
        if key not in es_data:
            es_data[key] = value

    # Write output
    print(f"\n💾 Writing {ES_JSON}...")
    sorted_es_data = {k: es_data[k] for k in en_data.keys() if k in es_data}

    with open(ES_JSON, "w", encoding="utf-8") as f:
        json.dump(sorted_es_data, f, ensure_ascii=False, indent=2)

    # Summary
    print("\n" + "=" * 50)
    print("✅ Translation complete!")
    print(f"   Translated: {translated_count} keys")
    print(f"   Total keys: {len(sorted_es_data)}")

    if errors:
        print(f"\n⚠️  Errors ({len(errors)}):")
        for key, error in errors[:10]:
            print(f"   - {key}: {error}")

if __name__ == "__main__":
    main()
