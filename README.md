# Lingvilibrist

**Extensible Russian proofreading and editorial review tool with deterministic rules, local morphology, and review-first findings.**

Lingvilibrist is a proofreading and editorial analysis tool for Russian text. Language tooling should explain what it found, show the exact affected fragment, and leave the final decision to the editor instead of silently rewriting prose.

The public edition is an **offline-first, production-oriented** product. Core checks run without a private backend or workplace infrastructure. Optional local morphology is connected through Chrome Native Messaging; deterministic checks continue to work when that local host is absent.

## Current runnable MVP

The repository builds an unpacked Manifest V3 Chrome extension with:

- manual text review;
- a narrow Google Docs source adapter;
- persistent local review state;
- deterministic whitespace and punctuation-spacing checks;
- immediate repeated-word review;
- mixed Cyrillic/Latin token review with false-positive protection for compounds such as `IT-команда`;
- structured `safe` / `review` findings;
- selection of approved findings;
- neutral JSON export;
- analyzer failure isolation;
- optional local Razdel + pymorphy3 morphology through Native Messaging;
- conservative unknown-word review and multiple-parse agreement candidates;
- regression fixtures and CI packaging.

The Google Docs adapter is intentionally conservative. If the current Docs UI does not expose enough visible text, Lingvilibrist reports degraded acquisition and asks for manual input instead of pretending that it read the document correctly.

The local NLP path is optional. The extension explicitly shows whether the native host is available; a missing host degrades only morphology, not deterministic proofreading. Installation is documented in [docs/LOCAL_NLP.md](docs/LOCAL_NLP.md).

## Build and test

Requires Node.js 22+.

```bash
npm install
npm test
npm run build:extension
```

The unpacked browser build appears in:

```text
dist/chrome-extension/
```

In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select that directory.

For optional local morphology, install the Python package and register the Native Messaging host for the extension ID. See [docs/LOCAL_NLP.md](docs/LOCAL_NLP.md).

CI runs JavaScript tests, Chrome-source syntax checks, builds the extension, validates the MV3 manifest, scans the public tree for private-infrastructure markers, runs Python NLP tests, smoke-tests the CLI, and publishes the unpacked extension as a workflow artifact.

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

## Repository structure

```text
apps/
  chrome-extension/       Standalone MV3 UI, Google Docs adapter, Native Messaging client
packages/
  core/                   Finding model, validation, normalization, analyzer runner
  rules/                  Public deterministic Russian-language checks
  adapters/               Neutral source-adapter contracts
python/
  nlp/                    Optional local morphology package and Native Messaging host
fixtures/
  russian/                Public regression corpus
docs/
  ARCHITECTURE.md
  ROADMAP.md
  LOCAL_NLP.md
  BRANDING.md
  PRIVACY.md
  SECURITY.md
scripts/
  build-extension.mjs     Reproducible unpacked-extension build
```

## Finding contract

Every analyzer emits a **finding**. A finding does not edit text by itself.

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

The core validates that a finding points to the exact analyzed range. No-op replacements are rejected. Context-dependent checks use `review`/`notice` semantics rather than pretending to be safe automatic corrections.

## Architecture principles

1. **Core before UI.** The rule engine is testable without Chrome.
2. **No silent mutation.** Analysis and editing are separate operations.
3. **Adapters at the edges.** Google Docs, browser UI and integrations do not own linguistic logic.
4. **Rule provenance.** Every deterministic correction has an ID, rationale and regression coverage.
5. **Review-first NLP.** Morphological and syntactic models generate evidence and candidates; ambiguous results stay review-only.
6. **Offline-first.** Core usage and optional morphology do not require sending text to a mandatory remote service.
7. **Fail visibly.** Optional analyzers may fail independently without disabling deterministic checks.
8. **Public/private boundary.** CI guards against accidental inclusion of internal infrastructure markers.

## Next engineering milestones

The next product layers are:

- end-to-end installation smoke tests for the Native Messaging path;
- stronger source acquisition and block classification;
- lexical review and user dictionaries;
- dependency syntax behind a replaceable analyzer interface;
- richer regression corpus and performance gates;
- final icon set and release packaging.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the implementation plan and quality gates.

## Privacy and security

See [docs/PRIVACY.md](docs/PRIVACY.md) and [docs/SECURITY.md](docs/SECURITY.md). The public MVP has no mandatory cloud text-processing path and does not load remote code.

## License

A public source license has **not been selected yet**. The repository is public for development and portfolio visibility; no reuse rights are granted beyond those required by GitHub's terms until a license is added explicitly.
