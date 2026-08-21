from __future__ import annotations

import json
import struct
import sys
from typing import BinaryIO

from .analyzer import analyze_text

PROTOCOL_VERSION = 1
MAX_MESSAGE_BYTES = 4 * 1024 * 1024
MAX_TEXT_CHARS = 500_000


def read_message(stream: BinaryIO) -> dict | None:
    header = stream.read(4)
    if not header:
        return None
    if len(header) != 4:
        raise ValueError("incomplete native messaging header")
    (size,) = struct.unpack("=I", header)
    if size <= 0 or size > MAX_MESSAGE_BYTES:
        raise ValueError(f"native messaging payload size out of bounds: {size}")
    payload = stream.read(size)
    if len(payload) != size:
        raise ValueError("incomplete native messaging payload")
    value = json.loads(payload.decode("utf-8"))
    if not isinstance(value, dict):
        raise ValueError("native messaging payload must be a JSON object")
    return value


def write_message(stream: BinaryIO, value: dict) -> None:
    payload = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(payload) > MAX_MESSAGE_BYTES:
        raise ValueError("native messaging response is too large")
    stream.write(struct.pack("=I", len(payload)))
    stream.write(payload)
    stream.flush()


def handle_message(message: dict) -> dict:
    request_id = message.get("requestId")
    message_type = str(message.get("type") or "")

    if message_type == "ping":
        return {
            "ok": True,
            "protocolVersion": PROTOCOL_VERSION,
            "requestId": request_id,
            "service": "lingvilibrist-local-nlp",
        }

    if message_type != "analyze":
        return {
            "ok": False,
            "protocolVersion": PROTOCOL_VERSION,
            "requestId": request_id,
            "error": "unsupported_message_type",
        }

    text = message.get("text")
    if not isinstance(text, str) or not text.strip():
        return {
            "ok": False,
            "protocolVersion": PROTOCOL_VERSION,
            "requestId": request_id,
            "error": "empty_text",
        }
    if len(text) > MAX_TEXT_CHARS:
        return {
            "ok": False,
            "protocolVersion": PROTOCOL_VERSION,
            "requestId": request_id,
            "error": "text_too_large",
        }

    raw_allowlist = message.get("allowlist")
    allowlist = None
    if raw_allowlist is not None:
        if not isinstance(raw_allowlist, list) or not all(isinstance(item, str) for item in raw_allowlist):
            return {
                "ok": False,
                "protocolVersion": PROTOCOL_VERSION,
                "requestId": request_id,
                "error": "invalid_allowlist",
            }
        allowlist = set(raw_allowlist[:10_000])

    result = analyze_text(text, allowlist=allowlist)
    return {
        "ok": True,
        "protocolVersion": PROTOCOL_VERSION,
        "requestId": request_id,
        "analysis": result,
    }


def serve(stdin: BinaryIO | None = None, stdout: BinaryIO | None = None) -> None:
    source = stdin or sys.stdin.buffer
    target = stdout or sys.stdout.buffer

    while True:
        try:
            message = read_message(source)
            if message is None:
                return
            write_message(target, handle_message(message))
        except Exception as exc:
            # Native Messaging stdout is protocol-only. Diagnostics belong on stderr.
            print(f"Lingvilibrist native host error: {type(exc).__name__}: {exc}", file=sys.stderr, flush=True)
            try:
                write_message(target, {
                    "ok": False,
                    "protocolVersion": PROTOCOL_VERSION,
                    "error": "native_host_error",
                    "detail": str(exc)[:300],
                })
            except Exception:
                return


def main() -> None:
    serve()


if __name__ == "__main__":
    main()
