import io
import json
import struct

from lingvilibrist_nlp.native_host import handle_message, read_message, write_message


def encode(value):
    payload = json.dumps(value, ensure_ascii=False).encode("utf-8")
    return struct.pack("=I", len(payload)) + payload


def test_native_message_round_trip():
    stream = io.BytesIO(encode({"type": "ping", "requestId": "r1"}))
    message = read_message(stream)
    assert message["type"] == "ping"

    output = io.BytesIO()
    write_message(output, handle_message(message))
    output.seek(0)
    response = read_message(output)
    assert response["ok"] is True
    assert response["requestId"] == "r1"
    assert response["protocolVersion"] == 1


def test_analyze_message_returns_local_morphology():
    response = handle_message({"type": "analyze", "requestId": 7, "text": "новая проект запущен"})
    assert response["ok"] is True
    assert response["requestId"] == 7
    rule_ids = [item["ruleId"] for item in response["analysis"]["findings"]]
    assert "ru.morph.agreement-candidate" in rule_ids


def test_native_host_rejects_invalid_allowlist_shape():
    response = handle_message({"type": "analyze", "text": "текст", "allowlist": "not-a-list"})
    assert response["ok"] is False
    assert response["error"] == "invalid_allowlist"


def test_read_message_rejects_oversized_header_without_allocating_payload():
    stream = io.BytesIO(struct.pack("=I", 5 * 1024 * 1024))
    try:
        read_message(stream)
    except ValueError as error:
        assert "out of bounds" in str(error)
    else:
        raise AssertionError("expected oversized native message to be rejected")
