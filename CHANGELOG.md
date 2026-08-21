# Changelog

All notable public-product changes are tracked here. The project is currently pre-release; entries remain under `Unreleased` until the first tagged package is cut.

## Unreleased

### Added

- standalone public repository and portfolio-facing documentation;
- browser-independent finding validation, normalization and analyzer orchestration;
- declarative deterministic rule engine;
- public whitespace, punctuation-spacing, mixed-script and repeated-word checks;
- positive/negative regression fixtures;
- Manifest V3 Chrome shell with manual review, Google Docs acquisition attempt, local session persistence and neutral JSON export;
- reproducible extension build and CI artifact;
- optional local Razdel + pymorphy3 morphology package and JSON CLI;
- privacy, security, NLP, rule-model and contribution documentation;
- tagged release workflow scaffold.

### Fixed

- mixed-script detection no longer treats a legitimate hyphen boundary such as `IT-команда` as an internal homoglyph mix;
- editing the analyzed text now invalidates old findings instead of leaving stale approvals visible;
- stale analysis results are ignored when the source changes during a run.
