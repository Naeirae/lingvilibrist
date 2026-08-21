# Lingvilibrist

**Extensible Russian proofreading and editorial review tool with deterministic rules, morphology, and review-first findings.**

Lingvilibrist is a proofreading and editorial analysis tool for Russian text. The project is built around a simple principle: language tooling should explain what it found, show the exact affected fragment, and leave the final decision to the editor instead of silently rewriting prose.

The public edition is being developed as an **offline-first, production-oriented** product. Core checks must work without a private backend or workplace infrastructure. Optional NLP components may be added locally through adapters, but cloud access is not a requirement for the core workflow.

## Why this project exists

Most writing assistants optimize for automatic rewriting. Lingvilibrist takes a different approach:

- deterministic checks first;
- structured findings instead of opaque rewrites;
- morphology and syntax as evidence, not unquestionable truth;
- explicit distinction between an error, a review candidate, and an informational notice;
- minimal edits that preserve the author's voice;
- adapters and rule packs separated from the engine;
- regression tests for every rule that can change text;
- graceful degradation when optional linguistic components are unavailable.

## Planned product shape

```text
apps/
  chrome-extension/       Browser UI and Google Docs adapter
packages/
  core/                   Finding model, normalization, deduplication, rule runner
  rules/                  Public Russian-language deterministic rules
  adapters/               Source and output contracts
  testing/                Fixtures and regression helpers
python/
  nlp/                    Optional local morphology/syntax service
docs/
  ARCHITECTURE.md
  ROADMAP.md
  RULES.md
  PRIVACY.md
fixtures/
  regression/             Input texts and expected findings
```

## MVP scope

The first public MVP should run locally and include:

- whitespace and punctuation-spacing checks;
- repeated-word detection;
- mixed Cyrillic/Latin token detection;
- morphology-backed review candidates;
- lexical unknown-word review;
- cautious agreement candidates;
- manual text analysis;
- Google Docs reading where browser permissions allow it;
- structured findings with rationale, confidence, source range and rule ID;
- filtering of duplicates and no-op findings;
- export of approved findings to a neutral JSON format;
- regression tests for deterministic rules.

## Finding contract

Every analyzer emits a **finding**. A finding does not edit text by itself.

A finding contains, at minimum:

```json
{
  "id": "rule.example@42",
  "ruleId": "rule.example",
  "kind": "replace",
  "severity": "safe",
  "confidence": 1,
  "start": 42,
  "end": 48,
  "before": "example",
  "after": "replacement",
  "explanation": "Human-readable rationale",
  "origin": "deterministic"
}
```

Context-dependent checks use `review`/`notice` semantics rather than pretending to be safe automatic corrections.

## Architecture principles

1. **Core before UI.** The rule engine must be testable without Chrome.
2. **No silent mutation.** Analysis and editing are separate operations.
3. **Adapters at the edges.** Google Docs, browser UI and future integrations do not own linguistic logic.
4. **Rule provenance.** Every deterministic correction has an ID, rationale and regression coverage.
5. **Review-first NLP.** Morphological and syntactic models generate evidence and candidates; ambiguous results stay review-only.
6. **Offline-first.** A user must be able to use the core product without sending text to a mandatory cloud service.
7. **Fail visibly.** Optional analyzers may fail independently without disabling deterministic checks.

## What is intentionally not included

The public repository does not contain:

- private workplace infrastructure;
- proprietary editorial rule sets or internal documents;
- private APIs, credentials or worker URLs;
- company-specific queues, spreadsheets or production logs;
- user-specific data.

Public/editorial profiles will be implemented as explicit rule packs and adapters rather than hard-coded workplace behavior.

## Status

**Pre-1.0 public product build.** The repository is being rebuilt from a working internal prototype into a clean standalone architecture with tests, documentation and release packaging.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the implementation plan and quality gates.

## License

A public source license has **not been selected yet**. The repository is public for development and portfolio visibility; no reuse rights are granted beyond those required by GitHub's terms until a license is added explicitly.
