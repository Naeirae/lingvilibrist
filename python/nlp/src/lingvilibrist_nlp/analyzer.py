from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from razdel import sentenize, tokenize
import pymorphy3

_MORPH = pymorphy3.MorphAnalyzer()

DEFAULT_ALLOWLIST = {
    "айти",
    "бэкенд",
    "фронтенд",
    "джуниор",
    "мидл",
    "сеньор",
    "нейросеть",
    "нейросети",
    "нейросетей",
}


@dataclass(frozen=True)
class TokenAnalysis:
    text: str
    start: int
    end: int
    normal_form: str
    pos: str
    case: str
    number: str
    gender: str
    known: bool
    parses: tuple[dict[str, Any], ...]


def _serialize_parse(parse: Any) -> dict[str, Any]:
    return {
        "normal_form": parse.normal_form,
        "score": float(parse.score),
        "pos": parse.tag.POS or "",
        "case": parse.tag.case or "",
        "number": parse.tag.number or "",
        "gender": parse.tag.gender or "",
        "person": parse.tag.person or "",
        "tense": parse.tag.tense or "",
        "tag": str(parse.tag),
    }


def _is_russian_word(value: str) -> bool:
    lowered = value.lower()
    return bool(lowered) and all(("а" <= char <= "я") or char == "ё" for char in lowered)


def _known_word(value: str, allowlist: set[str]) -> bool:
    normalized = value.lower().replace("ё", "е")
    if normalized in allowlist:
        return True
    if not _is_russian_word(value):
        return True
    try:
        return bool(_MORPH.word_is_known(value.lower()))
    except Exception:
        return "UNKN" not in str(_MORPH.parse(value.lower())[0].tag)


def analyze_text(text: str, allowlist: set[str] | None = None) -> dict[str, Any]:
    if not isinstance(text, str):
        raise TypeError("text must be a string")

    allowed = {item.lower().replace("ё", "е") for item in (allowlist or DEFAULT_ALLOWLIST)}
    token_rows: list[TokenAnalysis] = []
    findings: list[dict[str, Any]] = []

    for token in tokenize(text):
        raw = token.text
        if not any(char.isalpha() for char in raw):
            continue

        parses = _MORPH.parse(raw)
        primary = parses[0]
        serialized = tuple(_serialize_parse(parse) for parse in parses[:5])
        known = _known_word(raw, allowed)
        row = TokenAnalysis(
            text=raw,
            start=token.start,
            end=token.stop,
            normal_form=primary.normal_form,
            pos=primary.tag.POS or "",
            case=primary.tag.case or "",
            number=primary.tag.number or "",
            gender=primary.tag.gender or "",
            known=known,
            parses=serialized,
        )
        token_rows.append(row)

        # Unknown dictionary words are review candidates only. Capitalized words are
        # deliberately skipped here because names and brands would dominate the signal.
        if (
            not known
            and len(raw) >= 4
            and _is_russian_word(raw)
            and not raw[:1].isupper()
        ):
            findings.append({
                "ruleId": "ru.lexical.unknown-word",
                "kind": "notice",
                "severity": "review",
                "confidence": 0.58,
                "start": token.start,
                "end": token.stop,
                "before": raw,
                "explanation": "Слова нет в подключённом морфологическом словаре. Это может быть термин, неологизм или опечатка; автоматически исправлять нельзя.",
                "origin": "local-morphology",
            })

    return {
        "schemaVersion": 1,
        "engine": "pymorphy3",
        "sentences": [sentence.text for sentence in sentenize(text)],
        "tokens": [asdict(row) for row in token_rows],
        "findings": findings,
    }
