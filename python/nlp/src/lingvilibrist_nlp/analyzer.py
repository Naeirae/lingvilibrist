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


def _compatible_agreement(left: Any, right: Any) -> bool:
    if left.tag.number and right.tag.number and left.tag.number != right.tag.number:
        return False
    if left.tag.case and right.tag.case and left.tag.case != right.tag.case:
        return False
    if left.tag.number == "sing" and right.tag.number == "sing":
        if left.tag.gender and right.tag.gender and left.tag.gender != right.tag.gender:
            return False
    return True


def _agreement_findings(text: str, analyzed_tokens: list[tuple[Any, list[Any]]]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    adjective_pos = {"ADJF", "PRTF"}
    noun_pos = {"NOUN", "NPRO"}

    for index in range(len(analyzed_tokens) - 1):
        left_token, left_parses = analyzed_tokens[index]
        right_token, right_parses = analyzed_tokens[index + 1]
        if text[left_token.stop:right_token.start].strip():
            continue
        if left_parses[0].tag.POS not in adjective_pos or right_parses[0].tag.POS not in noun_pos:
            continue

        left_candidates = [parse for parse in left_parses[:5] if parse.tag.POS in adjective_pos]
        right_candidates = [parse for parse in right_parses[:5] if parse.tag.POS in noun_pos]
        if not left_candidates or not right_candidates:
            continue
        if any(_compatible_agreement(left, right) for left in left_candidates for right in right_candidates):
            continue

        start = left_token.start
        end = right_token.stop
        findings.append({
            "ruleId": "ru.morph.agreement-candidate",
            "kind": "notice",
            "severity": "review",
            "confidence": 0.66,
            "start": start,
            "end": end,
            "before": text[start:end],
            "explanation": "Для нескольких наиболее вероятных морфологических разборов не найдено совместимого согласования по числу, падежу и, в единственном числе, роду. Это сигнал для проверки по контексту, а не автоматическая ошибка.",
            "origin": "local-morphology",
        })

    return findings


def analyze_text(text: str, allowlist: set[str] | None = None) -> dict[str, Any]:
    if not isinstance(text, str):
        raise TypeError("text must be a string")

    allowed = {item.lower().replace("ё", "е") for item in (allowlist or DEFAULT_ALLOWLIST)}
    token_rows: list[TokenAnalysis] = []
    analyzed_tokens: list[tuple[Any, list[Any]]] = []
    findings: list[dict[str, Any]] = []

    for token in tokenize(text):
        raw = token.text
        if not any(char.isalpha() for char in raw):
            continue

        parses = _MORPH.parse(raw)
        analyzed_tokens.append((token, parses))
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

    findings.extend(_agreement_findings(text, analyzed_tokens))

    return {
        "schemaVersion": 1,
        "engine": "pymorphy3",
        "sentences": [sentence.text for sentence in sentenize(text)],
        "tokens": [asdict(row) for row in token_rows],
        "findings": findings,
    }
