from __future__ import annotations

import argparse
import json
import sys

from .analyzer import analyze_text


def main() -> None:
    parser = argparse.ArgumentParser(description="Local morphology analyzer for Lingvilibrist")
    parser.add_argument("--text", help="Analyze text passed as an argument. If omitted, read UTF-8 text from stdin.")
    args = parser.parse_args()

    text = args.text if args.text is not None else sys.stdin.read()
    if not text.strip():
        parser.error("input text is empty")
    result = analyze_text(text)
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
