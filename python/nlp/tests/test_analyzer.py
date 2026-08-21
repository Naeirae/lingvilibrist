from lingvilibrist_nlp import analyze_text


def test_returns_multiple_morphology_parses():
    result = analyze_text("Текста достаточно.")
    token = next(item for item in result["tokens"] if item["text"] == "Текста")
    assert token["normal_form"] == "текст"
    assert len(token["parses"]) >= 1


def test_known_editorial_allowlist_does_not_become_unknown_warning():
    result = analyze_text("бэкенд работает")
    warnings = [item for item in result["findings"] if item["ruleId"] == "ru.lexical.unknown-word"]
    assert not any(item["before"] == "бэкенд" for item in warnings)


def test_capitalized_unknown_word_is_not_blindly_reported_as_typo():
    result = analyze_text("Лингвилибрист работает локально")
    warnings = [item for item in result["findings"] if item["ruleId"] == "ru.lexical.unknown-word"]
    assert not any(item["before"] == "Лингвилибрист" for item in warnings)
